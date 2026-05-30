const express = require("express");
const connection = require("../db");
const bcrypt = require("bcryptjs"); // استيراد مكتبة التشفير الآمن

const router = express.Router();
const signupOtpCodes = {};

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
      expiresAt: Date.now() + 5 * 60 * 1000 // صلاحية 5 دقائق
    };

    console.log("Signup OTP for", phone, "is:", code);

    res.json({
      success: true,
      message: "تم إرسال رمز التحقق"
      // أمنياً: لا ترسل الـ code في الاستجابة بالإنتاج الحقيقي، يرسل فقط عبر SMS.
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
    // تشفير كلمة المرور بقوة 10 Salt Rounds
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
        // أمنياً: حجبنا الـ err.sqlMessage لحماية هيكل الجداول من الانكشاف
      }

      res.json({ success: true, message: "تم إنشاء الحساب بنجاح", userId: result.insertId });
    });

  } catch (cryptErr) {
    return loginDbError(res, "Bcrypt error:", cryptErr);
  }
});

/* ========================================================
   4. تسجيل الدخول الآمن (Admin, Driver, Customer)
======================================================== */
router.post("/login", (req, res) => {
  const { loginType, phone, driverCode, adminCode, password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: "كلمة المرور مطلوبة" });

  }
// --- نظام تسجيل دخول الـ Admin المطور ---
if (loginType === "admin") {
  if (!adminCode) return res.status(400).json({ success: false, message: "رمز الأدمن مطلوب" });
  
  // تحويل الناتج إلى رقم حقيقي متوافق مع int(10) في الداتابيز
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

    return res.json({ success: true, role: "admin", adminId: result[0].admin_id });
  });
  return;
}

// --- نظام تسجيل دخول الـ Driver المطور ---
if (loginType === "driver") {
  if (!driverCode) return res.status(400).json({ success: false, message: "الرقم الوظيفي مطلوب" });
  
  // تحويل الناتج إلى رقم حقيقي متوافق مع int(10) في الداتابيز
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

    return res.json({ success: true, role: "driver", driverId: result[0].driver_id });
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

    res.json({
      success: true,
      role: "customer",
      userId: result[0].caustomer_id
    });
  });
});
// مسار مؤقت لتشفير حسابات الأدمن من داخل السيرفر مباشرة لضمان المطابقة
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

module.exports = router;