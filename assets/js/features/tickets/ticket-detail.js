// ── TICKET DETAIL — Design refactorisé ─────────────────────────────────────
// Logique 100% identique à l'original. Seul le HTML/CSS a été retravaillé.

// ── Injection styles (une seule fois) ──────────────────────────────────────
(function injectDetailStyles() {
  if (document.getElementById('td-styles')) return;
  const s = document.createElement('style');
  s.id = 'td-styles';
  s.textContent = `
    /* ── Fonts ── */
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

    /* ── Variables ── */
    :root {
      --td-ink: #0f0e0c;
      --td-ink2: #4a4844;
      --td-ink3: #8a8784;
      --td-ink4: #c4c2be;
      --td-surface: #ffffff;
      --td-bg: #f5f4f0;
      --td-border: #e8e6e0;
      --td-border2: #d0cdc6;
      --td-red: #c0392b; --td-red-bg: #fdf1f0; --td-red-txt: #8b1a14;
      --td-orange: #c05c20; --td-orange-bg: #fef4ed; --td-orange-txt: #8b3a10;
      --td-blue: #1a4fa0; --td-blue-bg: #eef4fd; --td-blue-txt: #0f3070;
      --td-green: #1a7a3c; --td-green-bg: #edfaf3; --td-green-txt: #0e5228;
      --td-amber: #92670a; --td-amber-bg: #fdf8ec; --td-amber-border: #e8d48a;
    }

    /* ── Layout modal ── */
    #m-detail .modal-inner   { font-family: 'Geist', system-ui, sans-serif; color: var(--td-ink); -webkit-font-smoothing: antialiased; }
    #m-detail .td-photo-zone { width: 100%; height: 220px; background: #e8e5df; overflow: hidden; position: relative; cursor: zoom-in; }
    #m-detail .td-photo-zone img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease; }
    #m-detail .td-photo-zone:hover img { transform: scale(1.03); }
    #m-detail .td-photo-count {
      position: absolute; bottom: 12px; right: 12px;
      background: rgba(15,14,12,.55); color: #fff; font-size: 11px; font-weight: 500;
      padding: 3px 8px; border-radius: 20px; letter-spacing: .02em;
    }
    #m-detail .td-thumbs { display: flex; gap: 6px; padding: 10px 20px 0; flex-wrap: wrap; }
    #m-detail .td-thumb {
      width: 66px; height: 66px; border-radius: 8px; overflow: hidden;
      border: 2px solid transparent; cursor: pointer; transition: border-color .15s; flex-shrink: 0;
    }
    #m-detail .td-thumb.active { border-color: var(--td-ink); }
    #m-detail .td-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ── Header body ── */
    #m-detail .td-header-body { padding: 18px 22px 16px; border-bottom: 1px solid var(--td-border); }
    #m-detail .td-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 11px; }

    /* ── Badges ── */
    #m-detail .td-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
      padding: 3px 9px; border-radius: 20px;
    }
    #m-detail .td-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    #m-detail .td-b-critique  { background: var(--td-red-bg);    color: var(--td-red-txt);    border: 1px solid #f5c4c0; }
    #m-detail .td-b-important { background: var(--td-orange-bg); color: var(--td-orange-txt); border: 1px solid #f5d4b8; }
    #m-detail .td-b-normal    { background: var(--td-blue-bg);   color: var(--td-blue-txt);   border: 1px solid #c8daf8; }
    #m-detail .td-b-nouveau   { background: var(--td-blue-bg);   color: var(--td-blue-txt);   border: 1px solid #c8daf8; }
    #m-detail .td-b-en_cours  { background: #f0f8ff;             color: #1a5fa0;              border: 1px solid #c0d8f0; }
    #m-detail .td-b-transmis  { background: #f5f0fe;             color: #4a22b0;              border: 1px solid #d4bef8; }
    #m-detail .td-b-attente   { background: var(--td-amber-bg);  color: var(--td-amber);      border: 1px solid var(--td-amber-border); }
    #m-detail .td-b-resolu    { background: var(--td-green-bg);  color: var(--td-green-txt);  border: 1px solid #b8e8cc; }
    #m-detail .td-b-clos      { background: var(--td-bg);        color: var(--td-ink3);       border: 1px solid var(--td-border2); }
    #m-detail .td-b-cat       { background: var(--td-bg);        color: var(--td-ink2);       border: 1px solid var(--td-border2); }
    #m-detail .td-b-interne   { background: var(--td-amber-bg);  color: var(--td-amber);      border: 1px solid var(--td-amber-border); font-size: 10px; padding: 2px 7px; }

    /* ── Titre ── */
    #m-detail .td-title {
      font-family: 'Instrument Serif', serif;
      font-size: 21px; line-height: 1.25; color: var(--td-ink); margin-bottom: 14px;
    }

    /* ── Meta grid ── */
    #m-detail .td-meta-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 1px; background: var(--td-border);
      border: 1px solid var(--td-border); border-radius: 10px; overflow: hidden;
    }
    #m-detail .td-meta-cell { background: var(--td-surface); padding: 9px 13px; }
    #m-detail .td-meta-cell:nth-child(odd) { background: var(--td-bg); }
    #m-detail .td-meta-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--td-ink4); margin-bottom: 2px; }
    #m-detail .td-meta-val   { font-size: 13px; font-weight: 500; color: var(--td-ink); }
    #m-detail .td-meta-sub   { font-size: 11px; color: var(--td-ink3); margin-top: 1px; }

    /* ── Sections ── */
    #m-detail .td-section { border-bottom: 1px solid var(--td-border); padding: 16px 22px; }
    #m-detail .td-section:last-child { border-bottom: none; }
    #m-detail .td-section-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--td-ink4); margin-bottom: 11px;
      display: flex; align-items: center; gap: 7px;
    }
    #m-detail .td-section-label::after { content: ''; flex: 1; height: 1px; background: var(--td-border); }

    /* ── Upload photo ── */
    #m-detail .td-photo-upload {
      display: flex; align-items: center; gap: 10px; padding: 11px 14px;
      border: 2px dashed var(--td-border2); border-radius: 10px; cursor: pointer;
      transition: border-color .2s, background .2s; font-size: 13px; color: var(--td-ink3);
    }
    #m-detail .td-photo-upload:hover { border-color: var(--td-ink3); background: var(--td-bg); }

    /* ── Description ── */
    #m-detail .td-desc { font-size: 13.5px; line-height: 1.7; color: var(--td-ink2); }

    /* ── Statut control ── */
    #m-detail .td-statut-ctrl {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      background: var(--td-bg); border: 1px solid var(--td-border); border-radius: 10px; padding: 11px 14px;
    }
    #m-detail .td-statut-label { font-size: 11.5px; font-weight: 600; color: var(--td-ink3); white-space: nowrap; }
    #m-detail .td-statut-select {
      appearance: none; -webkit-appearance: none;
      background: var(--td-surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
      border: 1px solid var(--td-border2); border-radius: 8px;
      padding: 6px 28px 6px 11px; font-size: 13px; font-weight: 500;
      color: var(--td-ink); cursor: pointer; font-family: inherit; transition: border-color .15s;
    }
    #m-detail .td-statut-select:focus { outline: none; border-color: var(--td-blue); box-shadow: 0 0 0 3px rgba(26,79,160,.12); }
    #m-detail .td-note-interne {
      background: var(--td-amber-bg); border: 1px solid var(--td-amber-border);
      border-radius: 8px; padding: 7px 11px; font-size: 12px; color: var(--td-amber); flex: 1; min-width: 160px;
    }
    #m-detail .td-syndic-note { font-size: 11px; color: var(--td-ink3); }

    /* ── Historique ── */
    #m-detail .td-hist { padding-left: 7px; }
    #m-detail .td-hist-item { display: flex; gap: 13px; align-items: flex-start; padding: 7px 0; position: relative; }
    #m-detail .td-hist-item + .td-hist-item::before { content: ''; position: absolute; left: 6px; top: -7px; width: 1px; height: 7px; background: var(--td-border); }
    #m-detail .td-hist-dot { width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0; border: 2px solid var(--td-surface); margin-top: 3px; }
    #m-detail .td-hist-dot.active { background: var(--td-ink); box-shadow: 0 0 0 2px var(--td-border2); }
    #m-detail .td-hist-dot.past   { background: var(--td-border2); }
    #m-detail .td-hist-meta { font-size: 11px; color: var(--td-ink3); margin-top: 3px; }

    /* ── Commentaires ── */
    #m-detail .td-comment {
      background: var(--td-bg); border: 1px solid var(--td-border);
      border-radius: 10px; padding: 10px 13px; margin-bottom: 8px; transition: border-color .15s;
    }
    #m-detail .td-comment:hover { border-color: var(--td-border2); }
    #m-detail .td-comment.private { background: var(--td-amber-bg); border-color: var(--td-amber-border); }
    #m-detail .td-cm-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; gap: 8px; }
    #m-detail .td-cm-author { font-size: 12px; font-weight: 600; color: var(--td-ink); display: flex; align-items: center; gap: 6px; }
    #m-detail .td-cm-date   { font-size: 11px; color: var(--td-ink4); white-space: nowrap; }
    #m-detail .td-cm-text   { font-size: 13px; line-height: 1.6; color: var(--td-ink2); }

    /* ── Mention dropdown ── */
    #m-detail .td-mention-list {
      background: var(--td-surface); border: 1px solid var(--td-border2);
      border-radius: 10px; padding: 4px; box-shadow: 0 8px 24px rgba(0,0,0,.08); margin-top: 4px;
    }
    #m-detail .td-mention-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 7px; cursor: pointer; transition: background .12s; }
    #m-detail .td-mention-item:hover { background: var(--td-bg); }
    #m-detail .td-mention-av {
      width: 28px; height: 28px; border-radius: 50%; background: var(--td-blue-bg); color: var(--td-blue-txt);
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0;
    }
    #m-detail .td-mention-name { font-size: 13px; font-weight: 600; color: var(--td-ink); }
    #m-detail .td-mention-role { font-size: 11px; color: var(--td-ink3); }

    /* ── Textarea commentaire ── */
    #m-detail .td-textarea {
      width: 100%; border: 1px solid var(--td-border2); border-radius: 10px;
      padding: 10px 13px; font-size: 13px; font-family: inherit;
      color: var(--td-ink); resize: vertical; min-height: 66px;
      background: var(--td-surface); transition: border-color .15s; outline: none;
    }
    #m-detail .td-textarea:focus { border-color: var(--td-blue); box-shadow: 0 0 0 3px rgba(26,79,160,.1); }
    #m-detail .td-textarea::placeholder { color: var(--td-ink4); }

    /* ── Buttons ── */
    #m-detail .td-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'Geist', inherit; font-size: 13px; font-weight: 500;
      padding: 7px 15px; border-radius: 8px; cursor: pointer;
      transition: background .15s, color .15s, border-color .15s, transform .1s;
      border: 1px solid transparent; white-space: nowrap; text-decoration: none;
    }
    #m-detail .td-btn:active { transform: scale(.97); }
    #m-detail .td-btn-primary { background: var(--td-ink); color: #fff; border-color: var(--td-ink); }
    #m-detail .td-btn-primary:hover { background: #2c2b28; }
    #m-detail .td-btn-ghost { background: transparent; color: var(--td-ink2); border-color: var(--td-border2); }
    #m-detail .td-btn-ghost:hover { background: var(--td-bg); }
    #m-detail .td-btn-danger { background: transparent; color: var(--td-red); border-color: #f5c4c0; }
    #m-detail .td-btn-danger:hover { background: var(--td-red-bg); }
    #m-detail .td-btn-sm { padding: 5px 12px; font-size: 12px; }

    /* ── Checkbox ── */
    #m-detail .td-check-label { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--td-ink3); cursor: pointer; user-select: none; }
    #m-detail .td-check-label input { width: 14px; height: 14px; accent-color: var(--td-ink); cursor: pointer; }

    /* ── Vide (no comment) ── */
    #m-detail .td-empty { font-size: 13px; color: var(--td-ink3); padding: 4px 0 10px; font-style: italic; }

    /* ── Readonly footer (no permission) ── */
    #m-detail .td-no-comment { font-size: 12px; color: var(--td-ink3); font-style: italic; padding: 6px 0; }

    /* ── Footer modal ── */
    #m-detail .td-footer {
      border-top: 1px solid var(--td-border); padding: 13px 22px;
      display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
      background: var(--td-bg);
    }
    #m-detail .td-footer-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    /* ── Photo upload placeholder ── */
    #m-detail .td-no-photo-zone { padding: 0 22px 16px; border-bottom: 1px solid var(--td-border); }
  `;
  document.head.appendChild(s);
})();

