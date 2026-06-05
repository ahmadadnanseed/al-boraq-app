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

app.get("/admin.html", verifyToken(["admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "admin.html"));
});

// إرجاع الحماية الصارمة لصفحة الاستعراض القديمة
app.get("/admin-view.html", verifyToken(["admin"]), (req, res) => {
  res.sendFile(path.join(__dirname, "private_views", "admin-view.html")); 
});

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

// ========================================================
// لوحة تحكم الأدمن المتقدمة والتفاعلية ديناميكياً - مشروع براق
// ========================================================
// ========================================================
// لوحة تحكم الأدمن المتقدمة والتفاعلية ديناميكياً - مشروع براق
// ========================================================

// 1. مسار جلب أعداد البطاقات الأربعة العلوية الأساسية عند تحميل الصفحة أول مرة
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

// 2. مسار جلب بيانات الجداول السفلية عند كبس الكروت لتصفية الأسماء والـ IDs
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

// ========================================================
// 🚀 المسار العام الشامل والنهائي لتغذية الرسم البياني التفاعلي (براق)
// مطابق 100% لأسماء جداولك الفعلية: daily_trips و start_date_booking
// ========================================================

app.get("/admin/chart-analytics/:section", (req, res) => {
  const section = req.params.section;
  console.log(`📡 [CHART DEBUG] السيرفر استقبل طلب تحديث الرسم البياني للقسم: ${section}`);

  if (section === "users") {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM customer) AS totalRegistrations,
        (SELECT COUNT(DISTINCT customer_id_fk) FROM booking) AS subscribedUsers,
        (SELECT COUNT(*) FROM customer WHERE caustomer_id NOT IN (SELECT DISTINCT customer_id_fk FROM booking WHERE customer_id_fk IS NOT NULL)) AS nonSubscribedUsers
    `;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log("❌ خطأ كويري الركاب بالرسم البياني:", err);
        return res.json({ success: false });
      }
      const data = result[0];
      return res.json({
        success: true,
        title: "إحصائيات وتحليلات الركاب (Customers)",
        labels: ["إجمالي المسجلين", "المشتركين الفعليين", "حسابات بدون اشتراك"],
        datasetLabel: "عدد الحسابات",
        values: [data.totalRegistrations, data.subscribedUsers, data.nonSubscribedUsers]
      });
    });
  } 
  
  else if (section === "activeSubs") {
    const sql = `
      SELECT 
        COUNT(*) AS totalTrips,
        COALESCE(SUM(price), 0) AS totalEarnings,
        COALESCE(SUM(CASE WHEN DATE(start_date_booking) = CURDATE() THEN price ELSE 0 END), 0) AS dailyEarnings,
        COALESCE(SUM(CASE WHEN YEARWEEK(start_date_booking, 1) = YEARWEEK(CURDATE(), 1) THEN price ELSE 0 END), 0) AS weeklyEarnings,
        COALESCE(SUM(CASE WHEN MONTH(start_date_booking) = MONTH(CURDATE()) AND YEAR(start_date_booking) = YEAR(CURDATE()) THEN price ELSE 0 END), 0) AS monthlyEarnings
      FROM booking WHERE status = 2
    `;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log("❌ خطأ كويري الأرباح بالرسم البياني:", err);
        return res.json({ success: false });
      }
      const data = result[0];
      return res.json({
        success: true,
        title: "التحليلات المالية للاشتراكات الفعالة (الخزينة)",
        labels: ["أرباح اليوم (JOD)", "أرباح الأسبوع (JOD)", "أرباح الشهر (JOD)", "إجمالي الأرباح الكلية (JOD)", "عدد الرحلات الجارية"],
        datasetLabel: "العوائد والعدد",
        values: [
          parseFloat(data.dailyEarnings), 
          parseFloat(data.weeklyEarnings), 
          parseFloat(data.monthlyEarnings), 
          parseFloat(data.totalEarnings), 
          data.totalTrips
        ]
      });
    });
  } 
  
  else if (section === "pendingSubs") {
    const sql = `
      SELECT 
        COUNT(*) AS pendingTrips,
        COALESCE(SUM(price), 0) AS totalPendingMoney,
        COALESCE(SUM(CASE WHEN DATE(start_date_booking) = CURDATE() THEN price ELSE 0 END), 0) AS dailyPending,
        COALESCE(SUM(CASE WHEN YEARWEEK(start_date_booking, 1) = YEARWEEK(CURDATE(), 1) THEN price ELSE 0 END), 0) AS weeklyPending,
        COALESCE(SUM(CASE WHEN MONTH(start_date_booking) = MONTH(CURDATE()) AND YEAR(start_date_booking) = YEAR(CURDATE()) THEN price ELSE 0 END), 0) AS monthlyPending
      FROM booking WHERE status = 1
    `;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log("❌ خطأ كويري المعلق بالرسم البياني:", err);
        return res.json({ success: false });
      }
      const data = result[0];
      return res.json({
        success: true,
        title: "الأرباح المتوقعة والرحلات المعلقة غير المكتسبة",
        labels: ["معلق اليوم (JOD)", "معلق الأسبوع (JOD)", "معلق الشهر (JOD)", "إجمالي غير المكتسب (JOD)", "عدد الطلبات المنتظرة"],
        datasetLabel: "القيم المعلقة",
        values: [
          parseFloat(data.dailyPending), 
          parseFloat(data.weeklyPending), 
          parseFloat(data.monthlyPending), 
          parseFloat(data.totalPendingMoney), 
          data.pendingTrips
        ]
      });
    });
  } 
  
  else if (section === "drivers") {
    // 🔑 تم إصلاح استدعاء الجدول الحقيقي ليصبح daily_trips بالجمع بنجاح لتشغيل كرت الكباتن
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM driver WHERE status = 'accepted') AS totalDrivers,
        (SELECT COALESCE(SUM(price * 0.8), 0) FROM booking WHERE status = 2) AS driversEarnings,
        (SELECT COALESCE(AVG(customer_rating), 4.8) FROM daily_trips WHERE customer_rating IS NOT NULL AND customer_rating > 0) AS avgRating
    `;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log("❌ خطأ كويري السائقين بالرسم البياني:", err);
        return res.json({ success: false });
      }
      const data = result[0];
      return res.json({
        success: true,
        title: "إحصائيات الكباتن والمستحقات الماليّة (Drivers)",
        labels: ["عدد الكباتن النشطين", "مستحقات الكباتن الكلية (JOD)", "متوسط التقييم العام"],
        datasetLabel: "مؤشرات أداء السائقين",
        values: [
          data.totalDrivers, 
          parseFloat(data.driversEarnings).toFixed(2), 
          parseFloat(data.avgRating).toFixed(1)
        ]
      });
    });
  } else {
    return res.json({ success: false, message: "قسم غير مدعوم" });
  }
});
// 4. مسارات إدارة السائقين الجانبية (قبول ورفض طلبات الاشتراك بـ الـ Modal)
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
        const updateSql = `UPDATE driver SET status = 'accepted', password = ? WHERE driver_id = ?`;
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
/* ========================================================
   🔍 نظام البحث المتقدم والحذف المستهدف للأدمن (براّق)
======================================================== */

