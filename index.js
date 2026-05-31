// ملف: index.js

const express = require("express");
require("dotenv").config();
const path = require("path"); // 1. استدعاء مكتبة المسارات لإرسال ملفات الـ HTML
const connection = require("./src/db");

// 2. استيراد الحارس البرمجي (verifyToken) من ملف الـ auth
const { verifyToken } = require("./src/routes/auth"); 

const authRoutes = require("./src/routes/auth");
const customerRoutes = require("./src/routes/customers");
const bookingRoutes = require("./src/routes/bookings");
const dailyTripRoutes = require("./src/routes/dailyTrips");
const driverRoutes = require("./src/routes/drivers");

const app = express();
const PORT = 3000;

/* ==============================
   Middleware العامة
============================== */
app.use(express.static("public"));
app.use(express.json());

/* ==============================
   الـ Routers الخاصة بالـ APIs
============================== */
app.use(authRoutes);
app.use(customerRoutes);
app.use(bookingRoutes);
app.use(dailyTripRoutes);
app.use(driverRoutes);

/* ==============================
   مساعد الذكاء الاصطناعي (Gemini)
============================== */
app.post("/api/help-chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    const errorMessage = "الرسالة مطلوبة";
    return res.status(400).json({
      success: false,
      reply: "خدمة المساعدة غير متاحة حالياً",
      debug: errorMessage
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    const errorMessage = "GEMINI_API_KEY is missing";
    return res.status(500).json({
      success: false,
      reply: "خدمة المساعدة غير متاحة حالياً",
      debug: errorMessage
    });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `You are BURAQ Help Assistant.
Answer only about:
- registration
- booking
- subscriptions
- seats
- notifications
- drivers
- daily trips
- maps
- cancellation
- contacting admin

If outside BURAQ:
"أنا مساعد براق فقط، يمكنني مساعدتك في استخدام التطبيق."`
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    console.log("Gemini response status:", geminiResponse.status);
    const responseBody = await geminiResponse.text();

    if (!geminiResponse.ok) {
      console.log("Gemini error body:", responseBody);
      return res.status(500).json({
        success: false,
        reply: "خدمة المساعدة غير متاحة حالياً",
        debug: responseBody
      });
    }

    const data = JSON.parse(responseBody);
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      const errorMessage = "Gemini response did not include a reply";
      return res.status(500).json({
        success: false,
        reply: "خدمة المساعدة غير متاحة حالياً",
        debug: errorMessage
      });
    }

    res.json({ success: true, reply });
  } catch (error) {
    const errorMessage = error.message || "Unknown help chat error";
    console.log("Help chat error:", errorMessage);
    res.status(500).json({
      success: false,
      reply: "خدمة المساعدة غير متاحة حالياً",
      debug: errorMessage
    });
  }
});

/* ========================================================
   🔒 نظام تأمين وتوجيه الصفحات الخاصة (Server-Side Protection)
======================================================== */

