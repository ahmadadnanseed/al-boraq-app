
const CACHE_NAME = "buraq-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/login.html",
  "/signup.html",
  "/Style.css",
  "/script.js",
  "/img/my-horse4.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return;
  }

  if (
    url.origin.includes("google.com") || 
    url.origin.includes("googleapis.com") || 
    url.origin.includes("firebaseapp.com") ||
    url.pathname.includes("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response("Network error occurred", { 
          status: 408, 
          headers: { "Content-Type": "text/plain" } 
        });
      });
    })
  );
});