// ════════════════════════════════════════════════════════════════
//  COPROSYNC — Notifications Unifiées v2
//  assets/js/services/realtime-notifications.js
//
//  REMPLACE l'ancien realtime-notifications.js
//  Couvre TOUS les déclencheurs :
//  ✅ Commentaire ticket  → auteur + managers
//  ✅ Mention @nom        → personne citée
//  ✅ Changement statut   → auteur du ticket
//  ✅ Ticket critique     → tous les managers (in-app + push)
//  ✅ Message privé DM    → destinataire
//  ✅ Message canal       → membres du canal
//  ✅ Commentaire feed    → auteur du post + mentions
//  ✅ Badge cloche        → Realtime Supabase temps réel
//  ✅ Push mobile SW      → app fermée / arrière-plan
// ════════════════════════════════════════════════════════════════

/* ─── Cache & état ─────────────────────────────────────────────── */
let _notifCache = [];
let _realtimeChannel = null;
let _notifPushReg = null;

/* ─── Icônes par type ──────────────────────────────────────────── */
const NOTIF_ICONS = {
  nouveau_ticket:   '🚨',
  ticket_critique:  '🔴',
  statut_change:    '📋',
  commentaire:      '💬',
  mention:          '🏷️',
  message_prive:    '🔒',
  message_canal:    '💬',
  vote:             '🗳️',
  annonce:          '📢',
  document:         '📄',
  feed_commentaire: '💬',
};

/* ════════════════════════════════════════════════════════════════
   BADGE & CHARGEMENT
════════════════════════════════════════════════════════════════ */

async function checkNotifications() {
  await loadNotifCache();
}

async function loadNotifCache() {
  const { data } = await sb.from('notifications')
    .select('*')
    .eq('destinataire_id', user.id)
    .eq('lu', false)
    .order('created_at', { ascending: false })
    .limit(30);
  _notifCache = data || [];
  refreshNotifBadge();
}

function refreshNotifBadge() {
  const dot = $('notif-dot');
  if (!dot) return;
  const count = _notifCache.length;
  if (count > 0) {
    dot.textContent = count > 9 ? '9+' : count;
    dot.classList.add('visible');
    dot.classList.toggle('notif-mention', _notifCache.some(n => n.type === 'mention'));
  } else {
    dot.textContent = '';
    dot.classList.remove('visible', 'notif-mention');
  }
}

function updateNotifBadge(n) {
  const dot = $('notif-dot');
  if (!dot) return;
  dot.textContent = n > 9 ? '9+' : n;
  dot.classList.add('visible');
}

/* ════════════════════════════════════════════════════════════════
   CRÉATION NOTIFICATIONS (helper central)
   Insère en base → le Realtime déclenche le badge côté destinataire
════════════════════════════════════════════════════════════════ */

async function createNotifications(notifs) {
  if (!notifs || !notifs.length) return;
  const rows = notifs
    .filter(n => n && n.userId)
    .map(n => ({
      destinataire_id:    n.userId,
      destinataire_email: n.email || '',
      sujet:              n.sujet || '',
      corps:              n.corps || '',
      type:               n.type  || 'default',
      reference_id:       n.referenceId || null,
      lu:                 false,
    }));
  if (!rows.length) return;
  const { error } = await sb.from('notifications').insert(rows);
  if (error) console.warn('[notif] insert error:', error.message);
}

/* ════════════════════════════════════════════════════════════════
   DÉCLENCHEURS MÉTIER
════════════════════════════════════════════════════════════════ */

