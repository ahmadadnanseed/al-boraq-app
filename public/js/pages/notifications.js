let selectedTripToPostpone = null;

async function loadTodayTripNotifications() {
  const container = document.getElementById("todayTripsNotifications");
  if (!container) return;

  const customerId = localStorage.getItem("userId");

  if (!customerId) {
    container.innerHTML = `<p class="empty-requests">يجب تسجيل الدخول أولاً</p>`;
    return;
  }

  try {
    const res = await fetch(`/customer/today-trips/${customerId}`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p class="empty-requests">فشل تحميل الإشعارات</p>`;
      return;
    }

    if (data.trips.length === 0) {
      container.innerHTML = `
        <div class="notification-card">
          <div class="notification-icon">
            <i class="bi bi-calendar-check"></i>
          </div>
          <div class="notification-text">
            <h3>لا توجد رحلات اليوم</h3>
            <p>لا يوجد لديك رحلات مجدولة لهذا اليوم.</p>
            <span class="notification-time">من براق</span>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    data.trips.forEach((trip) => {
      const pickup = safeJsonParse(trip.pickup);
      const dropoff = safeJsonParse(trip.dropoff);

      const directionText = trip.trip_direction === "return" ? "رحلة العودة" : "رحلة الذهاب";
      const driverName = `${trip.fast_name_driver || ""} ${trip.last_name_driver || ""}`.trim();
const dependentName = `${trip.fast_name_dependent || ""} ${trip.last_name_dependent || ""}`.trim();
const relation = trip.relationship || "";
const isDependentTrip = !!dependentName;

const passengerText = isDependentTrip
  ? `${relation} ${dependentName}`
  : "أنت";
      const card = document.createElement("div");
      card.className = "notification-card today";

      card.innerHTML = `
        <div class="notification-icon">
          <i class="bi bi-bell-fill"></i>
        </div>

        <div class="notification-text">
          <h3>${directionText} اليوم</h3>

       

          ${trip.status === "driver_arrived" ? `
  <div class="arrival-alert">
    🚕 السائق وصل وهو بانتظارك الآن
  </div>
` : ""}
${trip.status === "scheduled" ? `
  <p>
    لديك رحلة اليوم الساعة <strong>${trip.trip_time}</strong>.
    ${isDependentTrip 
      ? `يرجى أن يكون ${passengerText} جاهزاً قبل الموعد بـ <strong>10 دقائق</strong>.`
      : `يرجى أن تكون جاهزاً قبل الموعد بـ <strong>10 دقائق</strong>.`
    }
  </p>
` : ""}
${trip.status === "driver_started" ? `
  <div class="arrival-alert">
    🚗 السائق تحرك باتجاه ${isDependentTrip ? passengerText : "موقعك"}
  </div>

  <div class="driver-contact-actions">
    <a class="driver-action-btn" href="https://wa.me/${String(trip.phone_driver).replace("+", "")}" target="_blank">
      <i class="bi bi-whatsapp"></i> مراسلة السائق
    </a>

    <a class="driver-action-btn" href="tel:${trip.phone_driver}">
      <i class="bi bi-telephone-fill"></i> اتصال
    </a>
  </div>
` : ""}
${trip.status === "driver_arrived" ? `
  <div class="arrival-alert">
    🚕 السائق وصل وهو بانتظار ${isDependentTrip ? passengerText : "ك الآن"}
  </div>
` : ""}
${trip.status === "passenger_picked" ? `
  <div class="arrival-alert">
    ✅ تم ركوب ${isDependentTrip ? passengerText : "الراكب"}، الرحلة بدأت الآن
  </div>
` : ""}

${trip.status === "completed" ? `
  <div class="arrival-alert">
    ✅ ${isDependentTrip ? `لقد وصل ${passengerText} إلى وجهته` : "وصلت إلى وجهتك بنجاح"}
  </div>

  <div class="rating-box">
    <p>هل ترغب بتقييم السائق؟</p>

    <select id="rating-${trip.daily_trip_id}">
      <option value="5">⭐⭐⭐⭐⭐ ممتاز</option>
      <option value="4">⭐⭐⭐⭐ جيد جداً</option>
      <option value="3">⭐⭐⭐ جيد</option>
      <option value="2">⭐⭐ مقبول</option>
      <option value="1">⭐ سيئ</option>
    </select>

    <textarea id="comment-${trip.daily_trip_id}" placeholder="ملاحظتك اختياري"></textarea>

    <button class="postpone-btn" onclick="submitTripRating(${trip.daily_trip_id})">
      إرسال التقييم
    </button>
  </div>
` : ""}
${trip.status === "scheduled" ? `
  <button class="postpone-btn" onclick="openPostponeModal(${trip.daily_trip_id})">
    تأجيل الرحلة
  </button>
` : ""}
          <p><strong>السائق:</strong> ${driverName || "--"}</p>
          <p><strong>الهاتف:</strong> ${trip.phone_driver || "--"}</p>
          <p><strong>المركبة:</strong> ${trip.vehicle_type || ""} ${trip.vehicle_mode || ""} ${trip.vehicle_year_of_manufacturel || ""}</p>
         

          <span class="notification-time">اليوم</span>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.log("Notifications error:", err);
    container.innerHTML = `<p class="empty-requests">خطأ في الاتصال بالسيرفر</p>`;
  }
}

function loadNotifications() {
  return loadTodayTripNotifications();
}

function openPostponeModal(tripId) {
  selectedTripToPostpone = tripId;
  document.getElementById("postponeModal").style.display = "flex";
}

function closePostponeModal() {
  selectedTripToPostpone = null;
  document.getElementById("postponeModal").style.display = "none";
}

async function confirmPostponeTrip() {
  const postponedTo = document.getElementById("postponeDate").value;

  if (!selectedTripToPostpone || !postponedTo) {
    alert("اختر تاريخ التأجيل");
    return;
  }

  const res = await fetch(`/daily-trips/${selectedTripToPostpone}/postpone`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      postponed_to: postponedTo
    })

  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل تأجيل الرحلة");
    return;
  }

  alert("تم تأجيل الرحلة بنجاح");
  closePostponeModal();
  loadTodayTripNotifications();
}

function initNotificationsPage() {
  loadTodayTripNotifications();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initNotificationsPage);
} else {
  initNotificationsPage();
}

window.loadNotifications = loadNotifications;
window.loadTodayTripNotifications = loadTodayTripNotifications;
window.openPostponeModal = openPostponeModal;
window.closePostponeModal = closePostponeModal;
window.confirmPostponeTrip = confirmPostponeTrip;
