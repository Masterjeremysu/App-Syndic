// ════════════════════════════════════════════════════════════════
//  AGENDA
//  assets/js/features/agenda/agenda.js
// ════════════════════════════════════════════════════════════════

const EVENT_TYPES = {
  ag:         { label:'AG',         color:'#6366f1', dot:'violet' },
  reunion_cs: { label:'CS',         color:'#f59e0b', dot:'orange' },
  artisan:    { label:'Artisan',    color:'#10b981', dot:'green'  },
  controle:   { label:'Contrôle',   color:'#ef4444', dot:'red'    },
  autre:      { label:'Autre',      color:'#6b7280', dot:''       },
};

let _agendaDate   = new Date();
let _agendaEvents = [];
let _agendaView   = 'cal';
let _selectedDay  = null;   // date string YYYY-MM-DD sélectionnée dans le calendrier

// ── CHARGEMENT ──────────────────────────────────────────────────
async function loadEvents() {
  try {
    const { data, error } = await sb
      .from('agenda_events')
      .select('*')
      .order('date_debut', { ascending: true });

    if (error) throw error;
    _agendaEvents = data || [];
  } catch (err) {
    console.warn('[agenda] loadEvents error', err);
    _agendaEvents = [];
    // On affiche un message discret dans le panneau latéral sans crasher
    const sideEl = $('agenda-side-list');
    if (sideEl) sideEl.innerHTML = `<div style="font-size:12px;color:var(--text-3);text-align:center;padding:16px;">Impossible de charger les événements.</div>`;
  }
}

// ── RENDER PRINCIPAL ─────────────────────────────────────────────
async function renderAgenda() {
  $('page').innerHTML = `
  <div style="padding:24px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><h1>Agenda</h1><p>Réunions, passages artisans, contrôles…</p></div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div style="display:flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;">
          <button class="btn btn-ghost btn-sm" id="view-cal-btn"
            onclick="setAgendaView('cal')"
            style="border-radius:0;border:none;background:var(--accent);color:#fff;">📅 Calendrier</button>
          <button class="btn btn-ghost btn-sm" id="view-list-btn"
            onclick="setAgendaView('list')"
            style="border-radius:0;border:none;">☰ Liste</button>
        </div>
        ${isManager() ? `<button class="btn btn-primary" onclick="openNewEvent()">+ Ajouter</button>` : ''}
      </div>
    </div>

    <div id="agenda-cal-view">
      <div class="agenda-layout">
        <div class="agenda-calendar">
          <div class="card" style="padding:20px;">
            <div class="cal-header">
              <button class="btn btn-ghost btn-sm" onclick="agendaMonth(-1)">‹</button>
              <div class="cal-title" id="cal-title"></div>
              <button class="btn btn-ghost btn-sm" onclick="agendaMonth(1)">›</button>
            </div>
            <div class="cal-grid" id="cal-grid"></div>
          </div>
        </div>
        <div class="agenda-sidebar-panel">
          <div class="card" style="padding:16px;">
            <div style="font-family:var(--font-head);font-weight:700;font-size:14px;margin-bottom:12px;" id="agenda-side-title">
              Prochains événements
            </div>
            <div id="agenda-side-list">
              <div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">Chargement…</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="agenda-list-view" style="display:none;">
      <div id="agenda-full-list"></div>
    </div>
  </div>`;

  await loadEvents();
  _agendaView = 'cal';
  _selectedDay = null;
  renderCal();
}

