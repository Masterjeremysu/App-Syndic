// ════════════════════════════════════════════════════════════════
//  AGENDA
//  assets/js/features/agenda/agenda.js
// ════════════════════════════════════════════════════════════════

const EVENT_TYPES = {
  ag:         { label:'AG',         color:'#6366f1', bg:'rgba(99,102,241,.12)'  },
  reunion_cs: { label:'CS',         color:'#f59e0b', bg:'rgba(245,158,11,.12)'  },
  artisan:    { label:'Artisan',    color:'#10b981', bg:'rgba(16,185,129,.12)'  },
  controle:   { label:'Contrôle',   color:'#ef4444', bg:'rgba(239,68,68,.12)'   },
  autre:      { label:'Autre',      color:'#6b7280', bg:'rgba(107,114,128,.12)' },
};

let _agendaDate  = new Date();
let _agendaView  = 'cal';
let _selectedDay = null;

// ── HELPERS ──────────────────────────────────────────────────────
function _agendaEvents() { return cache.evenements || []; }

function _fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
}
function _fmtHeure(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}
function _dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── RENDER PRINCIPAL ─────────────────────────────────────────────
async function renderAgenda() {
  $('page').innerHTML = `
  <style>
    .agenda-layout { display:grid; grid-template-columns:1fr 340px; gap:20px; margin-top:20px; }
    @media(max-width:900px){ .agenda-layout{ grid-template-columns:1fr; } }

    .cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    .cal-title  { font-family:var(--font-head); font-weight:800; font-size:18px; color:var(--text-1); }

    .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
    .cal-dow  { text-align:center; font-size:11px; font-weight:600; color:var(--text-3);
                text-transform:uppercase; letter-spacing:.06em; padding:6px 0 10px; }

    .cal-day  { position:relative; aspect-ratio:1; display:flex; flex-direction:column;
                align-items:center; justify-content:flex-start; padding-top:6px;
                border-radius:10px; cursor:pointer; transition:background .15s;
                font-size:13px; color:var(--text-2); user-select:none; }
    .cal-day:hover     { background:var(--surface-2,rgba(0,0,0,.04)); }
    .cal-day-empty     { cursor:default; pointer-events:none; }
    .cal-day-num       { font-weight:500; line-height:1; }
    .cal-today .cal-day-num {
      background:var(--accent); color:#fff; width:26px; height:26px;
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-weight:700;
    }
    .cal-selected { background:var(--surface-2,rgba(0,0,0,.04)); outline:2px solid var(--accent); outline-offset:-2px; }
    .cal-has-ev   { color:var(--text-1); font-weight:600; }
    .cal-dots     { display:flex; gap:3px; margin-top:3px; align-items:center; justify-content:center; }
    .cal-dot      { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
    .cal-dot-more { font-size:9px; color:var(--text-3); line-height:1; }

    .ev-card { display:flex; align-items:stretch; background:var(--surface-1);
               border:1px solid var(--border); border-radius:12px; overflow:hidden;
               margin-bottom:8px; transition:box-shadow .15s, transform .15s; }
    .ev-card:hover     { box-shadow:0 4px 16px rgba(0,0,0,.07); transform:translateY(-1px); }
    .ev-card-stripe    { width:4px; flex-shrink:0; }
    .ev-card-body      { flex:1; padding:12px 14px; min-width:0; }
    .ev-card-head      { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:5px; }
    .ev-card-title     { font-weight:700; font-size:14px; color:var(--text-1); line-height:1.3; }
    .ev-card-badge     { flex-shrink:0; font-size:10px; font-weight:700; padding:2px 8px;
                         border-radius:20px; letter-spacing:.04em; white-space:nowrap; }
    .ev-card-meta      { font-size:12px; color:var(--text-3); display:flex; flex-direction:column; gap:3px; }
    .ev-card-meta span { display:flex; align-items:center; gap:5px; }

    .ag-section-title { font-family:var(--font-head); font-weight:700; font-size:11px;
                        color:var(--text-3); text-transform:uppercase; letter-spacing:.08em;
                        margin:20px 0 10px; padding-bottom:6px; border-bottom:1px solid var(--border); }

    .view-toggle        { display:flex; border:1px solid var(--border); border-radius:var(--r-sm); overflow:hidden; }
    .view-toggle button { border:none; border-radius:0; padding:6px 14px; font-size:13px;
                          cursor:pointer; transition:background .15s, color .15s;
                          background:transparent; color:var(--text-2); font-family:inherit; }
    .view-toggle button.active { background:var(--accent); color:#fff; }
  </style>

  <div style="padding:24px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><h1>Agenda</h1><p>Réunions, passages artisans, contrôles…</p></div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="view-toggle">
          <button id="view-cal-btn"  class="active" onclick="setAgendaView('cal')">📅 Calendrier</button>
          <button id="view-list-btn" onclick="setAgendaView('list')">☰ Liste</button>
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
            <div style="font-family:var(--font-head);font-weight:700;font-size:14px;margin-bottom:14px;" id="agenda-side-title">
              Prochains événements
            </div>
            <div id="agenda-side-list">
              <div style="text-align:center;padding:30px 0;color:var(--text-3);font-size:13px;">Chargement…</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="agenda-list-view" style="display:none;margin-top:4px;">
      <div id="agenda-full-list"></div>
    </div>
  </div>`;

  await loadEvenementsCache();
  _agendaView  = 'cal';
  _selectedDay = null;
  renderCal();
}

