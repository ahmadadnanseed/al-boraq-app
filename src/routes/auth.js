const express = require("express");
const connection = require("../db");
const bcrypt = require("bcryptjs"); 
const jwt = require("jsonwebtoken");

const router = express.Router();
const signupOtpCodes = {};

const JWT_SECRET = process.env.JWT_SECRET || "BURAQ_SUPER_SECRET_SECURITY_KEY_2026";

function splitFullName(name) {
  const parts = (name || "").trim().split(" ");
  return {
    first: parts[0] || "",
    last: parts.slice(1).join(" ") || ""
  };
}

function loginDbError(res, logLabel, err) {
  console.error(logLabel, err);
  return res.status(500).json({ success: false, message: "خطأ داخلي في السيرفر" });
}

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

router.post("/login", (req, res) => {
  const { loginType, phone, driverCode, adminCode, password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: "كلمة المرور مطلوبة" });
  }

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

      const token = jwt.sign(
        { id: result[0].admin_id, role: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({ 
        success: true, 
        role: "admin", 
        adminId: result[0].admin_id,
        token: token
      });
    });
    return;
  }

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

      const token = jwt.sign(
        { id: result[0].driver_id, role: "driver" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({ 
        success: true, 
        role: "driver", 
        driverId: result[0].driver_id,
        token: token
      });
    });
    return;
  }

  if (!phone) return res.status(400).json({ success: false, message: "رقم الهاتف مطلوب" });

  const sql = `SELECT * FROM customer WHERE phone_caustomer = ?`;
  connection.query(sql, [phone], async (err, result) => {
    if (err) return loginDbError(res, "Customer login error:", err);

    if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
      return res.json({ success: false, message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    }

    const token = jwt.sign(
      { id: result[0].caustomer_id, role: "customer" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      role: "customer",
      userId: result[0].caustomer_id,
      token: token
    });
  });
});

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
module.exports = router;
module.exports.verifyToken = verifyToken;