// ── Helpers badges ──────────────────────────────────────────────────────────
function tdBadgeUrgence(urgence) {
  const map = {
    critique: ['td-b-critique', '● Critique'],
    important: ['td-b-important', '● Important'],
    normal:    ['td-b-normal',    '● Normal'],
  };
  const [cls, label] = map[urgence] || map.normal;
  return `<span class="td-badge ${cls}">${label}</span>`;
}

function tdBadgeStatut(statut) {
  const map = {
    nouveau:               ['td-b-nouveau',  'Nouveau'],
    en_cours:              ['td-b-en_cours', 'En cours'],
    transmis_syndic:       ['td-b-transmis', 'Transmis syndic'],
    attente_intervention:  ['td-b-attente',  'En attente'],
    résolu:                ['td-b-resolu',   'Résolu'],
    clos:                  ['td-b-clos',     'Clos'],
  };
  const [cls, label] = map[statut] || ['td-b-clos', statut];
  return `<span class="td-badge ${cls}">${label}</span>`;
}

const ICON_CLOSE = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" style="width:14px;height:14px;flex-shrink:0;"><path d="M10 3H6L1 8l5 5h4l5-5-5-5z"/></svg>`;
const ICON_PDF   = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" style="width:13px;height:13px;flex-shrink:0;"><rect x="2" y="4" width="12" height="10" rx="1.5"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><line x1="6" y1="8" x2="10" y2="8"/><line x1="6" y1="11" x2="9" y2="11"/></svg>`;
const ICON_DEL   = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" style="width:13px;height:13px;flex-shrink:0;"><polyline points="2,4 14,4"/><path d="M6 4V3h4v1"/><path d="M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/></svg>`;
const ICON_CAM   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:18px;height:18px;flex-shrink:0;color:var(--td-ink4);"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`;

