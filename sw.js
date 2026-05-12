const CACHE_NAME = 'sss-shop-v1';
const urlsToCache = [
  '/',
  '/static/css/style.css',
  '/static/js/script.js',
  '/manifest.json'
];

// Oflayn rejim uchun keshga saqlash
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Internet borida yangilab olish, yo'g'ida keshdan berish
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Keshda bo'lsa uni beradi, bo'lmasa tarmoqdan yuklaydi
        return response || fetch(event.request);
      })
  );
});
