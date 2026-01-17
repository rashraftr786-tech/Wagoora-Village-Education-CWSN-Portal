const CACHE_NAME = 'wagoora-ver-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/styles/main.css',
  '/assets/logo-baramulla.png'
];

// 1. Install Service Worker & Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache: Wagoora VER Portal');
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. Fetch Logic (Network First, then Cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 3. Background Sync for Survey Data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ver-data') {
    event.waitUntil(uploadPendingSurveys());
  }
});

// Logic to push locally saved data to the server
async function uploadPendingSurveys() {
  const db = await openIndexedDB(); // Access local storage
  const pendingData = await db.getAll('pending_surveys');
  
  for (const survey of pendingData) {
    try {
      await fetch('/api/submit-survey', {
        method: 'POST',
        body: JSON.stringify(survey),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('pending_surveys', survey.id); // Clear local after success
    } catch (error) {
      console.error('Sync failed for household: ', survey.headName);
    }
  }
}

