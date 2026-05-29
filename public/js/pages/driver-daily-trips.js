async function loadDriverTodayTrips() {
  const container = document.getElementById("driverTodayTripsList");
  if (!container) return;

  const driverId = localStorage.getItem("driverId");

  if (!driverId) {
    container.innerHTML = `<p class="empty-requests">لا يوجد سائق مسجل</p>`;
    return;
  }

  try {
    const res = await fetch(`/driver/today-trips/${driverId}`);
    const data = await res.json();

    if (!data.success || data.trips.length === 0) {
      container.innerHTML = `<p class="empty-requests">لا توجد رحلات اليوم</p>`;
      return;
    }

    container.innerHTML = `
      <div class="trip-summary">
        إجمالي رحلات اليوم: ${data.trips.length} رحلات
      </div>
    `;

    data.trips.forEach((trip) => {
      const pickup = driverParseJson(trip.pickup);
      const dropoff = driverParseJson(trip.dropoff);

      const customerName = `${trip.fast_name_caustomer || ""} ${trip.last_name_caustomer || ""}`.trim();
      const phone = trip.phone_caustomer || "";

      const actionText =
        trip.status === "driver_arrived"
          ? "وصلت"
          : trip.status === "passenger_picked"
          ? "تم ركوب الراكب"
          : trip.status === "completed"
          ? "تم التوصيل"
          : trip.status === "driver_started"
          ? "قادم"
          : "مجدولة";

      const card = document.createElement("div");
      card.className = "subscription-item-card driver-daily-card";

      card.innerHTML = `
        <div class="sub-header-main" onclick="toggleSubscriptionCard(this)">
          <div class="sub-title-info">
            <i class="bi bi-person-circle icon-sub"></i>
            <span>الراكب: ${customerName}</span>
          </div>
          <i class="bi bi-chevron-left arrow-indicator"></i>
        </div>

        <div class="sub-content-collapsible">
          <div class="driver-trip-table">
            <div class="table-head">
              <span>اليوم</span>
              <span>وقت الانطلاق</span>
              <span>الموقع</span>
              <span>الحالة</span>
            </div>

            <div class="table-row">
              <span>اليوم</span>
              <span>${trip.trip_time}</span>
              <span>
                <a href="https://www.google.com/maps/dir/?api=1&origin=${pickup?.lat},${pickup?.lng}&destination=${dropoff?.lat},${dropoff?.lng}" target="_blank">
                  <i class="bi bi-geo-alt"></i> الخريطة
                </a>
              </span>
              <span class="trip-status-text">${actionText}</span>
            </div>
          </div>

          <div class="driver-info-card">
            <div class="driver-details">
              <img src="img/my-user.png" alt="صورة الراكب" class="driver-img">

              <div class="driver-text">
                <h4>${customerName}</h4>
                <p><i class="bi bi-telephone"></i> ${phone}</p>
                <p><i class="bi bi-clock"></i> وقت الرحلة: ${trip.trip_time}</p>
              </div>
            </div>

            <div class="driver-contact-actions">
              <a class="driver-action-btn" href="https://wa.me/${phone.replace("+", "")}" target="_blank">
                <i class="bi bi-whatsapp"></i> مراسلة
              </a>

              <a class="driver-action-btn" href="tel:${phone}">
                <i class="bi bi-telephone-fill"></i> اتصال
              </a>
            </div>

            <div id="driverTodayMap-${trip.daily_trip_id}" class="driver-mini-map"></div>

            <div class="driver-contact-actions" style="margin-top:10px;">
              <button class="map-btn" onclick='drawDriverToCustomerMap(${trip.daily_trip_id}, ${JSON.stringify(pickup)})'>
                عرض الطريق للراكب
              </button>

              ${
                trip.status === "scheduled"
                  ? `
                    <button class="accept-btn" onclick="markDriverStarted(${trip.daily_trip_id}, event)">
                      بدء الرحلة
                    </button>
                  `
                  : trip.status === "driver_started"
                  ? `
                    <button class="accept-btn" onclick="markDriverArrived(${trip.daily_trip_id}, event)">
                      أنا وصلت
                    </button>
                  `
                  : trip.status === "driver_arrived"
                  ? `
                    <button class="accept-btn" onclick="markPassengerPicked(${trip.daily_trip_id}, event)">
                      هل أقلت الراكب؟
                    </button>
                  `
                  : trip.status === "passenger_picked"
                  ? `
                    <button class="accept-btn" onclick="markTripCompleted(${trip.daily_trip_id}, event)">
                      تم إنزال الراكب
                    </button>
                  `
                  : `
                    <button class="accept-btn" disabled style="background:#777; cursor:not-allowed;">
                      تم التوصيل
                    </button>
                  `
              }
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.log("Driver trips error:", err);
    container.innerHTML = `<p class="empty-requests">خطأ في تحميل الرحلات</p>`;
  }
}

function updateTripStatus(button, text) {
  const card = button.closest(".driver-daily-card");
  const statusText = card?.querySelector(".trip-status-text");

  if (statusText) {
    statusText.textContent = text;
  }
}

async function markDriverStarted(tripId, event) {
  const button = event.target;

  const res = await fetch(`/driver/daily-trips/${tripId}/start`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل بدء الرحلة");
    return;
  }

  updateTripStatus(button, "قادم");

  button.textContent = "أنا وصلت";
  button.setAttribute("onclick", `markDriverArrived(${tripId}, event)`);
}

async function markDriverArrived(tripId, event) {
  const button = event.target;

  const res = await fetch(`/driver/daily-trips/${tripId}/arrived`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إرسال الإشعار");
    return;
  }

  alert("تم إشعار الراكب بأنك وصلت");

  updateTripStatus(button, "وصلت");

  button.textContent = "هل أقلت الراكب؟";
  button.setAttribute("onclick", `markPassengerPicked(${tripId}, event)`);
}

async function markPassengerPicked(tripId, event) {
  const button = event.target;

  const res = await fetch(`/driver/daily-trips/${tripId}/picked`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل تأكيد ركوب الراكب");
    return;
  }

  updateTripStatus(button, "تم ركوب الراكب");

  button.textContent = "تم إنزال الراكب";
  button.setAttribute("onclick", `markTripCompleted(${tripId}, event)`);
}

async function markTripCompleted(tripId, event) {
  const button = event.target;

  const res = await fetch(`/driver/daily-trips/${tripId}/completed`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إنهاء الرحلة");
    return;
  }

  alert("تم إنهاء الرحلة بنجاح");

  updateTripStatus(button, "تم التوصيل");

  button.textContent = "تم التوصيل";
  button.disabled = true;
  button.style.background = "#777";
  button.style.cursor = "not-allowed";
}

function driverParseJson(value) {
  try {
    let parsed = value;

    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    return parsed;
  } catch (e) {
    console.log("driverParseJson error:", e, value);
    return null;
  }
}

function initDriverDailyTripsPage() {
  if (document.getElementById("driverTodayTripsList")) {
    loadDriverTodayTrips();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initDriverDailyTripsPage);
} else {
  initDriverDailyTripsPage();
}

window.loadDriverTodayTrips = loadDriverTodayTrips;
window.markDriverArrived = markDriverArrived;
window.driverParseJson = driverParseJson;
window.markTripCompleted = markTripCompleted;
window.markDriverStarted = markDriverStarted;
window.markPassengerPicked = markPassengerPicked;
window.initDriverDailyTripsPage = initDriverDailyTripsPage;