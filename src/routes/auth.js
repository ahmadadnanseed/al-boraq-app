const express = require("express");
const connection = require("../db");
const bcrypt = require("bcryptjs"); 
const jwt = require("jsonwebtoken"); // 1. استدعاء مكتبة JWT التي قمنا بتثبيتها

const router = express.Router();
const signupOtpCodes = {};

// المفتاح السري لتشفير الـ Tokens (في الإنتاج الحقيقي يفضل وضعه في ملف الـ .env)
const JWT_SECRET = process.env.JWT_SECRET || "BURAQ_SUPER_SECRET_SECURITY_KEY_2026";

// دالة مساعدة لتقسيم الاسم
function splitFullName(name) {
  const parts = (name || "").trim().split(" ");
  return {
    first: parts[0] || "",
    last: parts.slice(1).join(" ") || ""
  };
}

// دالة موحدة للتعامل مع أخطاء السيرفر لحجب التفاصيل الحساسة
function loginDbError(res, logLabel, err) {
  console.error(logLabel, err);
  return res.status(500).json({ success: false, message: "خطأ داخلي في السيرفر" });
}

/* ========================================================
   1. إرسال رمز التحقق (OTP)
======================================================== */
router.post("/signup/send-otp", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "رقم الهاتف مطلوب" });
  }

  const checkSql = `SELECT caustomer_id FROM customer WHERE phone_caustomer = ?`;

  connection.query(checkSql, [phone], (err, result) => {
    if (err) {
      return loginDbError(res, "Check phone error:", err);
    }

    if (result.length > 0) {
      return res.status(400).json({ success: false, message: "رقم الهاتف مسجل مسبقًا" });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    signupOtpCodes[phone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 
    };

    console.log("Signup OTP for", phone, "is:", code);

    res.json({
      success: true,
      message: "تم إرسال رمز التحقق"
    });
  });
});

