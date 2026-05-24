function calculateAgeFromDate(dob) {
  const age = yearsSinceBirth(dob);
  return age === null ? "غير محدد" : age;
}

async function loadDriverBookingRequests() {
  const list = document.getElementById("driverRequestsList");
  if (!list) return;

  try {
    const res = await fetch("/driver/booking-requests");
    const data = await res.json();

    if (!data.success) {
      list.innerHTML = `<p class="empty-requests">فشل تحميل الطلبات</p>`;
      return;
    }

    if (data.requests.length === 0) {
      list.innerHTML = `<p class="empty-requests">لا توجد طلبات حالياً</p>`;
      return;
    }

    list.innerHTML = "";

    data.requests.forEach((req) => {
      const pickup = safeJsonParse(req.pickup);
      const dropoff = safeJsonParse(req.dropoff);
      const seats = safeJsonParse(req.selected_seats) || [];

      const customerName = `${req.fast_name_caustomer || ""} ${req.last_name_caustomer || ""}`.trim();
      const customerAge = calculateAgeFromDate(req.date_of_birth_caustomer);

      const hasDependent = !!req.dependent_id;
      const dependentName = hasDependent
        ? `${req.fast_name_dependent || ""} ${req.last_name_dependent || ""}`.trim()
        : null;

      const card = document.createElement("div");
      card.className = "driver-request-card";

      card.innerHTML = `
        <div class="driver-request-summary" onclick="toggleDriverRequest(this)">
          <div>
            <span class="trip-type-tag">اشتراك جديد</span>
            <h3>${customerName}</h3>
            <p>${req.trip_type === "round-trip" ? "ذهاب وإياب" : "ذهاب فقط"} - ${req.price || "--"} JOD</p>
          </div>
          <i class="bi bi-chevron-down request-arrow"></i>
        </div>

        <div class="driver-request-details">
          <div class="driver-request-grid">
            <p><strong>اسم العميل:</strong> ${customerName}</p>
            <p><strong>عمر العميل:</strong> ${customerAge}</p>
            <p><strong>هاتف العميل:</strong> ${req.phone_caustomer || "--"}</p>

            ${
              hasDependent
                ? `
                  <p><strong>الحجز للتابع:</strong> ${dependentName}</p>
                  <p><strong>صلة القرابة:</strong> ${req.relationship || "--"}</p>
                  <p><strong>هاتف التابع:</strong> ${req.dependent_phone || "غير موجود"}</p>
                `
                : `<p><strong>نوع الحجز:</strong> للعميل نفسه</p>`
            }

            <p><strong>تاريخ البدء:</strong> ${req.start_date_booking}</p>
            <p><strong>وقت الذهاب:</strong> ${req.start_time}</p>
            <p><strong>وقت العودة:</strong> ${req.end_time || "--"}</p>
            <p><strong>عدد المقاعد:</strong> ${req.seats_count || 1}</p>
            <p><strong>المقاعد:</strong> ${req.is_full_car ? "سيارة كاملة" : (seats.length ? seats.join("، ") : "--")}</p>
            <p><strong>المسافة:</strong> ${req.distance_km || "--"} كم</p>
            <p><strong>مدة الرحلة:</strong> ${req.duration_min || "--"} دقيقة</p>
            <p><strong>السعر الشهري:</strong> ${req.price || "--"} JOD</p>
          </div>

          <div class="trip-locations">
            <div class="loc-item">
              <i class="bi bi-geo-alt-fill text-primary"></i>
              <div>
                <label>نقطة الانطلاق</label>
                <p>${pickup?.name || "--"}</p>
              </div>
            </div>

            <div class="loc-divider"></div>

            <div class="loc-item">
              <i class="bi bi-flag-fill text-success"></i>
              <div>
                <label>وجهة الوصول</label>
                <p>${dropoff?.name || "--"}</p>
              </div>
            </div>
          </div>

          <div id="driverMap-${req.booking_id}" class="driver-mini-map"></div>

          <div class="driver-request-actions">
            <button class="map-btn" onclick='drawDriverRoute(${req.booking_id}, ${JSON.stringify(pickup)}, ${JSON.stringify(dropoff)})'>
              عرض المسار
            </button>

            <button class="accept-btn" onclick="acceptBookingRequest(${req.booking_id})">
              قبول الاشتراك
            </button>
          </div>
        </div>
      `;

      list.appendChild(card);
    });

  } catch (err) {
    console.log("Load driver requests error:", err);
    list.innerHTML = `<p class="empty-requests">خطأ في الاتصال بالسيرفر</p>`;
  }
}

function toggleDriverRequest(header) {
  const card = header.closest(".driver-request-card");
  card.classList.toggle("active");
}

async function acceptBookingRequest(bookingId) {
  const driverId = localStorage.getItem("driverId");

  if (!driverId) {
    alert("يجب تسجيل الدخول كسائق");
    return;
  }

  const res = await fetch(`/driver/booking-requests/${bookingId}/accept`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ driverId })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل قبول الطلب");
    return;
  }

  alert("تم قبول الاشتراك بنجاح");
  loadDriverBookingRequests();
}

function initDriverRequestsPage() {
  if (document.getElementById("driverRequestsList")) {
    loadDriverBookingRequests();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initDriverRequestsPage);
} else {
  initDriverRequestsPage();
}

window.calculateAgeFromDate = calculateAgeFromDate;
window.loadDriverBookingRequests = loadDriverBookingRequests;
window.toggleDriverRequest = toggleDriverRequest;
window.acceptBookingRequest = acceptBookingRequest;
window.initDriverRequestsPage = initDriverRequestsPage;
