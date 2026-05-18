const CACHE_NAME = 'sss-shop-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/static/css/style.css',
    '/static/js/script.js',
    '/manifest.json'
];

// O'rnatish bosqichi: Asosiy fayllarni keshga saqlash
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// Faollashtirish bosqichi: Eski kesh versiyalarini tozalash
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// So'rovlarni tutib olish (Fetch): Internetdan oldin keshni tekshirish
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    // Rasm va API'lar uchun (Stale-While-Revalidate)
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open('sss-api-cache').then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                }).catch(() => {
                    return cachedResponse; // Internet uzilsa eskisi ishlaydi
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Odatiy fayllar uchun Cache-First strategiyasi
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then(networkResponse => {
                // Yangi topilgan resurslarni ham keshlab qo'yish
                if (networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            });
        })
    );
});
