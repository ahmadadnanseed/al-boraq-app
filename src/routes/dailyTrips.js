const express = require("express");
const connection = require("../db");

const router = express.Router();

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

router.get("/customer/today-trips/:customerId", (req, res) => {
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

router.put("/daily-trips/:tripId/postpone", (req, res) => {
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

router.put("/customer/daily-trips/:tripId/rate", (req, res) => {
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

module.exports = router;
module.exports.createDailyTripsFromBooking = createDailyTripsFromBooking;