/* ── Mentions @prenom dans un texte ──────────────────────────── */
async function _notifMentions(texte, referenceId) {
  if (!texte || !texte.includes('@')) return;
  const matches = texte.match(/@([\w\-àéèêëîïôùûüç]+)/gi);
  if (!matches || !matches.length) return;

  const noms = [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  const { data: profils } = await sb.from('profiles').select('id, prenom, nom').eq('actif', true);

  const cibles = (profils || []).filter(p => {
    const prenom = (p.prenom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nom    = (p.nom    || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return noms.some(n => {
      const nn = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return prenom.startsWith(nn) || nom.startsWith(nn);
    });
  });

  const auteurNom = displayNameFromProfile(profile, user?.email);
  const notifs = cibles
    .filter(p => p.id !== user.id)
    .map(p => ({
      userId:      p.id,
      sujet:       `🏷️ ${auteurNom} vous a mentionné`,
      corps:       texte.slice(0, 200),
      type:        'mention',
      referenceId: referenceId || null,
    }));

  await createNotifications(notifs);
}

/* ── Commentaire ticket ──────────────────────────────────────── */
async function notifCommentaireTicket(ticket, commentTexte, estPrive) {
  if (!ticket) return;
  const notifs = [];
  const auteurNom = displayNameFromProfile(profile, user?.email);

  // Notif à l'auteur du ticket (sauf si c'est lui qui commente, et pas en privé)
  if (ticket.auteur_id && ticket.auteur_id !== user.id && !estPrive) {
    notifs.push({
      userId:      ticket.auteur_id,
      sujet:       `💬 ${auteurNom} a commenté : ${ticket.titre}`,
      corps:       commentTexte ? commentTexte.slice(0, 200) : '',
      type:        'commentaire',
      referenceId: ticket.id,
    });
  }

  // Notif aux managers si c'est un copro qui commente
  if (isCopro()) {
    const { data: managers } = await sb.from('profiles')
      .select('id')
      .in('role', ['administrateur', 'syndic', 'membre_cs'])
      .eq('actif', true);
    (managers || []).forEach(m => {
      if (m.id !== user.id) {
        notifs.push({
          userId:      m.id,
          sujet:       `💬 ${auteurNom} sur : ${ticket.titre}`,
          corps:       commentTexte ? commentTexte.slice(0, 200) : '',
          type:        'commentaire',
          referenceId: ticket.id,
        });
      }
    });
  }

  await createNotifications(notifs);

  // Mentions dans le commentaire
  if (commentTexte) await _notifMentions(commentTexte, ticket.id);
}

/* ── Message privé (DM) ─────────────────────────────────────── */
async function notifMessagePrive(conversationId, destinataireId, textePreview) {
  if (!destinataireId || destinataireId === user.id) return;
  const auteurNom = displayNameFromProfile(profile, user?.email);
  await createNotifications([{
    userId:      destinataireId,
    sujet:       `🔒 Message privé de ${auteurNom}`,
    corps:       textePreview ? textePreview.slice(0, 200) : '',
    type:        'message_prive',
    referenceId: conversationId,
  }]);
}

/* ── Message dans un canal (groupe) ─────────────────────────── */
async function notifMessageCanal(conversationId, textePreview) {
  const { data: membres } = await sb.from('conversation_membres')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id);
  if (!membres || !membres.length) return;

  const convs = typeof _msgState !== 'undefined' ? (_msgState.conversations || []) : [];
  const conv = convs.find(c => c.id === conversationId);
  const auteurNom = displayNameFromProfile(profile, user?.email);
  const titre = conv ? (conv.titre || 'un canal') : 'un canal';

  const notifs = membres.map(m => ({
    userId:      m.user_id,
    sujet:       `💬 ${auteurNom} dans ${titre}`,
    corps:       textePreview ? textePreview.slice(0, 200) : '',
    type:        'message_canal',
    referenceId: conversationId,
  }));
  await createNotifications(notifs);
}

/* ── Commentaire sur un post du Feed ────────────────────────── */
async function notifFeedCommentaire(postId, postAuteurId, textePreview) {
  if (!postAuteurId || postAuteurId === user.id) return;
  const auteurNom = displayNameFromProfile(profile, user?.email);
  await createNotifications([{
    userId:      postAuteurId,
    sujet:       `💬 ${auteurNom} a commenté votre post`,
    corps:       textePreview ? textePreview.slice(0, 200) : '',
    type:        'feed_commentaire',
    referenceId: String(postId),
  }]);
  // Mentions dans le commentaire
  if (textePreview) await _notifMentions(textePreview, String(postId));
}

/* ── Nouveau ticket critique → managers ─────────────────────── */
async function notifNouveauTicketCritique(ticket) {
  const { data: managers } = await sb.from('profiles')
    .select('id')
    .in('role', ['administrateur', 'syndic', 'membre_cs'])
    .eq('actif', true);
  const notifs = (managers || [])
    .filter(m => m.id !== user.id)
    .map(m => ({
      userId:      m.id,
      sujet:       `🔴 URGENT — ${ticket.titre}`,
      corps:       [ticket.batiment, ticket.zone].filter(Boolean).join(' · '),
      type:        'ticket_critique',
      referenceId: ticket.id,
    }));
  await createNotifications(notifs);
}

/* ════════════════════════════════════════════════════════════════
   REALTIME — badge temps réel + messages
════════════════════════════════════════════════════════════════ */

function startRealtime() {
  if (_realtimeChannel) return;

  // Canal 1 : nouvelles notifications destinées à cet utilisateur
  _realtimeChannel = sb.channel('notifs-' + user.id)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'notifications',
      filter: `destinataire_id=eq.${user.id}`,
    }, payload => {
      const n = payload.new;
      dbg('[notif realtime]', n.type, n.sujet);
      _notifCache.unshift(n);
      refreshNotifBadge();
      // Toast in-app
      const ico = NOTIF_ICONS[n.type] || '🔔';
      toast(`${ico} ${n.sujet}`, n.type === 'mention' ? 'warn' : 'ok');
      // Push mobile (si app en arrière-plan, le SW l'intercepte)
      _pushLocalNotif(n);
    })
    .subscribe(status => dbg('[realtime notifs] status:', status));

  // Canal 2 : votes en direct (barres résultats temps réel)
  sb.channel('votes-live')
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'votes_reponses',
    }, async payload => {
      const voteId = (payload.new && payload.new.vote_id) || (payload.old && payload.old.vote_id);
      if (!voteId) return;
      const { data } = await sb.from('votes_reponses').select('*').eq('vote_id', voteId);
      if (typeof _allReponsesCache !== 'undefined') _allReponsesCache[voteId] = data || [];
      if (typeof _votesCache !== 'undefined') {
        const nonRepondus = _votesCache.filter(v => v.statut === 'ouvert' && !_reponsesCache[v.id]).length;
        const el = $('nc-votes');
        if (el) { el.textContent = nonRepondus; el.style.display = nonRepondus > 0 ? '' : 'none'; }
      }
      if (currentPage === 'votes' && typeof renderVotesList === 'function') renderVotesList();
    })
    .subscribe();

  // Canal 3 : nouveaux messages → badge nav instantané
  sb.channel('messages-badge-' + user.id)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'messages',
    }, payload => {
      const m = payload.new;
      if (!m || m.auteur_id === user.id) return;
      // Ignorer si la conv est active et visible
      if (
        typeof _msgState !== 'undefined' &&
        _msgState.activeConvId === m.conversation_id &&
        (typeof $('msg-main') === 'object' && $('msg-main') !== null)
      ) return;
      // Badge
      if (typeof _msgState !== 'undefined') {
        _msgState.unreadByConv = _msgState.unreadByConv || {};
        _msgState.unreadByConv[m.conversation_id] =
          (_msgState.unreadByConv[m.conversation_id] || 0) + 1;
        if (typeof renderSidebarGroups   === 'function') renderSidebarGroups();
        if (typeof renderSidebarDMs      === 'function') renderSidebarDMs();
        if (typeof _updateMobileTabBadges === 'function') _updateMobileTabBadges();
      }
      // Badge nav global messages
      const ncMsg = $('nc-messages');
      if (ncMsg) { ncMsg.textContent = ''; ncMsg.style.display = ''; }
    })
    .subscribe();
}

