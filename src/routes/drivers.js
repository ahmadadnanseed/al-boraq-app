const express = require("express");
const connection = require("../db");
const { createDailyTripsFromBooking } = require("./dailyTrips");

const router = express.Router();

function splitFullName(name) {
  const parts = (name || "").trim().split(" ");
  return {
    first: parts[0] || "",
    last: parts.slice(1).join(" ") || ""
  };
}
router.post("/driver/signup", (req, res) => {
  const {
    userId,
    address,
    vehicleType,
    vehicleModel,
    vehicleYear,
    plateNumber,
    color
  } = req.body;

  if (!userId || !address || !vehicleType || !vehicleModel || !vehicleYear || !plateNumber || !color) {
    return res.json({
      success: false,
      message: "البيانات غير مكتملة"
    });
  }

  const getUserSql = `
    SELECT * FROM customer WHERE caustomer_id = ?
  `;

  connection.query(getUserSql, [userId], (err, userResult) => {
    if (err || userResult.length === 0) {
      console.log("User fetch error:", err);
      return res.json({
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    const user = userResult[0];

    const firstName = user.fast_name_caustomer || "";
    const lastName = user.last_name_caustomer || "";
    const dob = user.date_of_birth_caustomer || null;
    const phone = user.phone_caustomer || "";

    const checkDriverSql = `
      SELECT * FROM driver WHERE phone_driver = ?
    `;

    connection.query(checkDriverSql, [phone], (err2, driverResult) => {
      if (err2) {
        console.log("Check driver error:", err2);
        return res.json({
          success: false,
          message: "فشل التحقق من السائق"
        });
      }

      if (driverResult.length > 0) {
        return res.json({
          success: false,
          message: "لقد تم إرسال طلبك بالفعل"
        });
      }

      const tempPassword = "driver" + Date.now();

      const driverSql = `
        INSERT INTO driver
        (fast_name_driver, last_name_driver, date_of_birth_driver, phone_driver, address, password, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        driverSql,
        [firstName, lastName, dob, phone, address, tempPassword, "pending"],
        (driverErr, driverInsertResult) => {
          if (driverErr) {
            console.log("Driver insert error:", driverErr);
            return res.json({
              success: false,
              message: "فشل حفظ بيانات السائق"
            });
          }

          const driverId = driverInsertResult.insertId;

          const vehicleSql = `
            INSERT INTO vehicle
            (vehicle_type, vehicle_mode, vehicle_year_of_manufacturel, vehicle_license_blate_number, driver_id_fk, color)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          connection.query(
            vehicleSql,
            [
              vehicleType,
              vehicleModel,
              vehicleYear,
              plateNumber,
              driverId,
              color
            ],
            (vehicleErr) => {
              if (vehicleErr) {
                console.log("Vehicle insert error:", vehicleErr);
                return res.json({
                  success: false,
                  message: "فشل حفظ بيانات المركبة"
                });
              }

              res.json({
                success: true,
                message: "تم إرسال طلبك بنجاح"
              });
            }
          );
        }
      );
    });
  });
});

router.get("/driver/profile-by-id/:driverId", (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT 
      driver.driver_id,
      driver.fast_name_driver,
      driver.last_name_driver,
      driver.phone_driver,
      driver.address,
      vehicle.vehicle_type,
      vehicle.vehicle_mode,
      vehicle.vehicle_year_of_manufacturel,
      vehicle.vehicle_license_blate_number,
      vehicle.color
    FROM driver
    LEFT JOIN vehicle ON vehicle.driver_id_fk = driver.driver_id
    WHERE driver.driver_id = ?
    LIMIT 1
  `;

  connection.query(sql, [driverId], (err, result) => {
    if (err) {
      console.log("Driver profile by id error:", err);
      return res.json({
        success: false,
        message: "فشل جلب بيانات السائق"
      });
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "السائق غير موجود"
      });
    }

    res.json({
      success: true,
      driver: result[0]
    });
  });
});




router.put("/driver/profile/:driverId", (req, res) => {
  const driverId = req.params.driverId;

  const {
    name,
    phone,
    address,
    vehicleType,
    vehicleModel,
    vehicleYear,
    plate,
    color
  } = req.body;

  const { first: firstName, last: lastName } = splitFullName(name);

  const updateDriverSql = `
    UPDATE driver
    SET 
      fast_name_driver = ?,
      last_name_driver = ?,
      phone_driver = ?,
      address = ?
    WHERE driver_id = ?
  `;

  connection.query(
    updateDriverSql,
    [firstName, lastName, phone, address, driverId],
    (driverErr) => {
      if (driverErr) {
        console.log("Update driver error:", driverErr);
        return res.json({ success: false, message: "فشل تعديل بيانات السائق" });
      }

      const updateVehicleSql = `
        UPDATE vehicle
        SET
          vehicle_type = ?,
          vehicle_mode = ?,
          vehicle_year_of_manufacturel = ?,
          vehicle_license_blate_number = ?,
          color = ?
        WHERE driver_id_fk = ?
      `;

      connection.query(
        updateVehicleSql,
        [vehicleType, vehicleModel, vehicleYear, plate, color, driverId],
        (vehicleErr) => {
          if (vehicleErr) {
            console.log("Update vehicle error:", vehicleErr);
            return res.json({ success: false, message: "فشل تعديل بيانات المركبة" });
          }

          res.json({ success: true, message: "تم تحديث بيانات السائق" });
        }
      );
    }
  );
});


router.get("/driver/booking-requests", (req, res) => {
  const sql = `
    SELECT
      b.booking_id,
      b.start_date_booking,
      TIME_FORMAT(b.start_time, '%H:%i') AS start_time,
      TIME_FORMAT(b.end_time, '%H:%i') AS end_time,
      b.status,
      b.trip_type,
      b.pickup,
      b.dropoff,
      b.seats_count,
      b.selected_seats,
      b.price,
      b.distance_km,
      b.duration_min,

      c.caustomer_id,
      c.fast_name_caustomer,
      c.last_name_caustomer,
      c.date_of_birth_caustomer,
      c.phone_caustomer,

      d.dependent_id,
      d.fast_name_dependent,
      d.last_name_dependent,
      d.relationship,
      d.phone AS dependent_phone,
      d.date_of_birth_dependent

    FROM booking b
    JOIN customer c ON b.customer_id_fk = c.caustomer_id
    LEFT JOIN dependent d ON b.dependent_id_fk = d.dependent_id
    WHERE b.status = 1
    ORDER BY b.booking_id DESC
  `;

  connection.query(sql, (err, result) => {
    if (err) {
      console.log("Driver booking requests error:", err);
      return res.json({ success: false, message: "فشل جلب الطلبات" });
    }

    res.json({ success: true, requests: result });
  });
});


router.put("/driver/booking-requests/:id/accept", (req, res) => {
  const bookingId = req.params.id;
  const driverId = req.body.driverId; // لازم تبعثه من الفرونت

  const sql = `
    UPDATE booking
    SET driver_id_fk = ?, status = 2
    WHERE booking_id = ? AND status = 1
  `;

  connection.query(sql, [driverId, bookingId], (err, result) => {
    if (err) {
      console.log("Accept booking request error:", err);
      return res.json({ success: false, message: "فشل قبول الطلب" });
    }

    // 👇 هون أهم خطوة: إنشاء الرحلات اليومية
    createDailyTripsFromBooking(bookingId, (tripErr) => {
      if (tripErr) {
        console.log("Create trips error:", tripErr);
        return res.json({
          success: false,
          message: "تم قبول الطلب لكن فشل إنشاء الرحلات"
        });
      }

      res.json({
        success: true,
        message: "تم قبول الطلب وإنشاء الرحلات اليومية"
      });
    });
  });
});


router.get("/driver/today-trips/:driverId", (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT
      dt.daily_trip_id,
      dt.trip_date,
      TIME_FORMAT(dt.trip_time, '%H:%i') AS trip_time,
      dt.trip_direction,
      dt.pickup,
      dt.dropoff,
      dt.status,

      c.fast_name_caustomer,
      c.last_name_caustomer,
      c.phone_caustomer,
      c.date_of_birth_caustomer,

      d.fast_name_dependent,
      d.last_name_dependent,
      d.relationship

    FROM daily_trips dt
    JOIN customer c ON dt.customer_id_fk = c.caustomer_id
    LEFT JOIN dependent d ON dt.dependent_id_fk = d.dependent_id

    WHERE dt.driver_id_fk = ?
    AND dt.trip_date = CURDATE()
   AND dt.status IN ('scheduled','driver_started','driver_arrived','passenger_picked')

    ORDER BY dt.trip_time ASC
  `;

  connection.query(sql, [driverId], (err, result) => {
    if (err) {
      console.log("Driver today trips error:", err);
      return res.json({ success: false, message: "فشل جلب رحلات اليوم" });
    }

    res.json({ success: true, trips: result });
  });
});


router.put("/driver/daily-trips/:tripId/arrived", (req, res) => {
  const tripId = req.params.tripId;

  const sql = `
    UPDATE daily_trips
    SET
      status = 'driver_arrived',
      driver_arrival_confirmed = 1
    WHERE daily_trip_id = ?
  `;

  connection.query(sql, [tripId], (err) => {
    if (err) {
      console.log("Driver arrived error:", err);
      return res.json({ success: false, message: "فشل تحديث حالة الوصول" });
    }

    res.json({ success: true, message: "تم إشعار العميل بأن السائق بالانتظار" });
  });
});


router.put("/driver/daily-trips/:tripId/completed", (req, res) => {
  const tripId = req.params.tripId;

  const sql = `
    UPDATE daily_trips
    SET status = 'completed'
    WHERE daily_trip_id = ?
  `;

  connection.query(sql, [tripId], (err) => {
    if (err) {
      console.log("Complete trip error:", err);
      return res.json({ success: false, message: "فشل إنهاء الرحلة" });
    }

    res.json({ success: true, message: "تم إنهاء الرحلة" });
  });
});


router.put("/driver/daily-trips/:tripId/start", (req, res) => {
  const tripId = req.params.tripId;

  const sql = `
    UPDATE daily_trips
    SET status = 'driver_started'
    WHERE daily_trip_id = ?
  `;

  connection.query(sql, [tripId], (err) => {
    if (err) {
      console.log("Start trip error:", err);
      return res.json({ success: false, message: "فشل بدء الرحلة" });
    }

    res.json({ success: true, message: "تم بدء الرحلة" });
  });
});


router.put("/driver/daily-trips/:tripId/picked", (req, res) => {
  const tripId = req.params.tripId;

  const sql = `
    UPDATE daily_trips
    SET status = 'passenger_picked'
    WHERE daily_trip_id = ?
  `;

  connection.query(sql, [tripId], (err) => {
    if (err) {
      console.log("Picked passenger error:", err);
      return res.json({ success: false, message: "فشل تأكيد الركوب" });
    }

    res.json({ success: true, message: "تم تأكيد ركوب الراكب" });
  });
});
router.get("/driver/statistics/:driverId", (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT
      COALESCE(SUM(CASE WHEN DATE(dt.trip_date) = CURDATE() THEN 1 ELSE 0 END), 0) AS todayTrips,
      COALESCE(SUM(CASE WHEN MONTH(dt.trip_date) = MONTH(CURDATE()) AND YEAR(dt.trip_date) = YEAR(CURDATE()) THEN 1 ELSE 0 END), 0) AS monthlyTrips,

      COALESCE(SUM(CASE WHEN dt.status = 'completed' THEN 1 ELSE 0 END), 0) AS completedTrips,
      COALESCE(SUM(CASE WHEN dt.status IN ('scheduled','driver_started','driver_arrived','passenger_picked','missed') THEN 1 ELSE 0 END), 0) AS pendingTrips,
      COALESCE(SUM(CASE WHEN dt.status = 'postponed' THEN 1 ELSE 0 END), 0) AS postponedTrips,
      COALESCE(SUM(CASE WHEN dt.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledTrips,

      COALESCE(SUM(CASE WHEN DATE(dt.trip_date) = CURDATE() AND dt.status = 'completed' THEN b.price ELSE 0 END), 0) AS todayEarnings,
      COALESCE(SUM(CASE WHEN MONTH(dt.trip_date) = MONTH(CURDATE()) AND YEAR(dt.trip_date) = YEAR(CURDATE()) AND dt.status = 'completed' THEN b.price ELSE 0 END), 0) AS monthlyEarnings,
      COALESCE(SUM(CASE WHEN dt.status = 'completed' THEN b.price ELSE 0 END), 0) AS availableBalance

    FROM daily_trips dt
    LEFT JOIN booking b ON dt.booking_id_fk = b.booking_id
    WHERE dt.driver_id_fk = ?
  `;

  connection.query(sql, [driverId], (err, result) => {
    if (err) {
      console.log("Driver statistics error:", err);
      return res.json({
        success: false,
        message: "فشل تحميل إحصائيات السائق",
        error: err.sqlMessage
      });
    }

    res.json({
      success: true,
      statistics: result[0]
    });
  });
});

module.exports = router;