// أ. مسار فحص الـ ID الموجه والمحصور حسب القسم النشط حالياً (تعديل براّق)
app.get("/admin/advanced-search/:section/:id", verifyToken(["admin"]), (req, res) => {
  const { section, id } = req.params;

  // 1. إذا كان الأدمن واقف في كرت المستخدمين (الركاب)
  if (section === "users") {
    const customerSql = `
      SELECT 
        c.caustomer_id AS id, 
        CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS name, 
        c.phone_caustomer AS phone, 
        DATE_FORMAT(c.date_of_birth_caustomer, '%Y-%m-%d') AS dob,
        (SELECT COUNT(*) FROM daily_trips WHERE customer_id_fk = c.caustomer_id AND status = 'completed') AS completedTrips,
        (SELECT COUNT(*) FROM daily_trips WHERE customer_id_fk = c.caustomer_id AND status = 'postponed') AS postponedTrips,
        (SELECT COUNT(*) FROM daily_trips WHERE customer_id_fk = c.caustomer_id AND status = 'scheduled') AS remainingTrips
      FROM customer c WHERE c.caustomer_id = ?;
    `;
    connection.query(customerSql, [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "خطأ في فحص المستخدم" });
      if (rows.length === 0) return res.json({ success: false, message: "لم يتم العثور على أي مستخدم بهذا الـ ID في هذا القسم" });
      return res.json({ success: true, type: "customer", data: rows[0] });
    });
  } 
  
  // 2. إذا كان الأدمن واقف في كرت السائقين (الكباتن)
  else if (section === "drivers") {
    const driverSql = `
      SELECT 
        d.driver_id AS id, 
        CONCAT(d.fast_name_driver, ' ', d.last_name_driver) AS name, 
        d.phone_driver AS phone, 
        d.address,
        COALESCE((SELECT SUM(b.price * 0.8) FROM booking b WHERE b.driver_id_fk = d.driver_id AND b.status = 2), 0) AS totalEarnings,
        COALESCE((SELECT SUM(b.price * 0.8) FROM booking b WHERE b.driver_id_fk = d.driver_id AND DATE(b.start_date_booking) = CURDATE() AND b.status = 2), 0) AS dailyEarnings,
        COALESCE((SELECT AVG(dt.customer_rating) FROM daily_trips dt WHERE dt.driver_id_fk = d.driver_id AND dt.customer_rating > 0), 4.8) AS avgRating
      FROM driver d WHERE d.driver_id = ? AND d.status = 'accepted';
    `;
    connection.query(driverSql, [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "خطأ في فحص الكابتن" });
      if (rows.length === 0) return res.json({ success: false, message: "لم يتم العثور على أي كابتن نشط بهذا الـ ID في هذا القسم" });
      return res.json({ success: true, type: "driver", data: rows[0] });
    });
  } 
  
  // 3. إذا كان الأدمن واقف في كرت الاشتراكات (الفعالة أو المعلقة)
  else if (section === "activeSubs" || section === "pendingSubs") {
    const bookingSql = `
      SELECT 
        b.booking_id AS id, 
        CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS customerName,
        b.trip_type AS type, 
        b.price,
        (SELECT COUNT(*) FROM daily_trips WHERE booking_id_fk = b.booking_id AND status = 'completed') AS doneTrips,
        (SELECT COUNT(*) FROM daily_trips WHERE booking_id_fk = b.booking_id AND status = 'postponed') AS deferredTrips,
        (SELECT COUNT(*) FROM daily_trips WHERE booking_id_fk = b.booking_id AND status IN ('scheduled', 'driver_started', 'driver_arrived', 'passenger_picked')) AS pendingTrips
      FROM booking b
      JOIN customer c ON b.customer_id_fk = c.caustomer_id
      WHERE b.booking_id = ?;
    `;
    connection.query(bookingSql, [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "خطأ في فحص الرحلة" });
      if (rows.length === 0) return res.json({ success: false, message: "لم يتم العثور على أي اشتراك/رحلة بهذا الـ ID" });
      return res.json({ success: true, type: "booking", data: rows[0] });
    });
  } 
  
  else {
    return res.json({ success: false, message: "قسم غير مدعوم للبحث" });
  }
});

// ب. مسار الحذف المستهدف والآمن المحمي بـ ON DELETE CASCADE
app.delete("/admin/delete-target/:type/:id", verifyToken(["admin"]), (req, res) => {
  const { type, id } = req.params;
  let sql = "";

  if (type === "customer") {
    sql = "DELETE FROM customer WHERE caustomer_id = ?";
  } else if (type === "driver") {
    sql = "DELETE FROM driver WHERE driver_id = ?";
  } else if (type === "booking") {
    sql = "DELETE FROM booking WHERE booking_id = ?";
  } else {
    return res.status(400).json({ success: false, message: "نوع الكيان غير مدعوم" });
  }

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.log("❌ خطأ أثناء الحذف المباشر للأدمن:", err);
      return res.status(500).json({ success: false, message: "فشل إتمام عملية الحذف من قاعدة البيانات" });
    }
    res.json({ success: true, message: "تم حذف الكيان بنجاح تفعيل التحديث التلقائي" });
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