/* ========================================================
   2. تأكيد رمز التحقق وإنشاء الحساب بالتشفير
======================================================== */
router.post("/signup/verify", async (req, res) => {
  const { name, phone, dob, password, code } = req.body;

  if (!name || !phone || !dob || !password || !code) {
    return res.status(400).json({ success: false, message: "جميع الحقول مطلوبة" });
  }

  const saved = signupOtpCodes[phone];

  if (!saved) {
    return res.status(400).json({ success: false, message: "لم يتم إرسال رمز لهذا الرقم" });
  }

  if (Date.now() > saved.expiresAt) {
    delete signupOtpCodes[phone];
    return res.status(400).json({ success: false, message: "انتهت صلاحية الرمز" });
  }

  if (saved.code !== code) {
    return res.status(400).json({ success: false, message: "رمز التحقق غير صحيح" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { first, last } = splitFullName(name);

    const sql = `
      INSERT INTO customer 
      (fast_name_caustomer, last_name_caustomer, phone_caustomer, date_of_birth_caustomer, password) 
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(sql, [first, last, phone, dob, hashedPassword], (err, result) => {
      if (err) {
        return loginDbError(res, "Signup verify error:", err);
      }

      delete signupOtpCodes[phone];
      return res.json({ success: true, message: "تم إنشاء الحساب بنجاح", userId: result.insertId });
    });

  } catch (cryptErr) {
    return loginDbError(res, "Bcrypt error:", cryptErr);
  }
});

/* ========================================================
   3. تسجيل مستخدم جديد مباشر (بدون OTP)
======================================================== */
router.post("/signup", async (req, res) => {
  const { name, phone, dob, password } = req.body;

  if (!name || !phone || !dob || !password) {
    return res.status(400).json({ success: false, message: "جميع الحقول مطلوبة" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { first: first_name, last: last_name } = splitFullName(name);

    const sql = `
      INSERT INTO customer 
      (fast_name_caustomer, last_name_caustomer, phone_caustomer, date_of_birth_caustomer, password) 
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(sql, [first_name, last_name, phone, dob, hashedPassword], (err, result) => {
      if (err) {
        return loginDbError(res, "Signup error:", err); 
      }

      res.json({ success: true, message: "تم إنشاء الحساب بنجاح", userId: result.insertId });
    });

  } catch (cryptErr) {
    return loginDbError(res, "Bcrypt error:", cryptErr);
  }
});

/* ========================================================
   4. تسجيل الدخول الآمن وحقن الـ JWT لكل دور (Role)
======================================================== */
router.post("/login", (req, res) => {
  const { loginType, phone, driverCode, adminCode, password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: "كلمة المرور مطلوبة" });
  }

  // --- نظام تسجيل دخول الـ Admin ---
  if (loginType === "admin") {
    if (!adminCode) return res.status(400).json({ success: false, message: "رمز الأدمن مطلوب" });
    const adminId = Number(adminCode.toLowerCase().replace("admin", ""));

    if (isNaN(adminId)) {
      return res.json({ success: false, message: "رمز الأدمن غير صالح" });
    }

    const sql = `SELECT * FROM admin WHERE admin_id = ?`;
    connection.query(sql, [adminId], async (err, result) => {
      if (err) return loginDbError(res, "Admin login error:", err);

      if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
        return res.json({ success: false, message: "رقم الأدمن أو كلمة المرور غير صحيحة" });
      }

      // 🔑 توليد بطاقة الـ JWT للأدمن بصلاحية 24 ساعة
      const token = jwt.sign(
        { id: result[0].admin_id, role: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({ 
        success: true, 
        role: "admin", 
        adminId: result[0].admin_id,
        token: token // إرسال التوكن للواجهة
      });
    });
    return;
  }

  // --- نظام تسجيل دخول الـ Driver ---
  if (loginType === "driver") {
    if (!driverCode) return res.status(400).json({ success: false, message: "الرقم الوظيفي مطلوب" });
    const driverId = Number(driverCode.toLowerCase().replace("driver", ""));

    if (isNaN(driverId)) {
      return res.json({ success: false, message: "الرقم الوظيفي غير صالح" });
    }

    const sql = `SELECT * FROM driver WHERE driver_id = ?`;
    connection.query(sql, [driverId], async (err, result) => {
      if (err) return loginDbError(res, "Driver login error:", err);

      if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
        return res.json({ success: false, message: "الرقم الوظيفي أو كلمة المرور غير صحيحة" });
      }

      // 🔑 توليد بطاقة الـ JWT للسائق بصلاحية 24 ساعة
      const token = jwt.sign(
        { id: result[0].driver_id, role: "driver" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({ 
        success: true, 
        role: "driver", 
        driverId: result[0].driver_id,
        token: token // إرسال التوكن للواجهة
      });
    });
    return;
  }

  // --- نظام تسجيل دخول الـ Customer ---
  if (!phone) return res.status(400).json({ success: false, message: "رقم الهاتف مطلوب" });

  const sql = `SELECT * FROM customer WHERE phone_caustomer = ?`;
  connection.query(sql, [phone], async (err, result) => {
    if (err) return loginDbError(res, "Customer login error:", err);

    if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
      return res.json({ success: false, message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    }

    // 🔑 توليد بطاقة الـ JWT للزبون بصلاحية 24 ساعة
    const token = jwt.sign(
      { id: result[0].caustomer_id, role: "customer" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      role: "customer",
      userId: result[0].caustomer_id,
      token: token // إرسال التوكن للواجهة
    });
  });
});

// مسار مؤقت لتشفير حسابات الأدمن
router.get("/setup-admins-securely", async (req, res) => {
  try {
    const hash1 = await bcrypt.hash("boraqadmin@ahm1516", 10);
    const hash2 = await bcrypt.hash("boraqadmin@Fad1516", 10);

    connection.query("UPDATE admin SET password = ? WHERE admin_id = 1", [hash1], (err1) => {
      if (err1) return res.send("فشل تحديث الأدمن الأول: " + err1.message);

      connection.query("UPDATE admin SET password = ? WHERE admin_id = 2", [hash2], (err2) => {
        if (err2) return res.send("فشل تحديث الأدمن الثاني: " + err2.message);
        res.send("تم تشفير حسابات الأدمن بنجاح ومطابقتها للسيرفر 100%!");
      });
    });
  } catch (e) {
    res.send("خطأ أثناء التشفير: " + e.message);
  }
});

/* ========================================================
   🔒 5. الحارس البرمجي (Middleware): التحقق من الـ JWT والصلاحية
======================================================== */
function verifyToken(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      if (req.accepts('html')) {
        return res.status(404).send(`Cannot GET ${req.originalUrl}`);
      }
      return res.status(401).json({ success: false, message: "غير مصرح لك، التوكن مفقود" });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (err) {
        if (req.accepts('html')) {
          return res.status(404).send(`Cannot GET ${req.originalUrl}`);
        }
        return res.status(403).json({ success: false, message: "جلسة انتهت أو توكن غير صالح" });
      }

      if (allowedRoles.length && !allowedRoles.includes(decodedUser.role)) {
        if (req.accepts('html')) {
          return res.status(404).send(`Cannot GET ${req.originalUrl}`);
        }
        return res.status(403).json({ success: false, message: "صلاحياتك لا تسمح لك بالوصول لهذا القسم" });
      }

      req.user = decodedUser;
      next();
    });
  };
}
// تصدير الراوتر والدالة الحارسة لاستخدامها لحماية الملفات الأخرى
module.exports = router;
module.exports.verifyToken = verifyToken;