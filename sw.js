const CACHE_NAME = 'alfaham-tube-shell-v6';
const APP_SHELL = ['./', './index.html', './article.html', './admin.html', './manifest.webmanifest', './assets/site-logo.png', './assets/home-icon.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    const isNavigationRequest = event.request.mode === 'navigate';
    const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|json|webmanifest)$/i.test(requestUrl.pathname);

    if (isNavigationRequest) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request)
                    .then((cached) => cached || caches.match('./index.html')))
        );
        return;
    }

    if (isStaticAsset) {
        event.respondWith(
            caches.match(event.request)
                .then((cached) => {
                    const fetchPromise = fetch(event.request).then((response) => {
                        if (response && response.status === 200) {
                            const copy = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                        }
                        return response;
                    }).catch(() => cached);

                    return cached || fetchPromise;
                })
        );
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});