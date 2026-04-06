// ── MAP PAGE — Design refactorisé (logique inchangée) ──────────────────────

let _mapFilters = { urgence: 'all', statut: 'all', batiment: 'all' };
let _mapViewMode = 'map';
const MAP_PREFS_KEY = 'coprosync_map_prefs_v1';

function loadMapPrefs() {
  try {
    const raw = localStorage.getItem(MAP_PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (prefs?.filters) _mapFilters = { ..._mapFilters, ...prefs.filters };
    if (prefs?.viewMode) _mapViewMode = prefs.viewMode === 'list' ? 'list' : 'map';
  } catch {}
}

function saveMapPrefs() {
  try {
    localStorage.setItem(MAP_PREFS_KEY, JSON.stringify({
      filters: _mapFilters,
      viewMode: _mapViewMode
    }));
  } catch {}
}

function mapTicketsFiltered() {
  return cache.tickets.filter(t => {
    if (!t.lat || !t.lng) return false;
    if (_mapFilters.urgence !== 'all' && t.urgence !== _mapFilters.urgence) return false;
    if (_mapFilters.statut !== 'all' && t.statut !== _mapFilters.statut) return false;
    if (_mapFilters.batiment !== 'all' && (t.batiment || 'Sans bâtiment') !== _mapFilters.batiment) return false;
    return true;
  });
}

function mapPriorityScore(t) {
  const s = (t.statut || '').toLowerCase();
  if (s === 'résolu' || s === 'clos') return 0;
  if (t.urgence === 'critique') return 3;
  if (t.urgence === 'important') return 2;
  return 1;
}

function mapMarkerColor(t) {
  return t.statut === 'résolu' || t.statut === 'clos' ? '#16a34a'
    : t.urgence === 'critique' ? '#dc2626'
    : t.urgence === 'important' ? '#ea580c'
    : '#2563eb';
}

// ── Badge urgence (label + style) ──────────────────────────────────────────
function mapUrgenceBadgeHtml(t) {
  const resolved = t.statut === 'résolu' || t.statut === 'clos';
  const label = resolved
    ? (t.statut === 'résolu' ? 'Résolu' : 'Clos')
    : (t.urgence === 'critique' ? 'Critique'
      : t.urgence === 'important' ? 'Important'
      : 'Normal');
  const styles = resolved
    ? 'background:#dcfce7;color:#166534;'
    : t.urgence === 'critique'
      ? 'background:#fee2e2;color:#991b1b;'
      : t.urgence === 'important'
        ? 'background:#ffedd5;color:#9a3412;'
        : 'background:#dbeafe;color:#1e40af;';
  return `<span style="font-size:10.5px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;padding:2px 7px;border-radius:20px;flex-shrink:0;white-space:nowrap;${styles}">${label}</span>`;
}

// ── Styles partagés (injectés une seule fois) ───────────────────────────────
const MAP_STYLES = `
<style id="map-page-styles">
  #map-page-root *{box-sizing:border-box}
  #map-page-root select{
    appearance:none;-webkit-appearance:none;
    background:var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='6' viewBox='0 0 11 6'%3E%3Cpath d='M1 1l4.5 4L10 1' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
    border:1px solid var(--border-strong);border-radius:8px;
    padding:0 28px 0 10px;height:34px;font-size:12.5px;font-weight:500;
    color:var(--text-1);cursor:pointer;transition:border-color .15s,box-shadow .15s;
  }
  #map-page-root select:hover{border-color:rgba(0,0,0,.25)}
  #map-page-root select:focus{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.15);border-color:#2563eb}
  #map-page-root .mp-btn-tab{
    padding:0 12px;height:34px;font-size:12.5px;font-weight:500;
    background:var(--surface);border:none;color:var(--text-2);
    cursor:pointer;transition:background .15s,color .15s;
    display:flex;align-items:center;gap:5px;line-height:1;
  }
  #map-page-root .mp-btn-tab+.mp-btn-tab{border-left:1px solid var(--border-strong)}
  #map-page-root .mp-btn-tab.active{background:var(--text-1);color:#fff}
  #map-page-root .mp-btn-tab:not(.active):hover{background:rgba(0,0,0,.04);color:var(--text-1)}
  #map-page-root .mp-ticket:hover{border-color:var(--border-strong);box-shadow:0 2px 8px rgba(0,0,0,.06)}
  #map-page-root .mp-btn-see:hover{background:var(--text-1);color:#fff;border-color:var(--text-1)}
  #map-page-root .mp-btn-reset:hover{background:rgba(0,0,0,.04);color:var(--text-1)}
</style>`;

// ── CSS variables (fallback si non défini dans l'app) ──────────────────────
const MAP_CSS_VARS = `
  --surface:#fff;
  --bg:#f8f7f5;
  --border:rgba(0,0,0,.08);
  --border-strong:rgba(0,0,0,.14);
  --text-1:#1a1917;
  --text-2:#6b6963;
  --text-3:#a09d98;
`;

function renderMapPage() {
  loadMapPrefs();
  if (mapInstance) { mapInstance.remove(); mapInstance = null; mapMarkers = []; }

  const geoCount  = cache.tickets.filter(t => t.lat && t.lng).length;
  const openCount = cache.tickets.filter(t => t.lat && t.lng && !['résolu', 'clos'].includes(t.statut)).length;
  const critCount = cache.tickets.filter(t => t.lat && t.lng && t.urgence === 'critique').length;

  const byBat = cache.tickets
    .filter(t => t.lat && t.lng)
    .reduce((acc, t) => { const k = t.batiment || 'Sans bâtiment'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const batOptions = ['all', ...Object.keys(byBat).sort()];

  const selectUrgence = `
    <select id="map-filter-urgence" onchange="onMapFilterChange()">
      <option value="all">Urgence : toutes</option>
      <option value="critique">Critique</option>
      <option value="important">Important</option>
      <option value="normal">Normal</option>
    </select>`;

  const selectStatut = `
    <select id="map-filter-statut" onchange="onMapFilterChange()">
      <option value="all">Statut : tous</option>
      <option value="nouveau">Nouveau</option>
      <option value="en_cours">En cours</option>
      <option value="en_attente">En attente</option>
      <option value="résolu">Résolu</option>
      <option value="clos">Clos</option>
    </select>`;

  const selectBat = `
    <select id="map-filter-batiment" onchange="onMapFilterChange()">
      ${batOptions.map(b => `<option value="${b}">${b === 'all' ? 'Bâtiment : tous' : 'Bâtiment : ' + b}</option>`).join('')}
    </select>`;

  const legendItems = [
    ['#dc2626', 'Critique'], ['#ea580c', 'Important'],
    ['#2563eb', 'Normal'], ['#16a34a', 'Résolu / Clos']
  ].map(([c, l]) => `
    <span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--text-2)">
      <span style="width:9px;height:9px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.15);flex-shrink:0"></span>${l}
    </span>`).join('');

  const iconMap  = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2C5.24 2 3 4.24 3 7c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>`;
  const iconList = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12v1.5H2zm0 3.5h12V9H2zm0 3.5h12V13H2z"/></svg>`;
  const iconReset= `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.65 2.35a8 8 0 10.87 10.49l-1.54-1.18A6 6 0 112 8c0-3.31 2.69-6 6-6a5.99 5.99 0 014.24 1.76L10 6h4V2l-1.35 1.35z"/></svg>`;

  $('page').innerHTML = `
    ${MAP_STYLES}
    <div id="map-page-root" style="display:flex;flex-direction:column;height:100%;padding:0;${MAP_CSS_VARS}">

      <!-- En-tête ─────────────────────────────────────────────────────── -->
      <div style="padding:20px 20px 0;flex-shrink:0;">

        <!-- Titre + stats -->
        <div style="margin-bottom:16px;">
          <h1 style="font-size:20px;font-weight:700;letter-spacing:-0.4px;color:var(--text-1);margin:0 0 6px;">Carte des signalements</h1>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;">
            ${[
              ['#2563eb', `${geoCount} géolocalisé${geoCount>1?'s':''}`],
              ['#ea580c', `${openCount} ouvert${openCount>1?'s':''}`],
              ['#dc2626', `${critCount} critique${critCount>1?'s':''}`]
            ].map(([c, l]) => `
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--text-2);background:rgba(0,0,0,.05);border-radius:20px;padding:3px 9px;">
                <span style="width:6px;height:6px;border-radius:50%;background:${c};flex-shrink:0"></span>${l}
              </span>`).join('')}
          </div>
        </div>

        <!-- Bannière avertissement (peu de points) -->
        ${geoCount < 5 ? `
        <div style="margin-bottom:14px;padding:10px 13px;border-radius:8px;background:#fef3c7;border:1px solid #fcd34d;color:#92400e;font-size:12px;line-height:1.55;">
          La carte est peu pertinente avec peu de points. Utilise aussi la vue liste pour prioriser les actions.
        </div>` : ''}

        <!-- Filtres + vue -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;">
          ${selectUrgence}
          ${selectStatut}
          ${selectBat}

          <div style="width:1px;height:20px;background:var(--border-strong);flex-shrink:0;margin:0 2px;"></div>

          <!-- Toggle carte / liste -->
          <div style="display:flex;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;flex-shrink:0;">
            <button class="mp-btn-tab${_mapViewMode==='map'?' active':''}" onclick="setMapViewMode('map')">${iconMap} Carte</button>
            <button class="mp-btn-tab${_mapViewMode==='list'?' active':''}" onclick="setMapViewMode('list')">${iconList} Liste</button>
          </div>

          <button class="mp-btn-reset" onclick="resetMapFilters()"
            style="padding:0 11px;height:34px;font-size:12px;font-weight:500;background:transparent;border:1px solid var(--border-strong);border-radius:8px;color:var(--text-2);cursor:pointer;transition:background .15s,color .15s;display:flex;align-items:center;gap:5px;">
            ${iconReset} Réinitialiser
          </button>
        </div>

        <!-- Légende -->
        <div style="display:flex;flex-wrap:wrap;gap:12px;padding-bottom:14px;">${legendItems}</div>
      </div>

      <!-- Zone carte / liste ───────────────────────────────────────────── -->
      <div style="flex:1;min-height:0;padding:0 20px 20px;">

        <!-- Carte Leaflet -->
        <div class="card" id="map-card"
          style="overflow:hidden;height:100%;min-height:300px;border-radius:12px;${_mapViewMode==='list'?'display:none;':''}">
          <div id="map" style="height:100%;width:100%;min-height:300px;"></div>
        </div>

        <!-- Vue liste -->
        <div id="map-list-card"
          style="max-height:100%;overflow:auto;${_mapViewMode==='map'?'display:none;':''}">
          ${renderMapListHtml()}
        </div>

      </div>
    </div>`;

  // Remettre les valeurs des selects
  const urg = $('map-filter-urgence');
  const sta = $('map-filter-statut');
  const bat = $('map-filter-batiment');
  if (urg) urg.value = _mapFilters.urgence;
  if (sta) sta.value = _mapFilters.statut;
  if (bat) bat.value = _mapFilters.batiment;
}

function renderMapListHtml() {
  const list = mapTicketsFiltered().sort((a, b) => {
    const pa = mapPriorityScore(a), pb = mapPriorityScore(b);
    if (pa !== pb) return pb - pa;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (!list.length) return `
    <div style="padding:24px 16px;text-align:center;font-size:13px;color:var(--text-3);">
      Aucun signalement pour les filtres actuels.
    </div>`;

  return list.map(t => `
    <div class="mp-ticket" style="border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:7px;transition:border-color .15s,box-shadow .15s;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;">
        <span style="font-weight:600;font-size:13px;color:var(--text-1);">${t.titre}</span>
        ${mapUrgenceBadgeHtml(t)}
      </div>
      <div style="font-size:11.5px;color:var(--text-3);margin-bottom:9px;">
        📍 ${t.batiment || 'Sans bâtiment'}${t.zone ? ' · ' + t.zone : ''} · ${fmtD(t.created_at)}
      </div>
      <button class="mp-btn-see"
        onclick="openDetail('${t.id}')"
        style="font-size:12px;font-weight:600;padding:5px 11px;background:transparent;border:1px solid var(--border-strong);border-radius:8px;color:var(--text-2);cursor:pointer;transition:background .15s,color .15s,border-color .15s;">
        Voir le signalement →
      </button>
    </div>`).join('');
}

function onMapFilterChange() {
  _mapFilters.urgence  = $('map-filter-urgence')?.value  || 'all';
  _mapFilters.statut   = $('map-filter-statut')?.value   || 'all';
  _mapFilters.batiment = $('map-filter-batiment')?.value || 'all';
  saveMapPrefs();
  if (_mapViewMode === 'list') {
    const el = $('map-list-card');
    if (el) el.innerHTML = renderMapListHtml();
    return;
  }
  initMap();
}

function setMapViewMode(mode) {
  _mapViewMode = mode === 'list' ? 'list' : 'map';
  saveMapPrefs();
  renderMapPage();
  if (_mapViewMode === 'map') setTimeout(initMap, 80);
}

function resetMapFilters() {
  _mapFilters = { urgence: 'all', statut: 'all', batiment: 'all' };
  saveMapPrefs();
  renderMapPage();
  if (_mapViewMode === 'map') setTimeout(initMap, 80);
}

function initMap() {
  const mapEl = $('map');
  if (!mapEl) return;
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  requestAnimationFrame(() => {
    mapInstance = L.map('map', {
      zoomControl: true,
      tap: true,
      tapTolerance: 15,
    }).setView([COPRO.lat, COPRO.lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(mapInstance);

    // Marqueur résidence
    L.marker([COPRO.lat, COPRO.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:3px;background:#1a1917;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7]
      })
    }).addTo(mapInstance)
      .bindPopup(`<strong>${COPRO.nom}</strong><br><small>${COPRO.adresse}</small>`);

    mapMarkers = [];
    const rows = mapTicketsFiltered();
    rows.forEach(t => {
      const c = mapMarkerColor(t);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${c};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      const m = L.marker([t.lat, t.lng], { icon }).addTo(mapInstance);
      m.bindPopup(`
        <div style="min-width:190px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;margin-bottom:3px;font-size:13px;color:#1a1917;">${t.titre}</div>
          <div style="font-size:11px;color:#6b6963;margin-bottom:10px;">📍 ${t.batiment || ''}${t.zone ? ' · ' + t.zone : ''}</div>
          <button onclick="openDetail('${t.id}')"
            style="width:100%;background:${c};color:white;border:none;padding:7px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:0.1px;">
            Voir le signalement →
          </button>
        </div>`);
      mapMarkers.push(m);
    });

    if (rows.length) {
      const group = L.featureGroup(mapMarkers);
      mapInstance.fitBounds(group.getBounds().pad(0.25), { maxZoom: 18 });
    }

    setTimeout(() => mapInstance?.invalidateSize({ animate: false }), 150);
    setTimeout(() => mapInstance?.invalidateSize({ animate: false }), 500);

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => mapInstance?.invalidateSize({ animate: false }));
      ro.observe(mapEl);
      mapEl._resizeObserver = ro;
    }
  });
}

// ── CONTRATS ──