/* ════════════════════════════════════════════════════════════════
   PUSH MOBILE (Service Worker)
════════════════════════════════════════════════════════════════ */

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    _notifPushReg = reg;
    dbg('[SW] enregistré');
    setTimeout(() => askNotifPermission(reg), 3000);
  } catch (e) {
    dbg('[SW] erreur:', e.message);
  }

  // Clic sur notif → action dans l'app
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'OPEN_TICKET' && e.data.ticketId) {
      if (typeof openDetail === 'function') openDetail(e.data.ticketId);
    }
    if (e.data && e.data.type === 'OPEN_PAGE' && e.data.page) {
      if (typeof nav === 'function') nav(e.data.page);
    }
  });

  // Prompt install PWA
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      if (deferredPrompt) toast('📱 Installez l\'app pour des notifs même hors ligne', 'warn');
    }, 30000);
  });
}

async function askNotifPermission(reg) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission === 'denied')  return;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    dbg('[Push] permission accordée');
    toast('🔔 Notifications activées ! Vous serez alerté même hors de l\'app.', 'ok');
  }
}

async function _pushLocalNotif(notifRow) {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
  try {
    const reg = _notifPushReg || await navigator.serviceWorker.ready;
    const ico = NOTIF_ICONS[notifRow.type] || '🔔';
    await reg.showNotification(`${ico} ${notifRow.sujet || 'CoproSync'}`, {
      body:               (notifRow.corps || '').slice(0, 120),
      icon:               '/icon-192.png',
      badge:              '/favicon-32.png',
      tag:                notifRow.reference_id || ('coprosync-' + (notifRow.type || 'notif')),
      data:               { ticketId: notifRow.reference_id, type: notifRow.type },
      vibrate:            [200, 100, 200],
      requireInteraction: notifRow.type === 'ticket_critique' || notifRow.type === 'mention',
    });
  } catch (e) {
    dbg('[Push] erreur:', e.message);
  }
}

