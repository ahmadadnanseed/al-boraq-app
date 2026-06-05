let allBookingRequests = [];
let isDriverOnline = false;

// دالة حساب عمر العميل بناءً على تاريخ الميلاد
function calculateAgeFromDate(dob) {
  if (!dob) return "غير محدد";
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}


// دالة جلب معلومات الهوية والتقييم والسيارة للسائق ديناميكياً من قاعدة البيانات
async function loadDriverProfileHeader() {
  const driverId = localStorage.getItem("driverId");
  if (!driverId) {
    console.log("No driverId found in localStorage");
    return;
  }

  try {
    // إرسال طلب للسيرفر لجلب بيانات السائق الحالي
    const res = await fetch(`/driver/profile/${driverId}`);
    const data = await res.json();

    if (data.success && data.driver) {
      // 1. جلب الاسم الفعلي بالاعتماد على الأعمدة الموثقة fast_name_driver و last_name_driver
      const firstName = data.driver.fast_name_driver || "";
      const lastName = data.driver.last_name_driver || "";
      document.getElementById("driverNameLabel").innerText = `الكابتن: ${firstName} ${lastName}`.trim();
      
      // 2. جلب التقييم الفعلي المخزن بالداتابيز (إذا كان فارغاً نضع 5.0 كافتراضي)
      document.getElementById("driverRatingLabel").innerText = data.driver.rating || "5.0";
      
      // 3. جلب المركبة الفعلية بربط بيانات السكيما الحقيقية المحدثة من الداتابيز
      if (data.driver.vehicle_type) {
        const type = data.driver.vehicle_type || "";
        const mode = data.driver.vehicle_mode || "";
        // تم استخدام vehicle_year_of_manufacturel لتطابق اسم العمود بملف الـ SQL بدقة وبدون أخطاء
        const year = data.driver.vehicle_year_of_manufacturel || "";
        
        document.getElementById("driverVehicleLabel").innerText = `${type} ${mode} ${year}`.trim();
      } else {
        document.getElementById("driverVehicleLabel").innerText = "لم يتم تحديد مركبة بعد";
      }
    }
  } catch (err) {
    console.log("Error loading real driver data from DB:", err);
  }
}

// دالة جلب جميع طلبات الاشتراكات المتاحة من السيرفر
async function loadDriverBookingRequests() {
  const list = document.getElementById("driverRequestsList");
  if (!list) return;

  // استدعاء جلب معلومات الهوية الفصيحة من الداتابيز لتحديث البار العلوي
  loadDriverProfileHeader();

  try {
    const res = await fetch("/driver/booking-requests");
    const data = await res.json();

    if (!data.success) {
      list.innerHTML = `<p class="empty-requests">فشل تحميل الطلبات</p>`;
      return;
    }

    allBookingRequests = data.requests;
    renderRequestsTree(allBookingRequests);

  } catch (err) {
    console.log("Load driver requests error:", err);
    list.innerHTML = `<p class="empty-requests">خطأ في الاتصال بالسيرفر</p>`;
  }
}

// دالة البناء الأصلية بالكامل مع زر عرض المسار والـ mini-map دون أي تعديل هندسي بطلبك
function renderRequestsTree(requestsList) {
  const list = document.getElementById("driverRequestsList");
  if (!list) return;

  if (requestsList.length === 0) {
    list.innerHTML = `<p class="empty-requests">لا توجد طلبات حالياً</p>`;
    return;
  }

  list.innerHTML = "";

  requestsList.forEach((req) => {
    // دعم فحص الـ JSON الآمن المتوافق مع نسختك الأصلية
    const pickup = typeof req.pickup === 'string' ? JSON.parse(req.pickup || '{}') : req.pickup;
    const dropoff = typeof req.dropoff === 'string' ? JSON.parse(req.dropoff || '{}') : req.dropoff;
    const seats = typeof req.selected_seats === 'string' ? JSON.parse(req.selected_seats || '[]') : (req.selected_seats || []);

    const customerName = `${req.fast_name_caustomer || ""} ${req.last_name_caustomer || ""}`.trim();
    const customerAge = calculateAgeFromDate(req.date_of_birth_caustomer);

    const hasDependent = !!req.dependent_id;
    const dependentName = hasDependent
      ? `${req.fast_name_dependent || ""} ${req.last_name_dependent || ""}`.trim()
      : null;

    const card = document.createElement("div");
    card.className = "driver-request-card";

    // الهيكل الأصلي مية بالمية المشتمل على الـ mini-map وزر عرض المسار
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
}

// دالة تطبيق الفلترة الذكية المتقدمة محلياً بناءً على الحقول الأربعة المطلوبة
function applyDynamicFilters() {
  const selectedType = document.getElementById("filterTripType").value;
  const minPrice = parseFloat(document.getElementById("filterPrice").value);
  const searchTime = document.getElementById("filterTime").value;
  const targetSeat = document.getElementById("filterSeat").value;

  const filteredResult = allBookingRequests.filter((req) => {
    // 1. الفرز بناء على نوع الرحلة
    if (selectedType !== "all" && req.trip_type !== selectedType) return false;

    // 2. الفرز بناء على السعر الشهري
    const reqPrice = parseFloat(req.price || 0);
    if (reqPrice < minPrice) return false;

    // 3. الفرز بناء على رقم المقعد المختار (اختياري)
    if (targetSeat !== "all") {
      const seatsArray = typeof req.selected_seats === 'string' ? JSON.parse(req.selected_seats || '[]') : (req.selected_seats || []);
      if (!seatsArray.map(String).includes(String(targetSeat))) return false;
    }

    // 4. الفرز بناء على وقت الرحلة التقريبي (بفارق سماحية ساعتين قبل وبعد)
    if (searchTime && req.start_time) {
      const filterHour = parseInt(searchTime.split(":")[0]);
      const reqHour = parseInt(req.start_time.split(":")[0]);
      if (Math.abs(reqHour - filterHour) > 2) return false;
    }

    return true;
  });

  renderRequestsTree(filteredResult);
}

// دالة فتح وإغلاق كرت تفاصيل الرحلة المتاحة
function toggleDriverRequest(header) {
  const card = header.closest(".driver-request-card");
  card.classList.toggle("active");
}

// دالة إرسال قبول الاشتراك إلى الباك آند وتحديث حالة الطلب بقاعدة البيانات
async function acceptBookingRequest(bookingId) {
  const driverId = localStorage.getItem("driverId") || "1";

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

// دالة فحص وتفعيل الصفحة عند تحميل حاوية الطلبات
function initDriverRequestsPage() {
  if (document.getElementById("driverRequestsList")) {
    loadDriverBookingRequests();
  }
}

// تأكيد الارتباط بوثيقة الـ DOM للمتصفح
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initDriverRequestsPage);
} else {
  initDriverRequestsPage();
}

// تصدير جميع الدوال للنطاق العالمي (Global Scope) لتفادي أي مشاكل ارتباط بملف الـ HTML
window.applyDynamicFilters = applyDynamicFilters;
window.toggleDriverRequest = toggleDriverRequest;
window.acceptBookingRequest = acceptBookingRequest;
window.initDriverRequestsPage = initDriverRequestsPage;