// ── VUE CALENDRIER ───────────────────────────────────────────────
function renderCal() {
  const titleEl = $('cal-title');
  const gridEl  = $('cal-grid');
  if (!titleEl || !gridEl) return;

  const y = _agendaDate.getFullYear();
  const m = _agendaDate.getMonth(); // 0-based

  // En-tête mois / année
  titleEl.textContent = _agendaDate.toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

  // En-têtes jours
  const jours = ['L','M','M','J','V','S','D'];
  let html = jours.map(j => `<div class="cal-dow">${j}</div>`).join('');

  // 1er jour du mois (0=dim → on ramène à lundi=0)
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const todayStr = dateStr(today);

  // Map date→events pour ce mois
  const evMap = {};
  _agendaEvents.forEach(e => {
    const d = e.date_debut ? e.date_debut.slice(0, 10) : null;
    if (!d) return;
    if (!evMap[d]) evMap[d] = [];
    evMap[d].push(e);
  });

  // Cases vides avant le 1er
  for (let i = 0; i < firstDow; i++) html += `<div class="cal-day cal-day-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const ds   = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evs  = evMap[ds] || [];
    const isToday   = ds === todayStr;
    const isSelected = ds === _selectedDay;

    let dots = '';
    if (evs.length) {
      const shown = evs.slice(0, 3);
      dots = `<div class="cal-dots">${shown.map(e => {
        const col = (EVENT_TYPES[e.type] || EVENT_TYPES.autre).color;
        return `<span class="cal-dot" style="background:${col};"></span>`;
      }).join('')}${evs.length > 3 ? `<span class="cal-dot-more">+${evs.length-3}</span>` : ''}</div>`;
    }

    html += `<div
      class="cal-day${isToday ? ' cal-today' : ''}${isSelected ? ' cal-selected' : ''}${evs.length ? ' cal-has-ev' : ''}"
      onclick="selectDay('${ds}')"
      title="${evs.length ? evs.length + ' événement(s)' : ''}"
    >
      <span class="cal-day-num">${d}</span>
      ${dots}
    </div>`;
  }

  gridEl.innerHTML = html;

  // Panneau latéral : événements du jour sélectionné ou prochains
  renderSidePanel();
}

function selectDay(ds) {
  _selectedDay = (_selectedDay === ds) ? null : ds; // toggle
  renderCal();
}

function renderSidePanel() {
  const titleEl = $('agenda-side-title');
  const listEl  = $('agenda-side-list');
  if (!titleEl || !listEl) return;

  const now = new Date();

  if (_selectedDay) {
    const evs = _agendaEvents.filter(e => e.date_debut && e.date_debut.slice(0,10) === _selectedDay);
    const dateLabel = new Date(_selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    titleEl.textContent = dateLabel;

    if (!evs.length) {
      listEl.innerHTML = `<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px;">Aucun événement ce jour.</div>`;
      return;
    }
    listEl.innerHTML = evs.map(e => renderEventItem(e)).join('');
    return;
  }

  // Sinon : prochains événements
  titleEl.textContent = 'Prochains événements';
  const upcoming = _agendaEvents
    .filter(e => e.date_debut && new Date(e.date_debut) >= now)
    .slice(0, 6);

  if (!upcoming.length) {
    listEl.innerHTML = `<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px;">Aucun événement à venir.</div>`;
    return;
  }
  listEl.innerHTML = upcoming.map(e => renderEventItem(e)).join('');
}

// ── VUE LISTE ────────────────────────────────────────────────────
function setAgendaView(v) {
  _agendaView = v;
  const calView  = $('agenda-cal-view');
  const listView = $('agenda-list-view');
  const calBtn   = $('view-cal-btn');
  const listBtn  = $('view-list-btn');
  if (!calView || !listView) return;

  calView.style.display  = v === 'cal'  ? '' : 'none';
  listView.style.display = v === 'list' ? '' : 'none';

  if (calBtn) { calBtn.style.background = v === 'cal'  ? 'var(--accent)' : ''; calBtn.style.color = v === 'cal'  ? '#fff' : ''; }
  if (listBtn){ listBtn.style.background = v === 'list' ? 'var(--accent)' : ''; listBtn.style.color = v === 'list' ? '#fff' : ''; }

  if (v === 'list') renderAgendaList();
}

function renderAgendaList() {
  const el = $('agenda-full-list');
  if (!el) return;
  const now = new Date();
  const upcoming = _agendaEvents.filter(e => e.date_debut && new Date(e.date_debut) >= now);
  const past     = _agendaEvents.filter(e => e.date_debut && new Date(e.date_debut) < now).reverse();

  if (!upcoming.length && !past.length) {
    el.innerHTML = emptyState('📅', 'Agenda vide', 'Aucun événement programmé. Les AG, réunions et interventions apparaîtront ici.');
    return;
  }
  let html = '';
  if (upcoming.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">À venir</div>`;
    html += upcoming.map(e => renderEventItem(e)).join('');
  }
  if (past.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px;">Passés</div>`;
    html += `<div style="opacity:.6;">${past.slice(0, 10).map(e => renderEventItem(e)).join('')}</div>`;
  }
  el.innerHTML = html;
}

// ── ITEM ÉVÉNEMENT ────────────────────────────────────────────────
function renderEventItem(e) {
  const type  = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
  const debut = e.date_debut ? new Date(e.date_debut) : null;
  const dateLabel = debut
    ? debut.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
    : '—';
  const heureLabel = debut
    ? debut.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
    : '';

  return `<div class="event-item" style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
    <div style="width:8px;height:8px;border-radius:50%;background:${type.color};margin-top:5px;flex-shrink:0;"></div>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:600;font-size:13px;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(e.titre || 'Sans titre')}</div>
      <div style="font-size:11px;color:var(--text-3);margin-top:2px;">
        ${dateLabel}${heureLabel ? ' · ' + heureLabel : ''}
        <span style="display:inline-block;margin-left:4px;padding:1px 6px;border-radius:4px;background:${type.color}22;color:${type.color};font-size:10px;">${type.label}</span>
      </div>
      ${e.lieu ? `<div style="font-size:11px;color:var(--text-3);margin-top:1px;">📍 ${escHtml(e.lieu)}</div>` : ''}
    </div>
    ${isManager() ? `<button class="btn btn-ghost btn-xs" style="flex-shrink:0;font-size:11px;" onclick="openEditEvent('${e.id}')">✏️</button>` : ''}
  </div>`;
}