// Compat avec l'ancien appel pushNotif() utilisé dans ticket-form.js etc.
async function pushNotif(title, body, type, ticketId) {
  await _pushLocalNotif({
    sujet:        title,
    corps:        body,
    type:         type,
    reference_id: ticketId,
  });
}

/* ════════════════════════════════════════════════════════════════
   PANNEAU CLOCHE — UI
════════════════════════════════════════════════════════════════ */

function toggleNotifPanel() {
  const panel = $('notif-panel');
  if (!panel) return;
  const isVisible = panel.style.display === 'block';
  if (!isVisible) {
    renderNotifPanel();
    panel.style.display = 'block';
    setTimeout(() => document.addEventListener('click', _closeNotifOnOutside, { once: true }), 10);
  } else {
    panel.style.display = 'none';
  }
}

function _closeNotifOnOutside(e) {
  const wrap = $('notif-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const p = $('notif-panel');
    if (p) p.style.display = 'none';
  }
}

function renderNotifPanel() {
  const panel = $('notif-panel');
  if (!panel) return;
  const all = _notifCache;

  const iconMap = {
    ticket_critique:  '🔴',
    nouveau_ticket:   '🚨',
    statut_change:    '📋',
    commentaire:      '💬',
    mention:          '🏷️',
    message_prive:    '🔒',
    message_canal:    '💬',
    feed_commentaire: '💬',
    vote:             '🗳️',
    annonce:          '📢',
    document:         '📄',
  };

  panel.innerHTML = `
    <div class="notif-panel-header">
      <span>Notifications ${all.length > 0
        ? `<span style="color:var(--red);font-size:12px;">(${all.length})</span>`
        : ''}</span>
      ${all.length > 0
        ? `<button class="btn btn-ghost btn-sm" onclick="markAllRead()">Tout lire</button>`
        : ''}
    </div>
    ${all.length === 0
      ? `<div style="padding:32px 20px;text-align:center;color:var(--text-3);font-size:13px;">
           <div style="font-size:28px;margin-bottom:8px;">✓</div>
           Vous êtes à jour !
         </div>`
      : all.map(n => {
          const ico = iconMap[n.type] || '🔔';
          return `<div class="notif-panel-item ${n.lu ? '' : 'unread'} ${n.type === 'mention' ? 'mention' : ''}"
               onclick="_clickNotif('${n.id}','${n.reference_id || ''}','${n.type || ''}')">
            <div class="notif-ico">${ico}</div>
            <div style="flex:1;min-width:0;">
              <div class="notif-txt" style="${!n.lu ? 'font-weight:600;' : ''}">${n.sujet}</div>
              <div class="notif-time">${depuisJours(n.created_at)}</div>
            </div>
          </div>`;
        }).join('')}
    <div style="padding:10px 16px;border-top:1px solid var(--border);">
      <button class="btn btn-ghost btn-sm" style="width:100%;"
        onclick="nav('notifications');const p=$('notif-panel');if(p)p.style.display='none'">
        Voir tout l'historique →
      </button>
    </div>`;
}

async function _clickNotif(notifId, referenceId, type) {
  // Marquer comme lu
  await sb.from('notifications').update({ lu: true }).eq('id', notifId);
  _notifCache = _notifCache.filter(n => n.id !== notifId);
  refreshNotifBadge();
  const p = $('notif-panel');
  if (p) p.style.display = 'none';

  // Navigation contextuelle
  if (referenceId && (
    type === 'nouveau_ticket' ||
    type === 'ticket_critique' ||
    type === 'statut_change' ||
    type === 'commentaire' ||
    type === 'mention'
  )) {
    if (typeof openDetail === 'function') openDetail(referenceId);
  } else if (type === 'message_prive' || type === 'message_canal') {
    if (typeof nav === 'function') nav('messages');
  } else if (type === 'feed_commentaire') {
    if (typeof nav === 'function') nav('messages');
    setTimeout(() => {
      if (typeof openFeedThread === 'function') openFeedThread(referenceId);
    }, 400);
  } else if (type === 'vote') {
    if (typeof nav === 'function') nav('votes');
  } else if (type === 'annonce') {
    if (typeof nav === 'function') nav('annonces');
  } else if (type === 'document') {
    if (typeof nav === 'function') nav('documents');
  }
}

async function markAllRead() {
  await sb.from('notifications')
    .update({ lu: true })
    .eq('destinataire_id', user.id)
    .eq('lu', false);
  _notifCache = [];
  refreshNotifBadge();
  renderNotifPanel();
}

async function markRead(id) {
  await sb.from('notifications').update({ lu: true }).eq('id', id);
  _notifCache = _notifCache.filter(n => n.id !== id);
  refreshNotifBadge();
}
