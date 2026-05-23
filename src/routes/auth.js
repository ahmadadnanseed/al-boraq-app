const express = require("express");
const connection = require("../db");

const router = express.Router();

function splitFullName(name) {
  const parts = (name || "").trim().split(" ");
  return {
    first: parts[0] || "",
    last: parts.slice(1).join(" ") || ""
  };
}

function loginDbError(res, logLabel, err) {
  console.log(logLabel, err);
  return res.json({ success: false, message: "خطأ في السيرفر" });
}

/* ==============================
   تسجيل مستخدم جديد
============================== */
router.post("/signup", (req, res) => {
  const { name, phone, dob, password } = req.body;

  if (!name || !phone || !dob || !password) {
    return res.status(400).json({
      success: false,
      message: "جميع الحقول مطلوبة"
    });
  }

  const { first: first_name, last: last_name } = splitFullName(name);

  const sql = `
    INSERT INTO customer
    (fast_name_caustomer, last_name_caustomer, phone_caustomer, date_of_birth_caustomer, password)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(sql, [first_name, last_name, phone, dob, password], (err, result) => {
    if (err) {
      console.log("Signup error:", err);
      return res.status(500).json({
        success: false,
        message: "فشل إنشاء الحساب",
        error: err.sqlMessage
      });
    }

    res.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      userId: result.insertId
    });
  });
});

/* ==============================
   تسجيل الدخول
============================== */
router.post("/login", (req, res) => {
  console.log("LOGIN BODY:", req.body);

  const { loginType, phone, driverCode, adminCode, password } = req.body;

  if (loginType === "admin") {
    const adminId = adminCode.toLowerCase().replace("admin", "");

    const sql = `
      SELECT * FROM admin
      WHERE admin_id = ? AND password = ?
    `;

    connection.query(sql, [adminId, password], (err, result) => {
      if (err) {
        return loginDbError(res, "Admin login error:", err);
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "رقم الأدمن أو كلمة المرور غير صحيحة"
        });
      }

      return res.json({
        success: true,
        role: "admin",
        adminId: result[0].admin_id
      });
    });

    return;
  }

  if (loginType === "driver") {
    const driverId = driverCode.toLowerCase().replace("driver", "");

    const sql = `
      SELECT * FROM driver
      WHERE driver_id = ? AND password = ?
    `;

    connection.query(sql, [driverId, password], (err, result) => {
      if (err) {
        return loginDbError(res, "Driver login error:", err);
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "الرقم الوظيفي أو كلمة المرور غير صحيحة"
        });
      }

      return res.json({
        success: true,
        role: "driver",
        driverId: result[0].driver_id
      });
    });

    return;
  }

  const sql = `
    SELECT * FROM customer
    WHERE phone_caustomer = ? AND password = ?
  `;

  connection.query(sql, [phone, password], (err, result) => {
    if (err) {
      return loginDbError(res, "Customer login error:", err);
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "رقم الهاتف أو كلمة المرور غير صحيحة"
      });
    }

    res.json({
      success: true,
      role: "customer",
      userId: result[0].caustomer_id
    });
  });
});

module.exports = router;
