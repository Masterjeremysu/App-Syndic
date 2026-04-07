// CoproSync SW v4 — Push Notifications Unifiées
const V = 'coprosync-v4';
const CACHE = ['/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  let data = { title: 'CoproSync', body: 'Nouvelle notification', type: 'default', ticketId: null };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch(_) {}

  const icons = {
    ticket_critique:  '🔴',
    nouveau_ticket:   '🚨',
    commentaire:      '💬',
    mention:          '🏷️',
    statut_change:    '📋',
    message_prive:    '🔒',
    message_canal:    '💬',
    feed_commentaire: '💬',
    vote:             '🗳️',
    annonce:          '📢',
    document:         '📄',
  };
  const icon = icons[data.type] || '🔔';

  e.waitUntil(
    self.registration.showNotification(`${icon} ${data.title}`, {
      body:               data.body,
      icon:               '/icon-192.png',
      badge:              '/favicon-32.png',
      tag:                data.ticketId || ('coprosync-' + data.type),
      data:               { ticketId: data.ticketId, type: data.type },
      vibrate:            [200, 100, 200],
      requireInteraction: data.type === 'ticket_critique' || data.type === 'mention',
    })
  );
});

// ── CLIC SUR NOTIF → ouvre la bonne page ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { ticketId, type } = e.notification.data || {};

  const urlMap = {
    ticket_critique:  ticketId ? '/?ticket=' + ticketId : '/',
    nouveau_ticket:   ticketId ? '/?ticket=' + ticketId : '/',
    statut_change:    ticketId ? '/?ticket=' + ticketId : '/',
    commentaire:      ticketId ? '/?ticket=' + ticketId : '/',
    mention:          ticketId ? '/?ticket=' + ticketId : '/',
    message_prive:    '/?page=messages',
    message_canal:    '/?page=messages',
    feed_commentaire: '/?page=messages',
    vote:             '/?page=votes',
    annonce:          '/?page=annonces',
    document:         '/?page=documents',
  };
  const url = urlMap[type] || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        if (ticketId) {
          existing.postMessage({ type: 'OPEN_TICKET', ticketId });
        } else if (type) {
          const page = url.replace('/?page=', '');
          existing.postMessage({ type: 'OPEN_PAGE', page });
        }
        return;
      }
      return clients.openWindow(url);
    })
  );
});
