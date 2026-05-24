async function loadCustomerSubscriptions() {
  const container = document.getElementById("subscriptionsList");
  if (!container) return;

  const customerId = localStorage.getItem("userId");

  if (!customerId) {
    container.innerHTML = `<p class="empty-requests">يجب تسجيل الدخول أولاً</p>`;
    return;
  }

  try {
    const res = await fetch(`/customer/subscriptions/${customerId}`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p class="empty-requests">فشل تحميل الاشتراكات</p>`;
      return;
    }

    if (data.subscriptions.length === 0) {
      container.innerHTML = `<p class="empty-requests">لا توجد اشتراكات حالياً</p>`;
      return;
    }

    container.innerHTML = "";

    data.subscriptions.forEach((sub) => {
      const pickup = safeJsonParse(sub.pickup);
      const dropoff = safeJsonParse(sub.dropoff);
      const seats = safeJsonParse(sub.selected_seats) || [];

      const driverName = `${sub.fast_name_driver || ""} ${sub.last_name_driver || ""}`.trim();
      const driverAge = getAge(sub.date_of_birth_driver);

      const card = document.createElement("div");
      card.className = "subscription-item-card";

      card.innerHTML = `
        <div class="sub-header-main" onclick="toggleSubscriptionCard(this)">
          <div class="sub-title-info">
            <i class="bi bi-calendar-check icon-sub"></i>
            <span>${sub.trip_type === "round-trip" ? "اشتراك ذهاب وإياب" : "اشتراك ذهاب"}</span>
          </div>
          <i class="bi bi-chevron-left arrow-indicator"></i>
        </div>

        <div class="sub-content-collapsible">
          <div class="subscription-details-box">
            <p><strong>تاريخ البدء:</strong> ${sub.start_date_booking}</p>
            <p><strong>وقت الذهاب:</strong> ${sub.start_time}</p>
            <p><strong>وقت العودة:</strong> ${sub.end_time || "--"}</p>
            <p><strong>عدد المقاعد:</strong> ${sub.seats_count || 1}</p>
            <p><strong>المقاعد:</strong> ${sub.is_full_car ? "سيارة كاملة" : (seats.length ? seats.join("، ") : "--")}</p>
            <p><strong>السعر الشهري:</strong> ${sub.price || "--"} JOD</p>
            <p><strong>المسافة:</strong> ${sub.distance_km || "--"} كم</p>
            <p><strong>مدة الرحلة:</strong> ${sub.duration_min || "--"} دقيقة</p>
          </div>

          <div id="customerMap-${sub.booking_id}" class="driver-mini-map"></div>

<button class="map-btn" onclick='drawCustomerRoute(${sub.booking_id}, ${JSON.stringify(pickup)}, ${JSON.stringify(dropoff)})'>
  عرض المسار على الخريطة
</button>

          <div class="driver-info-card">
            <h3>معلومات السائق</h3>
            <div class="driver-details">
              <img src="img/my-user.png" alt="صورة السائق" class="driver-img">
              <div class="driver-text">
                <h4>${driverName || "غير محدد"}</h4>
                <p><i class="bi bi-telephone"></i> ${sub.phone_driver || "--"}</p>
                <p><i class="bi bi-car-front"></i> ${sub.vehicle_type || ""} ${sub.vehicle_mode || ""} ${sub.vehicle_year_of_manufacturel || ""}</p>
                <p><i class="bi bi-palette"></i> اللون: ${sub.color || "--"}</p>
                <p><i class="bi bi-person-badge"></i> العمر: ${driverAge} سنة</p>
              </div>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.log("Subscriptions error:", err);
    container.innerHTML = `<p class="empty-requests">خطأ في الاتصال بالسيرفر</p>`;
  }
}

function toggleSubscriptionCard(header) {
  const card = header.closest(".subscription-item-card");
  card.classList.toggle("active");
}

async function submitTripRating(tripId) {
  const rating = document.getElementById(`rating-${tripId}`).value;
  const comment = document.getElementById(`comment-${tripId}`).value;

  const res = await fetch(`/customer/daily-trips/${tripId}/rate`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ rating, comment })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إرسال التقييم");
    return;
  }

  alert("شكراً لتقييمك");
  loadTodayTripNotifications();
}

function initSubscriptionsPage() {
  loadCustomerSubscriptions();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initSubscriptionsPage);
} else {
  initSubscriptionsPage();
}

window.loadCustomerSubscriptions = loadCustomerSubscriptions;
window.toggleSubscriptionCard = toggleSubscriptionCard;
window.submitTripRating = submitTripRating;
window.initSubscriptionsPage = initSubscriptionsPage;