// ── openDetail ──────────────────────────────────────────────────────────────
async function openDetail(id) {
  const t = cache.tickets.find(x => x.id === id);
  if (!t) return;

  if (!canViewTicket(t)) {
    toast('Vous n\'avez pas accès à ce signalement', 'err');
    return;
  }

  const [{ data: comments }, { data: history }] = await Promise.all([
    sb.from('commentaires').select('*, profiles(nom, prenom, role)').eq('ticket_id', id).order('created_at'),
    sb.from('journal').select('*').eq('entite', 'ticket').eq('entite_id', id).order('created_at', { ascending: true })
  ]);

  const isAuthor = t.auteur_id === user.id;
  const statutLabels = {
    nouveau: 'Nouveau', en_cours: 'En cours',
    transmis_syndic: 'Transmis au syndic', attente_intervention: "En attente d'intervention",
    résolu: 'Résolu', clos: 'Clos'
  };
  const catLabels = {
    ascenseur: 'Ascenseur', fuite: 'Fuite / eau', electricite: 'Électricité',
    securite: 'Sécurité', proprete: 'Propreté', espaces_verts: 'Espaces verts',
    serrurerie: 'Serrurerie', parking: 'Parking', autre: 'Autre'
  };
  const statutHistory = (history || []).filter(h => h.details?.statut || h.action === 'Ticket créé' || h.action === 'Statut modifié');
  const allPhotos = t.photos_urls?.length ? t.photos_urls : (t.photo_url ? [t.photo_url] : []);
  const showPhotoUpload = !isSyndic() && (isManager() || isAuthor);

  // ── Titre modal (inchangé)
  $('m-detail-title').textContent = t.titre;

  // ── Photos
  const photoBlock = allPhotos.length > 0
    ? `<div class="td-photo-zone" id="td-photo-main" onclick="window.open('${allPhotos[0]}','_blank')">
        <img id="td-main-img" src="${allPhotos[0]}" alt="photo signalement">
        ${allPhotos.length > 1 ? `<div class="td-photo-count" id="td-photo-count">1 / ${allPhotos.length}</div>` : ''}
       </div>
       ${allPhotos.length > 1 ? `
       <div class="td-thumbs" id="td-thumbs">
         ${allPhotos.map((url, i) => `
           <div class="td-thumb ${i === 0 ? 'active' : ''}" onclick="tdSwitchPhoto(${i}, '${url}', ${allPhotos.length})">
             <img src="${url}" alt="">
           </div>`).join('')}
       </div>` : ''}`
    : showPhotoUpload
      ? `<div class="td-no-photo-zone">
           <label class="td-photo-upload">
             ${ICON_CAM}
             <span>Ajouter une photo</span>
             <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="uploadTicketPhoto('${t.id}', this)">
           </label>
         </div>`
      : '';

  // ── Meta grid
  const metaGrid = `
    <div class="td-meta-grid">
      <div class="td-meta-cell">
        <div class="td-meta-label">Emplacement</div>
        <div class="td-meta-val">${escHtml(t.batiment || '—')}</div>
        ${t.zone ? `<div class="td-meta-sub">${escHtml(t.zone)}</div>` : ''}
      </div>
      <div class="td-meta-cell">
        <div class="td-meta-label">Déclaré par</div>
        <div class="td-meta-val">${escHtml(displayName(t.auteur_prenom, t.auteur_nom, t.auteur_email, 'N/A'))}</div>
        ${t.auteur_lot ? `<div class="td-meta-sub">Lot ${t.auteur_lot}</div>` : ''}
      </div>
      <div class="td-meta-cell">
        <div class="td-meta-label">Date</div>
        <div class="td-meta-val">${fmt(t.created_at)}</div>
        <div class="td-meta-sub">${depuisJours(t.created_at)}</div>
      </div>
      <div class="td-meta-cell">
        <div class="td-meta-label">Référence</div>
        <div class="td-meta-val" style="font-family:monospace;font-size:11.5px;letter-spacing:.04em;">${t.id.substring(0,8).toUpperCase()}</div>
      </div>
    </div>`;

  // ── Gestion statut
  const statutBlock = canChangeTicketStatus() ? `
    <div class="td-section">
      <div class="td-section-label">Gestion</div>
      <div class="td-statut-ctrl">
        <span class="td-statut-label">Statut :</span>
        <select class="td-statut-select" onchange="changeStatut('${t.id}', this.value)">
          ${['nouveau','en_cours','transmis_syndic','attente_intervention','résolu','clos'].map(s =>
            `<option value="${s}" ${s === t.statut ? 'selected' : ''}>${statutLabels[s]}</option>`
          ).join('')}
        </select>
        ${isSyndic() ? `<span class="td-syndic-note">Mode syndic — statut et commentaires uniquement.</span>` : ''}
        ${t.note_interne && !isCopro() ? `
          <div class="td-note-interne"><strong>Note interne :</strong> ${escHtml(t.note_interne)}</div>` : ''}
      </div>
    </div>` : '';

  // ── Historique
  const histBlock = statutHistory.length > 1 ? `
    <div class="td-section">
      <div class="td-section-label">Historique</div>
      <div class="td-hist">
        ${statutHistory.map((h, i) => {
          const isLast = i === statutHistory.length - 1;
          const statut = h.details?.statut || (h.action === 'Ticket créé' ? 'nouveau' : null);
          return `<div class="td-hist-item">
            <div class="td-hist-dot ${isLast ? 'active' : 'past'}"></div>
            <div>
              <div>${statut ? tdBadgeStatut(statut) : `<span style="font-size:13px;font-weight:500;color:var(--td-ink);">${escHtml(h.action)}</span>`}</div>
              <div class="td-hist-meta">${escHtml(h.user_nom || 'Système')} · ${depuisJours(h.created_at)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // ── Commentaires
  const cmList = (comments || []);
  const cmHtml = cmList.length
    ? cmList.map(c => `
        <div class="td-comment${c.prive ? ' private' : ''}">
          <div class="td-cm-head">
            <span class="td-cm-author">
              ${escHtml(displayName(c.profiles?.prenom, c.profiles?.nom, null, '?'))}
              ${c.prive ? `<span class="td-badge td-b-interne">Interne</span>` : ''}
            </span>
            <span class="td-cm-date">${fmt(c.created_at)}</span>
          </div>
          <div class="td-cm-text">${escHtml(c.texte)}</div>
        </div>`).join('')
    : `<div class="td-empty">Aucun commentaire pour l'instant.</div>`;

  const inputHtml = canComment(t.auteur_id) ? `
    <div style="position:relative;margin-top:4px;">
      <textarea id="new-comment" class="td-textarea"
        placeholder="${isSyndic() ? 'Commentaire visible par tous…' : 'Ajouter un commentaire… (@ pour mentionner)'}"
        oninput="onCommentInput(event)"></textarea>
      <div class="td-mention-list" id="mention-list" style="display:none;"></div>
    </div>
    ${Permissions.has('tickets.comment_private') ? `
    <div style="margin-top:8px;">
      <label class="td-check-label">
        <input type="checkbox" id="comment-prive">
        Note interne (non visible copropriétaires)
      </label>
    </div>` : ''}
    <div style="display:flex;justify-content:flex-end;margin-top:9px;">
      <button class="td-btn td-btn-primary td-btn-sm" onclick="submitComment('${t.id}')">Publier</button>
    </div>`
    : `<p class="td-no-comment">Vous ne pouvez pas commenter ce signalement.</p>`;

  // ── Footer
  const footerHtml = `
    <div class="td-footer">
      <button class="td-btn td-btn-ghost" onclick="closeModal('m-detail')">${ICON_CLOSE} Fermer</button>
      <div class="td-footer-actions">
        ${Permissions.has('tickets.export_pdf')
          ? `<button class="td-btn td-btn-ghost td-btn-sm" onclick="exportTicketPDF('${t.id}')">${ICON_PDF} Exporter PDF</button>`
          : ''}
        ${canDeleteTicket()
          ? `<button class="td-btn td-btn-danger td-btn-sm" onclick="deleteTicket('${t.id}')">${ICON_DEL} Supprimer</button>`
          : ''}
      </div>
    </div>`;

  // ── Assemblage body
  d($('m-detail-body'), `
    <div class="modal-inner">

      <!-- Photos -->
      ${photoBlock}

      <!-- En-tête : badges + titre + meta -->
      <div class="td-header-body">
        <div class="td-badges">
          ${tdBadgeUrgence(t.urgence)}
          ${tdBadgeStatut(t.statut)}
          ${t.categorie ? `<span class="td-badge td-b-cat">${escHtml(catLabels[t.categorie] || t.categorie)}</span>` : ''}
        </div>
        <div class="td-title">${escHtml(t.titre)}</div>
        ${metaGrid}
      </div>

      <!-- Description -->
      ${t.description ? `
      <div class="td-section">
        <div class="td-section-label">Description</div>
        <p class="td-desc">${escHtml(t.description)}</p>
      </div>` : ''}

      <!-- Gestion statut -->
      ${statutBlock}

      <!-- Historique -->
      ${histBlock}

      <!-- Commentaires -->
      <div class="td-section">
        <div class="td-section-label">
          Commentaires
          <span style="font-size:12px;font-weight:500;color:var(--td-ink3);text-transform:none;letter-spacing:0;">(${cmList.length})</span>
        </div>
        <div id="comments-list">${cmHtml}</div>
        ${inputHtml}
      </div>

    </div>
  `);

  // ── Footer
  d($('m-detail-footer'), footerHtml);

  openModal('m-detail');
}

// ── Switcher photos (galerie) ───────────────────────────────────────────────
function tdSwitchPhoto(idx, url, total) {
  const img = document.getElementById('td-main-img');
  const cnt = document.getElementById('td-photo-count');
  const zone = document.getElementById('td-photo-main');
  if (img) img.src = url;
  if (cnt) cnt.textContent = (idx + 1) + ' / ' + total;
  if (zone) zone.onclick = () => window.open(url, '_blank');
  document.querySelectorAll('#td-thumbs .td-thumb').forEach((el, i) => el.classList.toggle('active', i === idx));
}

// ── Les fonctions suivantes sont INCHANGÉES (logique identique à l'original)

async function uploadTicketPhoto(ticketId, input) {
  if (isSyndic()) return;
  const file = input.files[0];
  if (!file) return;
  toast('Upload en cours…', 'ok');
  const path = ticketId + '/' + Date.now() + '.' + file.name.split('.').pop();
  const { error } = await sb.storage.from('tickets').upload(path, file, { upsert: true });
  if (error) { toast('Erreur upload : ' + error.message, 'err'); return; }
  const { data: urlData } = sb.storage.from('tickets').getPublicUrl(path);
  await sb.from('tickets').update({ photo_url: urlData?.publicUrl }).eq('id', ticketId);
  const t = cache.tickets.find(x => x.id === ticketId);
  if (t) t.photo_url = urlData?.publicUrl;
  toast('Photo ajoutée ✓', 'ok');
  openDetail(ticketId);
}

async function changeStatut(id, statut) {
  if (!canChangeTicketStatus()) { toast('Permission insuffisante', 'err'); return; }
  const { error } = await sb.from('tickets').update({ statut, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { toast('Erreur mise à jour', 'err'); return; }
  const t = cache.tickets.find(x => x.id === id);
  if (t) t.statut = statut;
  await addLog('Statut modifié', 'ticket', id, { statut });
  await sendEmailNotif('statut_change', { ...t, statut });
  if (statut === 'transmis_syndic') {
    await sendEmailDirect('nouveau_ticket', null, { ...t, statut, titre: '[Transmis au syndic] ' + t.titre });
  }
  if (statut === 'résolu' || statut === 'clos') {
    await sendEmailDirect('statut_change', null, { ...t, statut, titre: '[' + (statut === 'résolu' ? '✅ Résolu' : '📁 Clos') + '] ' + t.titre });
    await publishFeedEvent('resolved', '✅ Signalement résolu : ' + t.titre + (t.batiment ? ' — ' + t.batiment : ''));
  }
  toast('Statut mis à jour', 'ok');
  updateBadges();
  if (currentPage === 'tickets')   filterTickets();
  if (currentPage === 'dashboard') renderDashboard();
}

async function submitComment(ticketId) {
  const texte = $('new-comment')?.value.trim();
  if (!texte) return;
  const prive = $('comment-prive')?.checked || false;
  const t = cache.tickets.find(x => x.id === ticketId);
  if (!canComment(t?.auteur_id, prive)) { toast('Permission insuffisante', 'err'); return; }
  const { error } = await sb.from('commentaires').insert({ ticket_id: ticketId, auteur_id: user.id, texte, prive });
  if (error) { toast('Erreur commentaire', 'err'); return; }
  await addLog('Commentaire', 'ticket', ticketId, { prive });
  await sendEmailNotif('commentaire', t);
  toast('Commentaire publié', 'ok');
  openDetail(ticketId);
}

async function onCommentInput(e) {
  if (isSyndic()) return;
  const ta = e.target;
  const val = ta.value;
  const before = val.substring(0, ta.selectionStart);
  const atMatch = before.match(/@(\w*)$/);
  const ml = $('mention-list');
  if (!atMatch) { if (ml) ml.style.display = 'none'; return; }
  const query = atMatch[1].toLowerCase();
  if (!cache.managers) {
    const { data } = await sb.from('profiles').select('id,nom,prenom,email,role')
      .in('role', ['administrateur','syndic','membre_cs']).eq('actif', true);
    cache.managers = data || [];
  }
  const matches = cache.managers.filter(m =>
    m.id !== user.id && (
      (m.prenom || '').toLowerCase().startsWith(query) ||
      (m.nom || '').toLowerCase().startsWith(query) ||
      (m.email || '').toLowerCase().startsWith(query)
    )
  ).slice(0, 5);
  if (!ml || !matches.length) { if (ml) ml.style.display = 'none'; return; }
  const roleLabels = { administrateur: 'Admin', syndic: 'Syndic', membre_cs: 'CS' };
  ml.innerHTML = matches.map(m => `
    <div class="td-mention-item" onclick="insertMention('${m.id}','${(m.prenom || m.nom || m.email).replace(/'/g,"\\'")}')">
      <div class="td-mention-av">${(m.prenom || m.nom || '?').charAt(0).toUpperCase()}</div>
      <div>
        <div class="td-mention-name">${escHtml(displayName(m.prenom, m.nom, m.email))}</div>
        <div class="td-mention-role">${roleLabels[m.role] || m.role}</div>
      </div>
    </div>`).join('');
  ml.style.display = 'block';
}

function insertMention(userId, name) {
  const ta = $('new-comment');
  const ml = $('mention-list');
  if (!ta) return;
  const before = ta.value.substring(0, ta.selectionStart);
  ta.value = before.replace(/@\w*$/, '@' + name + ' ') + ta.value.substring(ta.selectionStart);
  ta.focus();
  if (ml) ml.style.display = 'none';
}

async function deleteTicket(id) {
  if (!canDeleteTicket()) { toast('Suppression réservée aux administrateurs', 'err'); return; }
  if (!confirm('Supprimer ce signalement ?')) return;
  const { error } = await sb.from('tickets').delete().eq('id', id);
  if (error) { toast('Erreur suppression', 'err'); return; }
  cache.tickets = cache.tickets.filter(t => t.id !== id);
  closeModal('m-detail');
  toast('Signalement supprimé', 'ok');
  updateBadges();
  renderPage(currentPage);
}

async function exportTicketPDF(ticketId) {
  if (!Permissions.has('tickets.export_pdf')) return;
  const t = cache.tickets.find(x => x.id === ticketId);
  if (!t) return;
  const urgLabels  = { critique: 'Critique', important: 'Important', normal: 'Normal' };
  const urgColors  = { critique: '#c0392b', important: '#c05c20', normal: '#1a4fa0' };
  const urgBg      = { critique: '#fdf1f0', important: '#fef4ed', normal: '#eef4fd' };
  const statLabels = { nouveau: 'Nouveau', en_cours: 'En cours', transmis_syndic: 'Transmis au syndic', attente_intervention: 'En attente', résolu: 'Résolu ✓', clos: 'Clos' };
  const catLabels  = { ascenseur: 'Ascenseur', fuite: 'Fuite / eau', electricite: 'Électricité', securite: 'Sécurité', proprete: 'Propreté', espaces_verts: 'Espaces verts', serrurerie: 'Serrurerie', parking: 'Parking', autre: 'Autre' };
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const allPhotos = t.photos_urls?.length ? t.photos_urls : (t.photo_url ? [t.photo_url] : []);
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Fiche incident</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    @page{size:A4;margin:18mm 16mm;}
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#0f0e0c;font-size:12px;line-height:1.5;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:2px solid #0f0e0c;margin-bottom:20px;}
    .org{font-size:10px;color:#9b9890;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}
    .doc-type{font-family:'Georgia',serif;font-size:22px;font-weight:700;}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;margin-right:6px;}
    .meta-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e8e6e0;border-radius:8px;overflow:hidden;margin:16px 0;}
    .meta-cell{padding:10px 14px;border-bottom:1px solid #e8e6e0;}
    .meta-cell:nth-last-child(-n+2){border-bottom:none;}
    .meta-cell:nth-child(odd){border-right:1px solid #e8e6e0;background:#f5f4f0;}
    .meta-label{font-size:9.5px;font-weight:700;text-transform:uppercase;color:#9b9890;margin-bottom:3px;}
    .meta-value{font-size:12.5px;font-weight:600;}
    .section{margin-top:18px;}
    .section-label{font-size:9.5px;font-weight:700;text-transform:uppercase;color:#9b9890;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e8e6e0;}
    .desc-box{background:#f5f4f0;border:1px solid #e8e6e0;border-radius:6px;padding:12px 14px;font-size:12.5px;line-height:1.6;white-space:pre-wrap;}
    .photos-grid{display:grid;gap:8px;margin-top:8px;}
    .one{grid-template-columns:1fr;} .two{grid-template-columns:1fr 1fr;} .three{grid-template-columns:1fr 1fr 1fr;}
    .photos-grid img{width:100%;border-radius:6px;border:1px solid #e8e6e0;object-fit:cover;max-height:200px;}
    .footer{margin-top:32px;padding-top:10px;border-top:1px solid #e8e6e0;display:flex;justify-content:space-between;font-size:9.5px;color:#9b9890;}
  </style></head><body>
  <div class="header">
    <div>
      <div class="org">Résidence le Floréal · 13-19 Rue du Moucherotte, 38360 Sassenage</div>
      <div class="doc-type">Fiche d'incident</div>
    </div>
    <div style="text-align:right;font-size:10px;color:#9b9890;">
      <div>N° ${t.id.substring(0,8).toUpperCase()}</div>
      <div>${today}</div>
      <div>${escHtml(displayNameFromProfile(profile, user?.email))}</div>
    </div>
  </div>
  <div style="font-size:17px;font-weight:700;margin-bottom:12px;font-family:'Georgia',serif;">${escHtml(t.titre)}</div>
  <div>
    <span class="badge" style="background:${urgBg[t.urgence]};color:${urgColors[t.urgence]};">${urgLabels[t.urgence] || t.urgence}</span>
    <span class="badge" style="background:#edfaf3;color:#0e5228;">${statLabels[t.statut] || t.statut}</span>
    ${t.categorie ? `<span class="badge" style="background:#f5f4f0;color:#4a4844;">${catLabels[t.categorie] || t.categorie}</span>` : ''}
  </div>
  <div class="meta-grid">
    <div class="meta-cell"><div class="meta-label">Bâtiment</div><div class="meta-value">${escHtml(t.batiment || '—')}</div></div>
    <div class="meta-cell"><div class="meta-label">Zone</div><div class="meta-value">${escHtml(t.zone || '—')}</div></div>
    <div class="meta-cell"><div class="meta-label">Date</div><div class="meta-value">${fmt(t.created_at)}</div></div>
    <div class="meta-cell"><div class="meta-label">Déclaré par</div><div class="meta-value">${escHtml(displayName(t.auteur_prenom, t.auteur_nom, t.auteur_email, '—'))}${t.auteur_lot ? ' · Lot ' + t.auteur_lot : ''}</div></div>
  </div>
  ${t.description ? `<div class="section"><div class="section-label">Description</div><div class="desc-box">${escHtml(t.description)}</div></div>` : ''}
  ${allPhotos.length ? `<div class="section"><div class="section-label">Photos (${allPhotos.length})</div><div class="photos-grid ${allPhotos.length === 1 ? 'one' : allPhotos.length === 2 ? 'two' : 'three'}">${allPhotos.map(url => `<img src="${url}">`).join('')}</div></div>` : ''}
  <div class="footer"><span>CoproSync · Résidence le Floréal</span><span>Document confidentiel</span></div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  win.document.close();
}
