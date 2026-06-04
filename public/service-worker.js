// ملف: public/service-worker.js

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

/* =========================================================
   📥 مرحلة التثبيت (Install Event)
========================================================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

/* =========================================================
   🔄 مرحلة التفعيل وتنظيف الكاش القديم (Activate Event)
========================================================= */
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

/* =========================================================
   🛡️ مرحلة اعتراض الطلبات وحماية الاتصالات (Fetch Event)
========================================================= */
self.addEventListener("fetch", (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    // إذا كان الرابط غير صالح أو غريب نتخطى الفحص بأمان
    return;
  }

  // 🔒 شرط الأمان الحديدي: السماح لروابط Firebase وجوجل و reCAPTCHA بالمرور مباشرة للإنترنت الحقيقي دون اعتراض
  if (
    url.origin.includes("google.com") || 
    url.origin.includes("googleapis.com") || 
    url.origin.includes("firebaseapp.com") ||
    url.pathname.includes("/api/") // منع السيرفس وركر من حجب الـ APIs الخاصة بالسيرفر تبعك مثل جمني والتحقق
  ) {
    return; // تترك لطلب الشبكة الحقيقي دون تدخل
  }

  // لتجنب خطأ الـ TypeError وتحويل القيمة لـ Response بشكل صحيح وآمن
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // إرجاع استجابة فارغة آمنة للشبكة في حال انقطاع النت وعدم وجود كاش منعاً للكراش
        return new Response("Network error occurred", { 
          status: 408, 
          headers: { "Content-Type": "text/plain" } 
        });
      });
    })
  );
});