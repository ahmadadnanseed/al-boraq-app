const express = require("express");
const connection = require("./src/db");
const authRoutes = require("./src/routes/auth");
const customerRoutes = require("./src/routes/customers");
const bookingRoutes = require("./src/routes/bookings");

const app = express();
const PORT = 3000;

/* ==============================
   Middleware
============================== */
app.use(express.static("public"));
app.use(express.json());
app.use(authRoutes);
app.use(customerRoutes);
app.use(bookingRoutes);

/* ==============================
   تشغيل السيرفر
============================== */
app.listen(PORT, () => {
  console.log("Express server is running at port no: " + PORT);
});

app.post("/driver/signup", (req, res) => {
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
app.get("/driver/profile-by-id/:driverId", (req, res) => {
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



app.put("/driver/profile/:driverId", (req, res) => {
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

app.get("/admin/driver-requests", (req, res) => {
  const sql = `
    SELECT 
      driver_id,
      fast_name_driver,
      last_name_driver,
      date_of_birth_driver,
      phone_driver,
      address,
      password
    FROM driver
    WHERE status = 'pending'
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

  const sql = `
    UPDATE driver
    SET status = 'accepted'
    WHERE driver_id = ?
  `;

  connection.query(sql, [driverId], (err) => {
    if (err) {
      console.log("Accept driver error:", err);
      return res.json({ success: false, message: "فشل قبول السائق" });
    }

    connection.query(
      "SELECT driver_id, password FROM driver WHERE driver_id = ?",
      [driverId],
      (err2, result) => {
        if (err2 || result.length === 0) {
          return res.json({ success: false, message: "فشل جلب بيانات الدخول" });
        }

        res.json({
          success: true,
          loginCode: "driver" + result[0].driver_id,
          password: result[0].password
        });
      }
    );
  });
});

app.put("/admin/driver-requests/:id/reject", (req, res) => {
  const driverId = req.params.id;

  const sql = `
    UPDATE driver
    SET status = 'rejected'
    WHERE driver_id = ?
  `;

  connection.query(sql, [driverId], (err) => {
    if (err) {
      console.log("Reject driver error:", err);
      return res.json({ success: false, message: "فشل رفض السائق" });
    }

    res.json({
      success: true,
      message: "تم رفض الطلب"
    });
  });
});

connection.connect((err) => {
  if (err) {
    console.log("DB connection FAILED:", err);
  } else {
    console.log("DB connection succeeded");
  }
});

app.get("/driver/booking-requests", (req, res) => {
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

app.put("/driver/booking-requests/:id/accept", (req, res) => {
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

function buildDailyTripInsertRow(booking, formattedDate, tripTime, direction, pickupVal, dropoffVal) {
  return [
    booking.booking_id,
    booking.customer_id_fk,
    booking.dependent_id_fk || null,
    booking.driver_id_fk,
    formattedDate,
    tripTime,
    direction,
    JSON.stringify(pickupVal),
    JSON.stringify(dropoffVal),
    "scheduled"
  ];
}

function createDailyTripsFromBooking(bookingId, callback) {
  const getBookingSql = `
    SELECT *
    FROM booking
    WHERE booking_id = ?
  `;

  connection.query(getBookingSql, [bookingId], (err, result) => {
    if (err || result.length === 0) {
      return callback(err || new Error("Booking not found"));
    }

    const booking = result[0];
    const startDate = new Date(booking.start_date_booking);

    const trips = [];

    for (let i = 0; i < 30; i++) {
      const tripDate = new Date(startDate);
      tripDate.setDate(startDate.getDate() + i);

      const formattedDate = tripDate.toISOString().split("T")[0];

      trips.push(
        buildDailyTripInsertRow(
          booking,
          formattedDate,
          booking.start_time,
          "go",
          booking.pickup,
          booking.dropoff
        )
      );

      if (booking.trip_type === "round-trip" && booking.end_time) {
        trips.push(
          buildDailyTripInsertRow(
            booking,
            formattedDate,
            booking.end_time,
            "return",
            booking.dropoff,
            booking.pickup
          )
        );
      }
    }

    const insertSql = `
      INSERT INTO daily_trips
      (
        booking_id_fk,
        customer_id_fk,
        dependent_id_fk,
        driver_id_fk,
        trip_date,
        trip_time,
        trip_direction,
        pickup,
        dropoff,
        status
      )
      VALUES ?
    `;

    connection.query(insertSql, [trips], callback);
  });
}

app.get("/customer/today-trips/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  const sql = `
    SELECT
      dt.daily_trip_id,
      dt.trip_date,
      TIME_FORMAT(dt.trip_time, '%H:%i') AS trip_time,
      dt.trip_direction,
      dt.pickup,
      dt.dropoff,
      dt.status,

      d.fast_name_driver,
      d.last_name_driver,
      d.phone_driver,

      dep.fast_name_dependent,
      dep.last_name_dependent,
      dep.relationship,

      v.vehicle_type,
      v.vehicle_mode,
      v.vehicle_year_of_manufacturel,
      v.color

    FROM daily_trips dt
    JOIN driver d ON dt.driver_id_fk = d.driver_id
    LEFT JOIN dependent dep ON dt.dependent_id_fk = dep.dependent_id
    LEFT JOIN vehicle v ON v.driver_id_fk = d.driver_id

    WHERE dt.customer_id_fk = ?
    AND dt.trip_date = CURDATE()
    AND (
      dt.status IN ('scheduled','driver_started','driver_arrived','passenger_picked')
      OR (dt.status = 'completed' AND dt.customer_completion_confirmed = 0)
    )

    ORDER BY dt.trip_time ASC
  `;

  connection.query(sql, [customerId], (err, result) => {
    if (err) {
      console.log("Today trips error:", err);
      return res.json({ success: false, message: "فشل جلب إشعارات اليوم" });
    }

    res.json({ success: true, trips: result });
  });
});

app.put("/daily-trips/:tripId/postpone", (req, res) => {
  const tripId = req.params.tripId;
  const { postponed_to } = req.body;

  const sql = `
    UPDATE daily_trips
    SET status = 'postponed',
        postponed_to = ?
    WHERE daily_trip_id = ?
  `;

  connection.query(sql, [postponed_to, tripId], (err) => {
    if (err) {
      console.log("Postpone trip error:", err);
      return res.json({ success: false, message: "فشل تأجيل الرحلة" });
    }

    res.json({ success: true, message: "تم تأجيل الرحلة" });
  });
});

app.get("/driver/today-trips/:driverId", (req, res) => {
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

app.put("/driver/daily-trips/:tripId/arrived", (req, res) => {
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

app.put("/driver/daily-trips/:tripId/completed", (req, res) => {
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

app.put("/customer/daily-trips/:tripId/rate", (req, res) => {
  const tripId = req.params.tripId;
  const { rating, comment } = req.body;

  const sql = `
    UPDATE daily_trips
    SET
      customer_completion_confirmed = 1,
      customer_rating = ?,
      customer_comment = ?
    WHERE daily_trip_id = ?
  `;

  connection.query(sql, [rating, comment || "", tripId], (err) => {
    if (err) {
      console.log("Rating error:", err);
      return res.json({ success: false, message: "فشل حفظ التقييم" });
    }

    res.json({ success: true, message: "تم حفظ التقييم" });
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
      SELECT
        caustomer_id AS id,
        CONCAT(fast_name_caustomer, ' ', last_name_caustomer) AS name,
        phone_caustomer AS phone,
        DATE_FORMAT(date_of_birth_caustomer, '%Y-%m-%d') AS dob
      FROM customer
      ORDER BY caustomer_id DESC
    `,
  pendingSubs: `
      SELECT
        b.booking_id AS id,
        CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS user,
        b.trip_type AS type,
        'معلق' AS status
      FROM booking b
      JOIN customer c ON b.customer_id_fk = c.caustomer_id
      WHERE b.status = 1
      ORDER BY b.booking_id DESC
    `,
  activeSubs: `
      SELECT
        b.booking_id AS id,
        CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS user,
        b.trip_type AS type,
        'فعال' AS status
      FROM booking b
      JOIN customer c ON b.customer_id_fk = c.caustomer_id
      WHERE b.status = 2
      ORDER BY b.booking_id DESC
    `,
  drivers: `
      SELECT
        driver_id AS id,
        CONCAT(fast_name_driver, ' ', last_name_driver) AS name,
        phone_driver AS phone,
        address
      FROM driver
      WHERE status = 'accepted'
      ORDER BY driver_id DESC
    `
};

app.get("/admin/dashboard-section/:section", (req, res) => {
  const sql = ADMIN_DASHBOARD_SECTION_SQL[req.params.section];

  if (!sql) {
    return res.json({ success: false, message: "قسم غير معروف" });
  }

  connection.query(sql, (err, rows) => {
    if (err) {
      console.log("Admin section error:", err);
      return res.json({ success: false });
    }

    res.json({ success: true, rows });
  });
});

app.put("/driver/daily-trips/:tripId/start", (req, res) => {
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

app.put("/driver/daily-trips/:tripId/picked", (req, res) => {
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

const resetCodes = {};

app.post("/forgot-password/send-code", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.json({ success: false, message: "أدخل رقم الهاتف" });
  }

  const sql = `
    SELECT caustomer_id
    FROM customer
    WHERE phone_caustomer = ?
  `;

  connection.query(sql, [phone], (err, result) => {
    if (err) {
      console.log("Forgot check phone error:", err);
      return res.json({ success: false, message: "خطأ في السيرفر" });
    }

    if (result.length === 0) {
      return res.json({ success: false, message: "رقم الهاتف غير مسجل" });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    resetCodes[phone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

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

  if (!saved) {
    return res.json({ success: false, message: "لم يتم إرسال رمز لهذا الرقم" });
  }

  if (Date.now() > saved.expiresAt) {
    delete resetCodes[phone];
    return res.json({ success: false, message: "انتهت صلاحية الرمز" });
  }

  if (saved.code !== code) {
    return res.json({ success: false, message: "رمز التحقق غير صحيح" });
  }

  res.json({ success: true, message: "تم التحقق" });
});

app.put("/forgot-password/reset", (req, res) => {
  const { phone, code, newPassword } = req.body;

  const saved = resetCodes[phone];

  if (!saved || saved.code !== code || Date.now() > saved.expiresAt) {
    return res.json({ success: false, message: "رمز التحقق غير صالح" });
  }

  const sql = `
    UPDATE customer
    SET password = ?
    WHERE phone_caustomer = ?
  `;

  connection.query(sql, [newPassword, phone], (err) => {
    if (err) {
      console.log("Reset password error:", err);
      return res.json({ success: false, message: "فشل تغيير كلمة المرور" });
    }

    delete resetCodes[phone];

    res.json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح"
    });
  });
});