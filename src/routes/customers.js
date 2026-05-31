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

/* ==============================
   جلب بيانات المستخدم للملف الشخصي (آمن)
============================== */
router.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT caustomer_id, fast_name_caustomer, last_name_caustomer, phone_caustomer, date_of_birth_caustomer, email, gender
    FROM customer
    WHERE caustomer_id = ?
  `;

  connection.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Get user error:", err);
      return res.status(500).json({
        success: false,
        message: "خطأ داخلي في السيرفر" // حجب تفاصيل الخطأ الحساسة
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    res.json({
      success: true,
      user: result[0]
    });
  });
});

/* ==============================
   تعديل بيانات المستخدم (تم تأمينه وحجب تفاصيل الـ SQL)
============================== */
router.put("/user/:id", (req, res) => {
  const userId = req.params.id;
  const { name, phone, dob, email, gender } = req.body;
  const cleanDob = dob ? String(dob).split("T")[0] : null;

  const { first: first_name, last: last_name } = splitFullName(name);

  const sql = `
    UPDATE customer
    SET
      fast_name_caustomer = ?,
      last_name_caustomer = ?,
      phone_caustomer = ?,
      date_of_birth_caustomer = ?,
      email = ?,
      gender = ?
    WHERE caustomer_id = ?
  `;

  connection.query(
    sql,
    [first_name, last_name, phone || "", cleanDob, email || "", gender || "", userId],
    (err, result) => {
      if (err) {
        // طباعة تفاصيل الخطأ في كونسول السيرفر الخاص بك فقط لحمايتها
        console.error("Update customer database error:", err); 
        return res.status(500).json({
          success: false,
          message: "فشل تحديث البيانات، يرجى المحاولة لاحقاً" 
          // تم إزالة err.sqlMessage لمنع استكشاف هيكل الجداول من قبل المتطفلين
        });
      }

      res.json({
        success: true,
        message: "تم تحديث البيانات بنجاح"
      });
    }
  );
});

/* ==============================
   جلب اشتراكات العميل (آمن)
============================== */
router.get("/customer/subscriptions/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  const sql = `
    SELECT
      b.booking_id, b.start_date_booking,
      TIME_FORMAT(b.start_time, '%H:%i') AS start_time,
      TIME_FORMAT(b.end_time, '%H:%i') AS end_time,
      b.trip_type, b.pickup, b.dropoff, b.seats_count, b.selected_seats, b.price, b.distance_km, b.duration_min,
      d.driver_id, d.fast_name_driver, d.last_name_driver, d.phone_driver, d.date_of_birth_driver,
      v.vehicle_type, v.vehicle_mode, v.vehicle_year_of_manufacturel, v.vehicle_license_blate_number, v.color
    FROM booking b
    LEFT JOIN driver d ON b.driver_id_fk = d.driver_id
    LEFT JOIN vehicle v ON v.driver_id_fk = d.driver_id
    WHERE b.customer_id_fk = ?
    AND b.status = 2
    ORDER BY b.booking_id DESC
  `;

  connection.query(sql, [customerId], (err, result) => {
    if (err) {
      console.error("Customer subscriptions error:", err);
      return res.status(500).json({
        success: false,
        message: "خطأ داخلي أثناء جلب البيانات"
      });
    }

    res.json({
      success: true,
      subscriptions: result
    });
  });
});

module.exports = router;