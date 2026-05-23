const express = require("express");
const connection = require("../db");

const router = express.Router();

router.post("/booking", (req, res) => {
  const {
    start_date_booking,
    start_time,
    end_time,
    status,
    trip_type,
    customer_id_fk,
     dependent_id_fk,
    is_for_dependent,
    driver_id_fk,
    pickup,
    dropoff,
    seats_count,
    price,
    distance_km,
    duration_min
  } = req.body;

  const sql = `
    INSERT INTO booking
    (
      start_date_booking,
      start_time,
      end_time,
      status,
      trip_type,
      customer_id_fk,
       dependent_id_fk,
      is_for_dependent,
      driver_id_fk,
      pickup,
      dropoff,
      seats_count,
      price,
      distance_km,
      duration_min
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    sql,
    [
      start_date_booking,
      start_time,
      end_time,
      status,
      trip_type,
      customer_id_fk,
      dependent_id_fk,
      is_for_dependent,
      driver_id_fk,
      JSON.stringify(pickup),
      JSON.stringify(dropoff),
      seats_count,
      price,
      distance_km,
      duration_min

    ],
    (err, result) => {
      if (err) {
        console.log("Booking insert error:", err);
        return res.json({
          success: false,
          message: "فشل حفظ الحجز"
        });
      }

      res.json({
        success: true,
        bookingId: result.insertId
      });
    }
  );
});

router.post("/dependent", (req, res) => {
  const {
    firstName,
    lastName,
    relationship,
    phone,
    dob,
    customerId
  } = req.body;

  if (!firstName || !lastName || !relationship || !dob || !customerId) {
    return res.json({
      success: false,
      message: "بيانات التابع غير مكتملة"
    });
  }

  const sql = `
    INSERT INTO dependent
    (
      fast_name_dependent,
      last_name_dependent,
      relationship,
      phone,
      customer_id_fk,
      date_of_birth_dependent
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    sql,
    [
      firstName,
      lastName,
      relationship,
      phone || "",
      customerId,
      dob
    ],
    (err, result) => {
      if (err) {
        console.log("Dependent insert error:", err);
        return res.json({
          success: false,
          message: "فشل حفظ بيانات التابع"
        });
      }

      res.json({
        success: true,
        dependentId: result.insertId
      });
    }
  );
});
router.put("/booking/:id/confirm", (req, res) => {
  const bookingId = req.params.id;

  const {
    selected_seats,
    seats_count,
    price,
    distance_km,
    duration_min
  } = req.body;

  const sql = `
    UPDATE booking
    SET
      selected_seats = ?,
      seats_count = ?,
      price = ?,
      distance_km = ?,
      duration_min = ?,
      status = 1
    WHERE booking_id = ?
  `;

  connection.query(
    sql,
    [
      JSON.stringify(selected_seats),
      seats_count,
      price,
      distance_km,
      duration_min,
      bookingId
    ],
    (err) => {
      if (err) {
        console.log("Confirm booking error:", err);
        return res.json({
          success: false,
          message: "فشل تأكيد الحجز"
        });
      }

      res.json({
        success: true,
        message: "تم تأكيد الحجز"
      });
    }
  );
});
router.delete("/booking/:id", (req, res) => {
  const bookingId = req.params.id;

  const sql = `
    DELETE FROM booking
    WHERE booking_id = ?
  `;

  connection.query(sql, [bookingId], (err) => {
    if (err) {
      console.log("Delete booking error:", err);
      return res.json({
        success: false,
        message: "فشل إلغاء الحجز"
      });
    }

    res.json({
      success: true,
      message: "تم إلغاء الحجز"
    });
  });
});

module.exports = router;