// 1. حماية وتوجيه صفحة الأدمن (مسموح فقط للـ admin)
app.get("/admin.html", verifyToken(["admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "admin.html"));
});

// 2. حماية وتوجيه صفحات الكابتن/السائق (مسموح للسائق وللأدمن رؤيتها)
app.get("/driver-daily-trips.html", verifyToken(["driver", "admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "driver-daily-trips.html"));
});

app.get("/driver-profile.html", verifyToken(["driver", "admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "driver-profile.html"));
});

app.get("/driver-requests.html", verifyToken(["driver", "admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "driver-requests.html"));
});

app.get("/driver-statistics.html", verifyToken(["driver", "admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "driver-statistics.html"));
});

// 💡 3. المعالج المخصص لإرجاع نص صريح "Cannot GET" عند محاولة الدخول غير المصرح
app.use((err, req, res, next) => {
  if (err.message === "غير مصرح لك، التوكن مفقود" || err.message === "جلسة انتهت أو توكن غير صالح" || res.statusCode === 403) {
    res.status(404).send(`Cannot GET ${req.originalUrl}`);
    return;
  }
  next(err);
});

/* ========================================================
   لوحة تحكم الأدمن والعمليات (Endpoints)
======================================================== */

app.get("/admin/driver-requests", (req, res) => {
  const sql = `
    SELECT driver_id, fast_name_driver, last_name_driver, date_of_birth_driver, phone_driver, address, password
    FROM driver WHERE status = 'pending'
  `;
  connection.query(sql, (err, result) => {
    if (err) {
      console.log("Get driver requests error:", err);
      return res.json({ success: false, message: "فشل جلب طلبات السائقين" });
    }
    res.json({ success: true, drivers: result });
  });
});

app.put("/admin/driver-requests/:id/accept", (req, res) => {
  const driverId = req.params.id;

  connection.query(
    "SELECT driver_id, password FROM driver WHERE driver_id = ?",
    [driverId],
    async (errFetch, result) => {
      if (errFetch || result.length === 0) {
        return res.json({ success: false, message: "السائق غير موجود أو فشل جلب بياناته" });
      }

      const plainPassword = result[0].password;

      try {
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const updateSql = `
          UPDATE driver SET status = 'accepted', password = ? WHERE driver_id = ?
        `;

        connection.query(updateSql, [hashedPassword, driverId], (errUpdate) => {
          if (errUpdate) {
            console.log("Accept and encrypt driver error:", errUpdate);
            return res.json({ success: false, message: "فشل قبول وتأمين السائق" });
          }
          return res.json({
            success: true,
            loginCode: "driver" + result[0].driver_id,
            password: plainPassword
          });
        });
      } catch (cryptErr) {
        console.log("Bcrypt driver encrypt error:", cryptErr);
        return res.json({ success: false, message: "خطأ داخلي أثناء تشفير كلمة مرور السائق" });
      }
    }
  );
});

app.put("/admin/driver-requests/:id/reject", (req, res) => {
  const driverId = req.params.id;
  const sql = `UPDATE driver SET status = 'rejected' WHERE driver_id = ?`;

  connection.query(sql, [driverId], (err) => {
    if (err) {
      console.log("Reject driver error:", err);
      return res.json({ success: false, message: "فشل رفض السائق" });
    }
    res.json({ success: true, message: "تم رفض الطلب" });
  });
});

app.get("/admin/dashboard-data", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM customer) AS usersCount,
      (SELECT COUNT(*) FROM booking WHERE status = 1) AS pendingSubsCount,
      (SELECT COUNT(*) FROM booking WHERE status = 2) AS activeSubsCount,
      (SELECT COUNT(*) FROM driver WHERE status = 'accepted') AS driversCount
  `;
  connection.query(sql, (err, result) => {
    if (err) {
      console.log("Admin dashboard counts error:", err);
      return res.json({ success: false });
    }
    res.json({ success: true, counts: result[0] });
  });
});

const ADMIN_DASHBOARD_SECTION_SQL = {
  users: `
      SELECT caustomer_id AS id, CONCAT(fast_name_caustomer, ' ', last_name_caustomer) AS name, phone_caustomer AS phone, DATE_FORMAT(date_of_birth_caustomer, '%Y-%m-%d') AS dob
      FROM customer ORDER BY caustomer_id DESC
    `,
  pendingSubs: `
      SELECT b.booking_id AS id, CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS user, b.trip_type AS type, 'معلق' AS status
      FROM booking b JOIN customer c ON b.customer_id_fk = c.caustomer_id WHERE b.status = 1 ORDER BY b.booking_id DESC
    `,
  activeSubs: `
      SELECT b.booking_id AS id, CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS user, b.trip_type AS type, 'فعال' AS status
      FROM booking b JOIN customer c ON b.customer_id_fk = c.caustomer_id WHERE b.status = 2 ORDER BY b.booking_id DESC
    `,
  drivers: `
      SELECT driver_id AS id, CONCAT(fast_name_driver, ' ', last_name_driver) AS name, phone_driver AS phone, address
      FROM driver WHERE status = 'accepted' ORDER BY driver_id DESC
    `
};

app.get("/admin/dashboard-section/:section", (req, res) => {
  const sql = ADMIN_DASHBOARD_SECTION_SQL[req.params.section];
  if (!sql) return res.json({ success: false, message: "قسم غير معروف" });

  connection.query(sql, (err, rows) => {
    if (err) {
      console.log("Admin section error:", err);
      return res.json({ success: false });
    }
    res.json({ success: true, rows });
  });
});

/* ========================================================
   استعادة كلمة المرور (Forgot Password)
======================================================== */
const resetCodes = {};

app.post("/forgot-password/send-code", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.json({ success: false, message: "أدخل رقم الهاتف" });

  const sql = `SELECT caustomer_id FROM customer WHERE phone_caustomer = ?`;
  connection.query(sql, [phone], (err, result) => {
    if (err) {
      console.log("Forgot check phone error:", err);
      return res.json({ success: false, message: "خطأ في السيرفر" });
    }
    if (result.length === 0) return res.json({ success: false, message: "رقم الهاتف غير مسجل" });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    resetCodes[phone] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };

    res.json({
      success: true,
      code,
      whatsappUrl: `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent("رمز استعادة كلمة المرور في براق هو: " + code)}`
    });
  });
});

app.post("/forgot-password/verify-code", (req, res) => {
  const { phone, code } = req.body;
  const saved = resetCodes[phone];

  if (!saved) return res.json({ success: false, message: "لم يتم إرسال رمز لهذا الرقم" });
  if (Date.now() > saved.expiresAt) {
    delete resetCodes[phone];
    return res.json({ success: false, message: "انتهت صلاحية الرمز" });
  }
  if (saved.code !== code) return res.json({ success: false, message: "رمز التحقق غير صحيح" });

  res.json({ success: true, message: "تم التحقق" });
});

app.put("/forgot-password/reset", async (req, res) => {
  const { phone, code, newPassword } = req.body;
  if (!phone || !code || !newPassword) return res.json({ success: false, message: "جميع الحقول مطلوبة" });

  const saved = resetCodes[phone];
  if (!saved || saved.code !== code || Date.now() > saved.expiresAt) {
    return res.json({ success: false, message: "رمز التحقق غير صالح أو انتهت صلاحيته" });
  }

  try {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = `UPDATE customer SET password = ? WHERE phone_caustomer = ?`;
    connection.query(sql, [hashedPassword, phone], (err, result) => {
      if (err) {
        console.log("Reset password error:", err);
        return res.json({ success: false, message: "خطأ في السيرفر، فشل تحديث البيانات" });
      }
      delete resetCodes[phone];
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    });
  } catch (cryptErr) {
    console.log("Bcrypt password reset error:", cryptErr);
    return res.json({ success: false, message: "خطأ داخلي أثناء تشفير البيانات" });
  }
});

/* ========================================================
   اتصال قاعدة البيانات وتشغيل السيرفر
======================================================== */
connection.connect((err) => {
  if (err) {
    console.log("DB connection FAILED:", err);
  } else {
    console.log("DB connection succeeded");
  }
});

app.listen(PORT, () => {
  console.log("Express server is running at port no: " + PORT);
});