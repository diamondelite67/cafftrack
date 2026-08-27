const CACHE_NAME = "cafftrack-v1.1.1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];


/* INSTALL */

self.addEventListener("install", event => {
    self.skipWaiting();

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(
                    FILES_TO_CACHE
                );
            })
    );
});


/* ACTIVATE */

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(
                            key =>
                                key !== CACHE_NAME
                        )
                        .map(
                            key =>
                                caches.delete(key)
                        )
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});


/* FETCH */

self.addEventListener("fetch", event => {
    if (
        event.request.method !== "GET"
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (
                    !response ||
                    response.status !== 200 ||
                    response.type === "opaque"
                ) {
                    return response;
                }

                const copy =
                    response.clone();

                caches
                    .open(CACHE_NAME)
                    .then(cache => {
                        cache.put(
                            event.request,
                            copy
                        );
                    });

                return response;
            })
            .catch(() => {
                return caches.match(
                    event.request
                );
            })
    );
});