/* =====================================================
   THE BLOCK - Service Worker
   Offline Capability & Caching
   Part of BIG LOVE Holdings
   ===================================================== */

const CACHE_NAME = 'theblock-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/manifest.json'
];

// ============ INSTALL ============
self.addEventListener('install', (event) => {
    console.log('✦ Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✦ Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✦ Service Worker installed');
                return self.skipWaiting();
            })
    );
});

// ============ ACTIVATE ============
self.addEventListener('activate', (event) => {
    console.log('✦ Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('✦ Clearing old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✦ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// ============ FETCH ============
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
            .catch(() => {
                console.log('✦ Offline - serving cached content');
            })
    );
});

console.log('✦ THE BLOCK Service Worker loaded');