// ── NAVIGATION MOIS ───────────────────────────────────────────────
function agendaMonth(delta) {
  _agendaDate = new Date(_agendaDate.getFullYear(), _agendaDate.getMonth() + delta, 1);
  _selectedDay = null;
  renderCal();
}

// ── MODAL AJOUT / ÉDITION ─────────────────────────────────────────
function openNewEvent() {
  _openEventModal(null);
}

function openEditEvent(id) {
  const ev = _agendaEvents.find(e => e.id === id);
  _openEventModal(ev || null);
}

function _openEventModal(ev) {
  const isEdit = !!ev;
  const types  = Object.entries(EVENT_TYPES)
    .map(([k, v]) => `<option value="${k}"${ev?.type === k ? ' selected' : ''}>${v.label}</option>`)
    .join('');

  // Date/heure par défaut : demain 10:00
  const defDate = ev?.date_debut
    ? ev.date_debut.slice(0, 16)
    : (() => {
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
        return d.toISOString().slice(0, 16);
      })();

  // Réutilise la modale générique si disponible, sinon crée une div inline
  const html = `
    <div class="overlay" id="m-agenda" style="z-index:1000;" onclick="if(event.target===this)closeModal('m-agenda')">
      <div class="modal">
        <div class="mh">
          <span class="mh-title">${isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}</span>
          <button class="mclose" onclick="closeModal('m-agenda')">×</button>
        </div>
        <div class="mb" style="display:flex;flex-direction:column;gap:12px;">
          <div class="fg" style="margin:0;">
            <label class="label">Titre *</label>
            <input type="text" id="ev-titre" class="input" placeholder="Ex : AG annuelle" value="${escHtml(ev?.titre || '')}">
          </div>
          <div class="fg" style="margin:0;">
            <label class="label">Type</label>
            <select id="ev-type" class="select">${types}</select>
          </div>
          <div style="display:flex;gap:8px;">
            <div class="fg" style="margin:0;flex:1;">
              <label class="label">Début *</label>
              <input type="datetime-local" id="ev-debut" class="input" value="${defDate}">
            </div>
            <div class="fg" style="margin:0;flex:1;">
              <label class="label">Fin</label>
              <input type="datetime-local" id="ev-fin" class="input" value="${ev?.date_fin ? ev.date_fin.slice(0,16) : ''}">
            </div>
          </div>
          <div class="fg" style="margin:0;">
            <label class="label">Lieu</label>
            <input type="text" id="ev-lieu" class="input" placeholder="Salle de réunion, sous-sol…" value="${escHtml(ev?.lieu || '')}">
          </div>
          <div class="fg" style="margin:0;">
            <label class="label">Description</label>
            <textarea id="ev-desc" class="textarea" rows="3" placeholder="Détails, ordre du jour…">${escHtml(ev?.description || '')}</textarea>
          </div>
        </div>
        <div class="mf" style="justify-content:${isEdit ? 'space-between' : 'flex-end'};">
          ${isEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteEvent('${ev.id}')">Supprimer</button>` : ''}
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="closeModal('m-agenda')">Annuler</button>
            <button class="btn btn-primary" onclick="submitEvent(${isEdit ? `'${ev.id}'` : 'null'})">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>`;

  // Injecte dans le body et ouvre
  const existing = $('m-agenda');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  // focus titre
  setTimeout(() => $('ev-titre')?.focus(), 60);
}

async function submitEvent(id) {
  const titre = $('ev-titre')?.value.trim();
  if (!titre) { toast('Le titre est obligatoire.', 'error'); return; }
  const debut = $('ev-debut')?.value;
  if (!debut) { toast('La date de début est obligatoire.', 'error'); return; }

  const payload = {
    titre,
    type:        $('ev-type')?.value || 'autre',
    date_debut:  new Date(debut).toISOString(),
    date_fin:    $('ev-fin')?.value    ? new Date($('ev-fin').value).toISOString()   : null,
    lieu:        $('ev-lieu')?.value.trim()  || null,
    description: $('ev-desc')?.value.trim()  || null,
  };

  try {
    let error;
    if (id) {
      ({ error } = await sb.from('agenda_events').update(payload).eq('id', id));
    } else {
      ({ error } = await sb.from('agenda_events').insert(payload));
    }
    if (error) throw error;
    toast(id ? 'Événement modifié.' : 'Événement ajouté.', 'success');
    closeModal('m-agenda');
    await loadEvents();
    renderCal();
    if (_agendaView === 'list') renderAgendaList();
  } catch (err) {
    console.error('[agenda] submitEvent', err);
    toast('Erreur lors de l\'enregistrement.', 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('Supprimer cet événement ?')) return;
  try {
    const { error } = await sb.from('agenda_events').delete().eq('id', id);
    if (error) throw error;
    toast('Événement supprimé.', 'success');
    closeModal('m-agenda');
    await loadEvents();
    renderCal();
    if (_agendaView === 'list') renderAgendaList();
  } catch (err) {
    console.error('[agenda] deleteEvent', err);
    toast('Erreur lors de la suppression.', 'error');
  }
}

// ── UTILITAIRES ──────────────────────────────────────────────────
function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