// ── CALENDRIER ───────────────────────────────────────────────────
function renderCal() {
  const titleEl = $('cal-title');
  const gridEl  = $('cal-grid');
  if (!titleEl || !gridEl) return;

  const y = _agendaDate.getFullYear();
  const m = _agendaDate.getMonth();
  titleEl.textContent = _agendaDate.toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

  const jours = ['LU','MA','ME','JE','VE','SA','DI'];
  let html = jours.map(j => `<div class="cal-dow">${j}</div>`).join('');

  const firstDow    = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr    = _dateStr(new Date());

  const evMap = {};
  _agendaEvents().forEach(e => {
    const d = e.date_debut?.slice(0, 10);
    if (!d) return;
    (evMap[d] = evMap[d] || []).push(e);
  });

  for (let i = 0; i < firstDow; i++) html += `<div class="cal-day cal-day-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const ds  = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evs = evMap[ds] || [];
    const isToday    = ds === todayStr;
    const isSelected = ds === _selectedDay;

    const dots = evs.length ? `<div class="cal-dots">${
      evs.slice(0, 3).map(e => `<span class="cal-dot" style="background:${(EVENT_TYPES[e.type]||EVENT_TYPES.autre).color}"></span>`).join('')
      + (evs.length > 3 ? `<span class="cal-dot-more">+${evs.length-3}</span>` : '')
    }</div>` : '';

    html += `<div
      class="cal-day${isToday?' cal-today':''}${isSelected?' cal-selected':''}${evs.length?' cal-has-ev':''}"
      onclick="agendaSelectDay('${ds}')"
      title="${evs.length ? evs.length+' événement(s)' : ''}"
    ><span class="cal-day-num">${d}</span>${dots}</div>`;
  }

  gridEl.innerHTML = html;
  renderSidePanel();
}

function agendaSelectDay(ds) {
  _selectedDay = (_selectedDay === ds) ? null : ds;
  renderCal();
}

function agendaMonth(delta) {
  _agendaDate = new Date(_agendaDate.getFullYear(), _agendaDate.getMonth() + delta, 1);
  _selectedDay = null;
  renderCal();
}

// ── PANNEAU LATÉRAL ───────────────────────────────────────────────
function renderSidePanel() {
  const titleEl = $('agenda-side-title');
  const listEl  = $('agenda-side-list');
  if (!titleEl || !listEl) return;

  if (_selectedDay) {
    const evs = _agendaEvents().filter(e => e.date_debut?.slice(0,10) === _selectedDay);
    const label = new Date(_selectedDay + 'T12:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    titleEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    listEl.innerHTML = evs.length
      ? evs.map(e => renderEventCard(e)).join('')
      : `<div style="text-align:center;padding:30px 0;color:var(--text-3);font-size:13px;">Aucun événement ce jour.</div>`;
    return;
  }

  titleEl.textContent = 'Prochains événements';
  const now = new Date();
  const upcoming = _agendaEvents().filter(e => e.date_debut && new Date(e.date_debut) >= now).slice(0, 7);
  listEl.innerHTML = upcoming.length
    ? upcoming.map(e => renderEventCard(e)).join('')
    : `<div style="text-align:center;padding:30px 0;color:var(--text-3);font-size:13px;">Aucun événement à venir.</div>`;
}

// ── VUE LISTE ─────────────────────────────────────────────────────
function setAgendaView(v) {
  _agendaView = v;
  const calView  = $('agenda-cal-view');
  const listView = $('agenda-list-view');
  if (!calView || !listView) return;
  calView.style.display  = v === 'cal'  ? '' : 'none';
  listView.style.display = v === 'list' ? '' : 'none';
  $('view-cal-btn')?.classList.toggle('active',  v === 'cal');
  $('view-list-btn')?.classList.toggle('active', v === 'list');
  if (v === 'list') renderAgendaList();
}

function renderAgendaList() {
  const el = $('agenda-full-list');
  if (!el) return;
  const now      = new Date();
  const upcoming = _agendaEvents().filter(e => e.date_debut && new Date(e.date_debut) >= now);
  const past     = _agendaEvents().filter(e => e.date_debut && new Date(e.date_debut) < now).reverse();
  if (!upcoming.length && !past.length) {
    el.innerHTML = emptyState('📅', 'Agenda vide', 'Aucun événement programmé.');
    return;
  }
  let html = '';
  if (upcoming.length) {
    html += `<div class="ag-section-title">À venir</div>` + upcoming.map(e => renderEventCard(e, true)).join('');
  }
  if (past.length) {
    html += `<div class="ag-section-title">Passés</div><div style="opacity:.55;">` + past.slice(0,12).map(e => renderEventCard(e, true)).join('') + `</div>`;
  }
  el.innerHTML = html;
}

// ── CARD ÉVÉNEMENT ────────────────────────────────────────────────
function renderEventCard(e, withEditBtn = false) {
  const type  = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
  const heure = _fmtHeure(e.date_debut);
  const fin   = e.date_fin ? ` → ${_fmtHeure(e.date_fin)}` : '';
  return `<div class="ev-card">
    <div class="ev-card-stripe" style="background:${type.color};"></div>
    <div class="ev-card-body">
      <div class="ev-card-head">
        <div class="ev-card-title">${_esc(e.titre||'Sans titre')}</div>
        <span class="ev-card-badge" style="background:${type.bg};color:${type.color};">${type.label}</span>
      </div>
      <div class="ev-card-meta">
        <span>📅 ${_fmtDate(e.date_debut)}${heure ? ' · '+heure+fin : ''}</span>
        ${e.lieu        ? `<span>📍 ${_esc(e.lieu)}</span>` : ''}
        ${e.description ? `<span style="margin-top:2px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(e.description)}</span>` : ''}
      </div>
    </div>
    ${withEditBtn && isManager() ? `
    <div style="display:flex;align-items:center;padding:0 10px;">
      <button class="btn btn-ghost btn-xs" onclick="openEditEvent('${e.id}')" title="Modifier">✏️</button>
    </div>` : ''}
  </div>`;
}

// ── MODAL AJOUT / ÉDITION ─────────────────────────────────────────
function openNewEvent() { _openEventModal(null); }

function openEditEvent(id) {
  const ev = _agendaEvents().find(e => String(e.id) === String(id));
  _openEventModal(ev || null);
}

function _openEventModal(ev) {
  const isEdit = !!ev;

  // Construit la date/heure locale pour l'input datetime-local
  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const defDebut = ev?.date_debut ? toLocalInput(ev.date_debut) : (() => {
    const d = new Date(); d.setDate(d.getDate()+1); d.setHours(10,0,0,0);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T10:00`;
  })();

  const typeOptions = Object.entries(EVENT_TYPES)
    .map(([k,v]) => `<option value="${k}"${ev?.type===k?' selected':''}>${v.label} — ${_typeDesc(k)}</option>`)
    .join('');

  // Supprime une éventuelle modal résiduelle
  const existing = $('m-agenda');
  if (existing) existing.remove();

  // ── FIX : classe "open" ajoutée dès la création ──
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay open" id="m-agenda" onclick="if(event.target===this)closeModal('m-agenda')" style="z-index:900;">
      <div class="modal" style="max-width:520px;">
        <div class="mh">
          <span class="mh-title">${isEdit ? '✏️ Modifier l\'événement' : '📅 Nouvel événement'}</span>
          <button class="mclose" onclick="closeModal('m-agenda')">×</button>
        </div>
        <div class="mb" style="display:flex;flex-direction:column;gap:14px;">

          <!-- Titre -->
          <div class="fg" style="margin:0;">
            <label class="label">Titre *</label>
            <input type="text" id="ev-titre" class="input"
              placeholder="Ex : Assemblée Générale annuelle"
              value="${_esc(ev?.titre||'')}">
          </div>

          <!-- Type -->
          <div class="fg" style="margin:0;">
            <label class="label">Type d'événement</label>
            <select id="ev-type" class="select">${typeOptions}</select>
          </div>

          <!-- Dates -->
          <div style="display:flex;gap:10px;">
            <div class="fg" style="margin:0;flex:1;">
              <label class="label">Début *</label>
              <input type="datetime-local" id="ev-debut" class="input" value="${defDebut}">
            </div>
            <div class="fg" style="margin:0;flex:1;">
              <label class="label">Fin <span style="color:var(--text-3);font-weight:400;">(optionnel)</span></label>
              <input type="datetime-local" id="ev-fin" class="input" value="${toLocalInput(ev?.date_fin)}">
            </div>
          </div>

          <!-- Lieu -->
          <div class="fg" style="margin:0;">
            <label class="label">Lieu</label>
            <input type="text" id="ev-lieu" class="input"
              placeholder="Ex : Salle de réunion Tour 15, sous-sol…"
              value="${_esc(ev?.lieu||'')}">
          </div>

          <!-- Description / ordre du jour -->
          <div class="fg" style="margin:0;">
            <label class="label">Description / ordre du jour</label>
            <textarea id="ev-desc" class="textarea" rows="3"
              placeholder="Points abordés, informations pratiques, documents joints…">${_esc(ev?.description||'')}</textarea>
          </div>

          <!-- Rappel info -->
          <div style="background:var(--blue-light,rgba(59,130,246,.06));border:1px solid var(--blue-border,rgba(59,130,246,.15));border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text-3);line-height:1.5;">
            💡 L'événement sera visible par tous les résidents connectés dès l'enregistrement.
          </div>

        </div>
        <div class="mf" style="justify-content:${isEdit?'space-between':'flex-end'};">
          ${isEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteEvent('${ev.id}')">🗑 Supprimer</button>` : ''}
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="closeModal('m-agenda')">Annuler</button>
            <button class="btn btn-primary" id="ev-submit-btn" onclick="submitEvent(${isEdit?`'${ev.id}'`:'null'})">
              ${isEdit ? 'Enregistrer les modifications' : 'Ajouter à l\'agenda'}
            </button>
          </div>
        </div>
      </div>
    </div>`);

  setTimeout(() => $('ev-titre')?.focus(), 60);
}

function _typeDesc(k) {
  const map = { ag:'Assemblée générale', reunion_cs:'Conseil syndical', artisan:'Passage artisan', controle:'Contrôle technique', autre:'Autre' };
  return map[k] || '';
}

// ── SUBMIT ────────────────────────────────────────────────────────
async function submitEvent(id) {
  const titre = $('ev-titre')?.value.trim();
  if (!titre) { toast('Le titre est obligatoire.', 'error'); return; }
  const debut = $('ev-debut')?.value;
  if (!debut) { toast('La date de début est obligatoire.', 'error'); return; }

  // Désactive le bouton pendant l'envoi
  const btn = $('ev-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }

  const payload = {
    titre,
    type:        $('ev-type')?.value || 'autre',
    date_debut:  new Date(debut).toISOString(),
    date_fin:    $('ev-fin')?.value ? new Date($('ev-fin').value).toISOString() : null,
    lieu:        $('ev-lieu')?.value.trim()  || null,
    description: $('ev-desc')?.value.trim()  || null,
    created_by:  id ? undefined : (window.currentUser?.id ?? null),
  };
  if (id) delete payload.created_by;

  try {
    const { error } = id
      ? await sb.from('evenements').update(payload).eq('id', id)
      : await sb.from('evenements').insert(payload);
    if (error) throw error;

    toast(id ? 'Événement modifié ✓' : 'Événement ajouté ✓', 'success');
    closeModal('m-agenda');
    await loadEvenementsCache();
    renderCal();
    if (_agendaView === 'list') renderAgendaList();
  } catch (err) {
    console.error('[agenda] submitEvent', err);
    toast('Erreur : ' + (err.message || 'impossible d\'enregistrer.'), 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
  }
}

// ── DELETE ────────────────────────────────────────────────────────
async function deleteEvent(id) {
  if (!confirm('Supprimer définitivement cet événement ?')) return;
  try {
    const { error } = await sb.from('evenements').delete().eq('id', id);
    if (error) throw error;
    toast('Événement supprimé.', 'success');
    closeModal('m-agenda');
    await loadEvenementsCache();
    renderCal();
    if (_agendaView === 'list') renderAgendaList();
  } catch (err) {
    console.error('[agenda] deleteEvent', err);
    toast('Erreur : ' + (err.message || 'impossible de supprimer.'), 'error');
  }
}

// ── MODE SOMBRE ──
