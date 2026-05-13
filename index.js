const express = require("express");
const mysql = require("mysql");

const app = express();
const PORT = 3000;

/* ==============================
   Middleware
============================== */
app.use(express.static("public"));
app.use(express.json());

/* ==============================
   تشغيل السيرفر
============================== */
app.listen(PORT, () => {
  console.log("Express server is running at port no: " + PORT);
});

/* ==============================
   الاتصال بقاعدة البيانات
============================== */
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "boraq_database"
});


/* ==============================
   تسجيل مستخدم جديد
============================== */
app.post("/signup", (req, res) => {
  const { name, phone, dob, password } = req.body;

  if (!name || !phone || !dob || !password) {
    return res.status(400).json({
      success: false,
      message: "جميع الحقول مطلوبة"
    });
  }

  const parts = name.trim().split(" ");
  const first_name = parts[0] || "";
  const last_name = parts.slice(1).join(" ") || "";

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
app.post("/login", (req, res) => {
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
        console.log("Admin login error:", err);
        return res.json({ success: false, message: "خطأ في السيرفر" });
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
        console.log("Driver login error:", err);
        return res.json({ success: false, message: "خطأ في السيرفر" });
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
      console.log("Customer login error:", err);
      return res.json({ success: false, message: "خطأ في السيرفر" });
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
/* ==============================
   جلب بيانات المستخدم للملف الشخصي
============================== */
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT *
    FROM customer
    WHERE caustomer_id = ?
  `;

  connection.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("Get user error:", err);
      return res.status(500).json({
        success: false,
        message: "خطأ في جلب البيانات"
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
   تعديل بيانات المستخدم
============================== */
app.put("/user/:id", (req, res) => {
  const userId = req.params.id;
  const { name, phone, dob, email, gender } = req.body;
  const cleanDob = dob ? String(dob).split("T")[0] : null;

  const parts = (name || "").trim().split(" ");
  const first_name = parts[0] || "";
  const last_name = parts.slice(1).join(" ") || "";

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
        console.log("Update error:", err);
        return res.status(500).json({
          success: false,
          message: "فشل التعديل",
          error: err.sqlMessage
        });
      }

      res.json({
        success: true,
        message: "تم تحديث البيانات بنجاح"
      });
    }
  );
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

  const parts = (name || "").trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

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

app.post("/booking", (req, res) => {
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

connection.connect((err) => {
  if (err) {
    console.log("DB connection FAILED:", err);
  } else {
    console.log("DB connection succeeded");
  }
});

app.post("/dependent", (req, res) => {
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
app.put("/booking/:id/confirm", (req, res) => {
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
app.delete("/booking/:id", (req, res) => {
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

app.get("/customer/subscriptions/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  const sql = `
    SELECT
      b.booking_id,
      b.start_date_booking,
      TIME_FORMAT(b.start_time, '%H:%i') AS start_time,
      TIME_FORMAT(b.end_time, '%H:%i') AS end_time,
      b.trip_type,
      b.pickup,
      b.dropoff,
      b.seats_count,
      b.selected_seats,
      b.price,
      b.distance_km,
      b.duration_min,

      d.driver_id,
      d.fast_name_driver,
      d.last_name_driver,
      d.phone_driver,
      d.date_of_birth_driver,

      v.vehicle_type,
      v.vehicle_mode,
      v.vehicle_year_of_manufacturel,
      v.vehicle_license_blate_number,
      v.color

    FROM booking b
    LEFT JOIN driver d ON b.driver_id_fk = d.driver_id
    LEFT JOIN vehicle v ON v.driver_id_fk = d.driver_id

    WHERE b.customer_id_fk = ?
    AND b.status = 2

    ORDER BY b.booking_id DESC
  `;

  connection.query(sql, [customerId], (err, result) => {
    if (err) {
      console.log("Customer subscriptions error:", err);
      return res.json({
        success: false,
        message: "فشل جلب الاشتراكات"
      });
    }

    res.json({
      success: true,
      subscriptions: result
    });
  });
});


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

      trips.push([
        booking.booking_id,
        booking.customer_id_fk,
        booking.dependent_id_fk || null,
        booking.driver_id_fk,
        formattedDate,
        booking.start_time,
        "go",
        JSON.stringify(booking.pickup),
        JSON.stringify(booking.dropoff),
        "scheduled"
      ]);

      if (booking.trip_type === "round-trip" && booking.end_time) {
        trips.push([
          booking.booking_id,
          booking.customer_id_fk,
          booking.dependent_id_fk || null,
          booking.driver_id_fk,
          formattedDate,
          booking.end_time,
          "return",
          JSON.stringify(booking.dropoff),
          JSON.stringify(booking.pickup),
          "scheduled"
        ]);
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

      v.vehicle_type,
      v.vehicle_mode,
      v.vehicle_year_of_manufacturel,
      v.color

    FROM daily_trips dt
    JOIN driver d ON dt.driver_id_fk = d.driver_id
    LEFT JOIN vehicle v ON v.driver_id_fk = d.driver_id

    WHERE dt.customer_id_fk = ?
    AND dt.trip_date = CURDATE()
  AND (
  dt.status IN ('scheduled','driver_arrived')
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
    AND dt.status IN ('scheduled','driver_on_way','driver_arrived')

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

function driverParseJson(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

async function loadDriverTodayTrips() {
  const container = document.getElementById("driverTodayTripsList");
  if (!container) return;

  const driverId = localStorage.getItem("driverId");

  if (!driverId) {
    container.innerHTML = `<p class="empty-requests">يجب تسجيل الدخول كسائق</p>`;
    return;
  }

  const res = await fetch(`/driver/today-trips/${driverId}`);
  const data = await res.json();

  if (!data.success) {
    container.innerHTML = `<p class="empty-requests">فشل تحميل الرحلات</p>`;
    return;
  }

  if (data.trips.length === 0) {
    container.innerHTML = `<p class="empty-requests">لا توجد رحلات اليوم</p>`;
    return;
  }

  container.innerHTML = "";

  data.trips.forEach((trip) => {
    const pickup = driverParseJson(trip.pickup);
    const dropoff = driverParseJson(trip.dropoff);

    const customerName = `${trip.fast_name_caustomer || ""} ${trip.last_name_caustomer || ""}`.trim();

    const card = document.createElement("div");
    card.className = "subscription-item-card";

    card.innerHTML = `
      <div class="sub-header-main" onclick="toggleSubscriptionCard(this)">
        <div class="sub-title-info">
          <i class="bi bi-person-circle"></i>
          <span>الراكب: ${customerName}</span>
        </div>
        <i class="bi bi-chevron-left arrow-indicator"></i>
      </div>

      <div class="sub-content-collapsible">
        <div class="subscription-details-box">
          <p><strong>وقت الرحلة:</strong> ${trip.trip_time}</p>
          <p><strong>نوع الرحلة:</strong> ${trip.trip_direction === "return" ? "عودة" : "ذهاب"}</p>
          <p><strong>حالة الرحلة:</strong> ${trip.status}</p>
          <p><strong>الهاتف:</strong> ${trip.phone_caustomer || "--"}</p>
          <p><strong>من:</strong> ${pickup?.name || "--"}</p>
          <p><strong>إلى:</strong> ${dropoff?.name || "--"}</p>
        </div>

        <div id="driverTodayMap-${trip.daily_trip_id}" class="driver-mini-map"></div>

        <div class="driver-request-actions">
          <button class="map-btn" onclick='drawDriverToCustomerMap(${trip.daily_trip_id}, ${JSON.stringify(pickup)})'>
            عرض الطريق للراكب
          </button>

          <button class="accept-btn" onclick="markDriverArrived(${trip.daily_trip_id})">
            أنا وصلت
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function drawDriverToCustomerMap(tripId, pickup) {
  if (!pickup) {
    alert("موقع الراكب غير متوفر");
    return;
  }

  if (!navigator.geolocation) {
    alert("المتصفح لا يدعم تحديد الموقع");
    return;
  }

  navigator.geolocation.getCurrentPosition((pos) => {
    const driverLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };

    const mapEl = document.getElementById(`driverTodayMap-${tripId}`);
    mapEl.style.display = "block";

    const map = new google.maps.Map(mapEl, {
      center: driverLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map });

    directionsService.route(
      {
        origin: driverLocation,
        destination: {
          lat: Number(pickup.lat),
          lng: Number(pickup.lng)
        },
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status !== "OK") {
          alert("تعذر عرض الطريق");
          return;
        }

        directionsRenderer.setDirections(result);
      }
    );
  });
}
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

app.get("/admin/dashboard-section/:section", (req, res) => {
  const section = req.params.section;

  let sql = "";

  if (section === "users") {
    sql = `
      SELECT
        caustomer_id AS id,
        CONCAT(fast_name_caustomer, ' ', last_name_caustomer) AS name,
        phone_caustomer AS phone,
        DATE_FORMAT(date_of_birth_caustomer, '%Y-%m-%d') AS dob
      FROM customer
      ORDER BY caustomer_id DESC
    `;
  }

  if (section === "pendingSubs") {
    sql = `
      SELECT
        b.booking_id AS id,
        CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS user,
        b.trip_type AS type,
        'معلق' AS status
      FROM booking b
      JOIN customer c ON b.customer_id_fk = c.caustomer_id
      WHERE b.status = 1
      ORDER BY b.booking_id DESC
    `;
  }

  if (section === "activeSubs") {
    sql = `
      SELECT
        b.booking_id AS id,
        CONCAT(c.fast_name_caustomer, ' ', c.last_name_caustomer) AS user,
        b.trip_type AS type,
        'فعال' AS status
      FROM booking b
      JOIN customer c ON b.customer_id_fk = c.caustomer_id
      WHERE b.status = 2
      ORDER BY b.booking_id DESC
    `;
  }

  if (section === "drivers") {
    sql = `
      SELECT
        driver_id AS id,
        CONCAT(fast_name_driver, ' ', last_name_driver) AS name,
        phone_driver AS phone,
        address
      FROM driver
      WHERE status = 'accepted'
      ORDER BY driver_id DESC
    `;
  }

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