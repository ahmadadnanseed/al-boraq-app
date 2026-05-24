[
  "core/api",
  "core/storage",
  "core/dom",
  "pages/login",
  "pages/signup",
  "pages/forgot-password",
  "pages/profile",
  "pages/notifications",
  "pages/booking",
  "pages/seats"
].forEach((name) => {
  const script = document.createElement("script");
  script.async = false;
  script.src = `js/${name}.js`;
  document.head.appendChild(script);
});
/* =========================================================
   📱 القائمة الجانبية (Menu)
========================================================= */
function openNav() {
    document.getElementById("sideMenu").style.width = "300px";
    document.getElementById("overlay").style.display = "block";
}

function closeNav() {
    document.getElementById("sideMenu").style.width = "0";
    document.getElementById("overlay").style.display = "none";
}
async function loadSidebarUserData() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const nameEl = document.getElementById("sidebarUserName");
  const phoneEl = document.getElementById("sidebarUserPhone");

  if (!nameEl || !phoneEl) return;

  try {
    const res = await fetch(`/user/${userId}`);
    const data = await res.json();

    if (!data.success) return;

    const user = data.user;
    const fullName = `${user.fast_name_caustomer || ""} ${user.last_name_caustomer || ""}`.trim();
    const phone = user.phone_caustomer || "";

    nameEl.innerText = fullName;
    phoneEl.innerText = phone;
  } catch (error) {
    console.log("Sidebar load error:", error);
  }
}
window.addEventListener("DOMContentLoaded", () => {
  loadSidebarUserData();
});

/* =========================================================
   📅 تحميل الصفحة (عام)
========================================================= */
document.addEventListener('DOMContentLoaded', function() {

    // قائمة المدن
    const cityBtn = document.getElementById('citySelect');
    if (cityBtn) {
        cityBtn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            this.classList.toggle('open');
        });
    }

});

/* =========================================================
   👥 الحجز - التحكم بالكميات
========================================================= */
function updateQty(id, change) {
    const display = document.getElementById(id);
    let val = parseInt(display.innerText);
    if (val + change >= 0) {
        display.innerText = val + change;
    }
}

/* =========================================================
   🗺️ فتح الخرائط
========================================================= */
function openMaps() {
    window.open("https://www.google.com/maps", "_blank");
}

function getRealRouteInfo(pickup, dropoff) {
  return new Promise((resolve, reject) => {
    console.log("PICKUP:", pickup);
    console.log("DROPOFF:", dropoff);

    const service = new google.maps.DirectionsService();

    service.route(
      {
        origin: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
        destination: { lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        console.log("Directions status:", status);

        if (status !== "OK") {
          alert("خطأ: " + status);
          reject(status);
          return;
        }

        const leg = result.routes[0].legs[0];

        resolve({
          distanceKm: leg.distance.value / 1000,
          durationMin: Math.ceil(leg.duration.value / 60)
        });
      }
    );
  });
}

/* =========================================================
   🚍 جدول الرحلات + فتح/إغلاق الاشتراك
========================================================= */
function loadSchedule(header) {
    const card = header.parentElement;
    const content = card.querySelector('.sub-content-collapsible');
    const tableBody = document.getElementById('scheduleBody');

    // 1. فتح وإغلاق القائمة
    card.classList.toggle('active');

    // 2. إذا كان الجدول فيه بيانات لا تعيد التوليد
    if (tableBody.innerHTML.trim() !== "") return;

    // 3. توليد 30 رحلة
    let today = new Date();
    let html = "";

    for (let i = 0; i < 30; i++) {
        let d = new Date();
        d.setDate(today.getDate() + i);

        html += `
        <tr>
            <td>${d.toLocaleDateString('ar-EG')}</td>
            <td>08:00 ص</td>
            <td><span style="color: green;">مجدولة</span></td>
            <td>
                <button class="edit-btn" onclick="openEditModal('${d.toISOString().split('T')[0]}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>`;
    }

    tableBody.innerHTML = html;
}

/* =========================================================
   ✏️ تعديل الرحلات (Modal)
========================================================= */
function openEditModal(date = "") {
    const modal = document.getElementById('editModal');
    const overlay = document.getElementById('overlay');

    if (modal) modal.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';

    if (date) {
        document.getElementById('newDate').value = date;
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function saveEdit() {
    alert("تم التعديل بنجاح");
    closeEditModal();
}

/* =========================================================
    OTP Auto Focus
========================================================= */
document.querySelectorAll('.otp-field, .otp-digit').forEach((input, index, inputs) => {
    input.addEventListener('input', () => {
        if (input.value.length >= 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });
});



/* =========================================================
   🔄 تنقل
========================================================= */
function drivergoToProfile() {
    window.location.href = "driver-profile.html";
}

/* =========================================================
   📊 الأدمن Tabs
========================================================= */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(p => p.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

/* =========================================================
   🌆 اختيار المدينة
========================================================= */
function selectCity(city) {
  const el = document.getElementById("driverAddress");

  if (el) {
    el.textContent = city; // أفضل من innerText
  }
}
/* =========================================================
   🚗 تحميل بيانات السائق من customer
========================================================= */
async function loadDriverSignupData() {
 const userId = localStorage.getItem("userId");
if (!userId) {
  return;
}

  const fullNameEl = document.getElementById("driverFullName");
  const phoneEl = document.getElementById("driverPhone");
  const dobEl = document.getElementById("driverDOB");
  const addressEl = document.getElementById("driverAddress");

  if (!fullNameEl || !phoneEl || !dobEl || !addressEl) return;

  try {
    const res = await fetch(`/user/${userId}`);
    const data = await res.json();

    if (!data.success) {
      alert("تعذر جلب بيانات المستخدم");
      return;
    }

    const user = data.user;
    const fullName = `${user.fast_name_caustomer || ""} ${user.last_name_caustomer || ""}`.trim();

    fullNameEl.value = fullName;
    phoneEl.value = user.phone_caustomer || "";
    dobEl.value = user.date_of_birth_caustomer ? String(user.date_of_birth_caustomer).split("T")[0] : "";
    addressEl.value = user.address || "";
  } catch (error) {
    console.log("loadDriverSignupData error:", error);
    alert("خطأ في تحميل بيانات السائق");
  }
}

/* =========================================================
   🚗 إرسال بيانات السائق والمركبة
========================================================= */
async function submitDriver() {
  console.log("submitDriver clicked");

  const userId = localStorage.getItem("userId");
  console.log("userId:", userId);

  const address = document.getElementById("driverAddress")?.innerText.trim();
  const vehicleType = document.getElementById("vehicleType")?.value.trim();
  const vehicleModel = document.getElementById("vehicleModel")?.value.trim();
  const vehicleYear = document.getElementById("vehicleYear")?.value.trim();
  const plateNumber = document.getElementById("plateNumber")?.value.trim();
  const color = document.getElementById("vehicleColor")?.value.trim();

  console.log({ address, vehicleType, vehicleModel, vehicleYear, plateNumber, color });

  if (!userId) {
    alert("يجب تسجيل الدخول كمستخدم أولاً حتى تسجل كسائق");
    return;
  }

  if (!address || !vehicleType || !vehicleModel || !vehicleYear || !plateNumber || !color) {
    alert("يرجى تعبئة جميع الحقول المطلوبة");
    return;
  }

  const res = await fetch("/driver/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId,
      address,
      vehicleType,
      vehicleModel,
      vehicleYear,
      plateNumber,
      color
    })
  });

  const data = await res.json();
  console.log("driver signup response:", data);

  if (!data.success) {
    alert(data.message || "فشل الإرسال");
    return;
  }

  document.getElementById("driver-info-box").style.display = "none";
  document.getElementById("step2-form").style.display = "none";
  document.getElementById("step3-form").style.display = "block";
}

/* =========================================================
   🚗 تشغيل تحميل البيانات عند فتح الصفحة
========================================================= */
window.addEventListener("DOMContentLoaded", () => {
  loadDriverSignupData();
});
/* =========================================================
   🚗 قبول الرحلة (driver-requests.html)
========================================================= */
function safeJsonParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

function yearsSinceBirth(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

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

function drawDirectionsOnMap(mapEl, pickup, dropoff) {
  if (!pickup || !dropoff) {
    alert("بيانات الموقع غير مكتملة");
    return;
  }

  mapEl.style.display = "block";

  const map = new google.maps.Map(mapEl, {
    center: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map
  });

  directionsService.route(
    {
      origin: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
      destination: { lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
      travelMode: google.maps.TravelMode.DRIVING
    },
    (result, status) => {
      if (status !== "OK") {
        alert("تعذر عرض المسار");
        return;
      }

      directionsRenderer.setDirections(result);
    }
  );
}

function drawDriverRoute(bookingId, pickup, dropoff) {
  const mapEl = document.getElementById(`driverMap-${bookingId}`);
  drawDirectionsOnMap(mapEl, pickup, dropoff);
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

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const driverLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      const mapEl = document.getElementById(`driverTodayMap-${tripId}`);
      if (!mapEl) {
        alert("تعذر تحضير الخريطة");
        return;
      }

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
    },
    (error) => {
      console.log(error);
      alert("لم يتم السماح بالوصول إلى الموقع");
    }
  );
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

window.addEventListener("DOMContentLoaded", () => {
  loadDriverBookingRequests();
});
/* =========================================================
   👨‍✈️ تعديل بيانات السائق
========================================================= */
/* =========================================================
   👨‍✈️ توليد جدول رحلات الساىق 
========================================================= */

function driver_loadSchedule(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');

    // توليد الرحلات إذا أول مرة
    const tableBody = document.getElementById('scheduleBody');
    if (tableBody && tableBody.innerHTML === "") {
        for (let i = 1; i <= 30; i++) {
            let row = `
                <tr>
                    <td>2026-04-${i < 10 ? '0'+i : i}</td>
                    <td>08:00 ص</td>
                    <td><span style="color: green;">مجدولة</span></td>
                    <td><button onclick="openEditModal()">تعديل</button></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    }
}


/* =========================================
  اخفاء كبست تسجيل الدخول عندما يكون المستخدم مسجل من قبل 
========================================= */
function checkLoginButtons() {
  const userId = localStorage.getItem("userId");

  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");

  if (userId) {
    // المستخدم مسجل → اخفيهم
    if (signupBtn) signupBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "none";
  } else {
    // المستخدم مش مسجل → خليهم ظاهرين
    if (signupBtn) signupBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "inline-block";
  }
}

window.addEventListener("DOMContentLoaded", checkLoginButtons);

let driverCurrentField = "";
let currentDriverId = null;

async function loadDriverProfile() {
  const driverId = localStorage.getItem("driverId");

  if (!driverId) {
    console.log("No driverId in localStorage");
    return;
  }

  const isDriverProfilePage = document.getElementById("driverTopName");
  if (!isDriverProfilePage) return;

  try {
    const res = await fetch(`/driver/profile-by-id/${driverId}`);
    const data = await res.json();

    console.log("DRIVER PROFILE DATA:", data);

    if (!data.success) {
      alert(data.message || "تعذر تحميل بيانات السائق");
      return;
    }

    const driver = data.driver;
    currentDriverId = driver.driver_id;

    const fullName = `${driver.fast_name_driver || ""} ${driver.last_name_driver || ""}`.trim();

    document.getElementById("driverTopName").innerText = fullName;
    document.getElementById("driverTopPhone").innerText = driver.phone_driver || "";
    document.getElementById("driverAvatarLetter").innerText = fullName.charAt(0);

    document.getElementById("driver-val-name").innerText = fullName;
    document.getElementById("driver-val-phone").innerText = driver.phone_driver || "";
    document.getElementById("driver-val-address").innerText = driver.address || "";

    document.getElementById("driver-val-vehicleType").innerText = driver.vehicle_type || "";
    document.getElementById("driver-val-vehicleModel").innerText = driver.vehicle_mode || "";
    document.getElementById("driver-val-vehicleYear").innerText = driver.vehicle_year_of_manufacturel || "";
    document.getElementById("driver-val-plate").innerText = driver.vehicle_license_blate_number || "";
    document.getElementById("driver-val-color").innerText = driver.color || "";

    

  } catch (err) {
    console.log("loadDriverProfile error:", err);
    alert("خطأ في تحميل ملف السائق");
  }
}

async function loadDriverSidebarData() {
  const driverId = localStorage.getItem("driverId");

  const nameEl = document.getElementById("sidebarDriverName");
  const phoneEl = document.getElementById("sidebarDriverPhone");
  const avatarEl = document.getElementById("sidebarAvatar");

  if (!driverId || !nameEl || !phoneEl || !avatarEl) return;

  const res = await fetch(`/driver/profile-by-id/${driverId}`);
  const data = await res.json();

  if (!data.success) return;

  const driver = data.driver;
  const fullName = `${driver.fast_name_driver || ""} ${driver.last_name_driver || ""}`.trim();

  nameEl.innerText = fullName;
  phoneEl.innerText = driver.phone_driver || "";
  avatarEl.innerText = fullName ? fullName.charAt(0) : "ك";

}
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("driverTopName")) {
    loadDriverProfile();
  }

  if (document.getElementById("sidebarDriverName")) {
    loadDriverSidebarData();
  }
});



function driver_openEdit(field, title) {
  driverCurrentField = field;

  document.getElementById("driverModalTitle").innerText = "تعديل " + title;

  let currentValue = "";

  if (field === "name") currentValue = document.getElementById("driver-val-name").innerText;
  if (field === "phone") currentValue = document.getElementById("driver-val-phone").innerText;
  if (field === "address") currentValue = document.getElementById("driver-val-address").innerText;
  if (field === "vehicleType") currentValue = document.getElementById("driver-val-vehicleType").innerText;
  if (field === "vehicleModel") currentValue = document.getElementById("driver-val-vehicleModel").innerText;
  if (field === "vehicleYear") currentValue = document.getElementById("driver-val-vehicleYear").innerText;
  if (field === "plate") currentValue = document.getElementById("driver-val-plate").innerText;
  if (field === "color") currentValue = document.getElementById("driver-val-color").innerText;

  let inputType = "text";
  if (field === "vehicleYear") inputType = "number";

  document.getElementById("driverInputBox").innerHTML = `
    <input type="${inputType}" id="driverNewInput" value="${currentValue}" style="width:100%; padding:10px;">
  `;

  document.getElementById("driverEditModal").style.display = "flex";
}

function driver_closeEdit() {
  document.getElementById("driverEditModal").style.display = "none";
}

async function driver_saveChange() {
  const newValue = document.getElementById("driverNewInput").value.trim();

  if (!newValue) {
    alert("يرجى إدخال قيمة صحيحة");
    return;
  }

  const bodyData = {
    name: document.getElementById("driver-val-name").innerText,
    phone: document.getElementById("driver-val-phone").innerText,
    address: document.getElementById("driver-val-address").innerText,
    vehicleType: document.getElementById("driver-val-vehicleType").innerText,
    vehicleModel: document.getElementById("driver-val-vehicleModel").innerText,
    vehicleYear: document.getElementById("driver-val-vehicleYear").innerText,
    plate: document.getElementById("driver-val-plate").innerText,
    color: document.getElementById("driver-val-color").innerText
  };

  if (driverCurrentField === "name") bodyData.name = newValue;
  if (driverCurrentField === "phone") bodyData.phone = newValue;
  if (driverCurrentField === "address") bodyData.address = newValue;
  if (driverCurrentField === "vehicleType") bodyData.vehicleType = newValue;
  if (driverCurrentField === "vehicleModel") bodyData.vehicleModel = newValue;
  if (driverCurrentField === "vehicleYear") bodyData.vehicleYear = newValue;
  if (driverCurrentField === "plate") bodyData.plate = newValue;
  if (driverCurrentField === "color") bodyData.color = newValue;

  try {
    const res = await fetch(`/driver/profile/${currentDriverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "فشل التعديل");
      return;
    }

    if (driverCurrentField === "name") {
      document.getElementById("driver-val-name").innerText = newValue;
      document.getElementById("driverTopName").innerText = newValue;
      document.getElementById("driverAvatarLetter").innerText = newValue.charAt(0);
    }

    if (driverCurrentField === "phone") {
      document.getElementById("driver-val-phone").innerText = newValue;
      document.getElementById("driverTopPhone").innerText = newValue;
    }

    if (driverCurrentField === "address") {
      document.getElementById("driver-val-address").innerText = newValue;
    }

    if (driverCurrentField === "vehicleType") {
      document.getElementById("driver-val-vehicleType").innerText = newValue;
    }

    if (driverCurrentField === "vehicleModel") {
      document.getElementById("driver-val-vehicleModel").innerText = newValue;
    }

    if (driverCurrentField === "vehicleYear") {
      document.getElementById("driver-val-vehicleYear").innerText = newValue;
    }

    if (driverCurrentField === "plate") {
      document.getElementById("driver-val-plate").innerText = newValue;
    }

    if (driverCurrentField === "color") {
      document.getElementById("driver-val-color").innerText = newValue;
    }

    alert("تم التعديل بنجاح");
    driver_closeEdit();

  } catch (err) {
    console.log("driver_saveChange error:", err);
    alert("خطأ في الاتصال بالسيرفر");
  }
}

let currentSection = "users";
let adminChart = null;
let currentRows = [];

const sectionTitles = {
  users: "المستخدمون",
  pendingSubs: "الاشتراكات المعلقة",
  activeSubs: "الاشتراكات الفعالة",
  drivers: "السائقين"
};

const tableHeaders = {
  users: ["ID", "الاسم", "الهاتف", "تاريخ الميلاد"],
  pendingSubs: ["ID", "اسم المستخدم", "نوع الاشتراك", "الحالة"],
  activeSubs: ["ID", "اسم المستخدم", "نوع الاشتراك", "الحالة"],
  drivers: ["ID", "الاسم", "الهاتف", "العنوان"]
};

async function loadAdminDashboard() {
  const res = await fetch("/admin/dashboard-data");
  const data = await res.json();

  if (!data.success) {
    alert("فشل تحميل بيانات لوحة التحكم");
    return;
  }

  document.getElementById("usersCount").innerText = data.counts.usersCount;
  document.getElementById("pendingSubsCount").innerText = data.counts.pendingSubsCount;
  document.getElementById("activeSubsCount").innerText = data.counts.activeSubsCount;
  document.getElementById("driversCount").innerText = data.counts.driversCount;

  await loadAdminSection("users");
}

async function loadAdminSection(sectionKey) {
  currentSection = sectionKey;

  const res = await fetch(`/admin/dashboard-section/${sectionKey}`);
  const data = await res.json();

  if (!data.success) {
    alert("فشل تحميل القسم");
    return;
  }

  currentRows = data.rows;

  renderAdminChart(sectionKey, currentRows.length);
  renderAdminTable(sectionKey, currentRows);
  resetSearchBox();
}

function selectDashboardSection(sectionKey, evt) {
  document.querySelectorAll(".overview-card").forEach(card => {
    card.classList.remove("active-card");
  });

  evt.currentTarget.classList.add("active-card");
  loadAdminSection(sectionKey);
}

function renderAdminChart(sectionKey, count) {
  document.getElementById("chartTitle").innerText =
    `رسم بياني - ${sectionTitles[sectionKey]}`;

  const ctx = document.getElementById("adminChart").getContext("2d");

  if (adminChart) adminChart.destroy();

  adminChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [sectionTitles[sectionKey]],
      datasets: [{
        label: sectionTitles[sectionKey],
        data: [count],
        backgroundColor: "#14b8ff",
        maxBarThickness: 80
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#fff" } }
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: {
          ticks: { color: "#fff", stepSize: 1 },
          beginAtZero: true,
          suggestedMax: Math.max(count + 2, 5)
        }
      }
    }
  });
}

function renderAdminTable(sectionKey, rows) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  const headRow = document.createElement("tr");

  tableHeaders[sectionKey].forEach(header => {
    const th = document.createElement("th");
    th.innerText = header;
    headRow.appendChild(th);
  });

  tableHead.appendChild(headRow);

  rows.forEach(row => {
    const tr = document.createElement("tr");

    Object.values(row).forEach(value => {
      const td = document.createElement("td");
      td.innerText = value ?? "--";
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

function searchById() {
  const input = document.getElementById("searchInput").value.trim();
  const resultBox = document.getElementById("searchResultBox");

  const found = currentRows.find(item => String(item.id) === input);

  if (!found) {
    resultBox.innerHTML = "لا يوجد نتيجة لهذا الـ ID";
    return;
  }

  let html = `<h4 style="color:#14b8ff;">تم العثور على النتيجة</h4>`;

  Object.entries(found).forEach(([key, value]) => {
    html += `<p><strong>${key}:</strong> ${value ?? "--"}</p>`;
  });

  resultBox.innerHTML = html;
}

function resetSearchBox() {
  document.getElementById("searchInput").value = "";
  document.getElementById("searchResultBox").innerHTML = "اكتب الـ ID ثم اضغط بحث";
}

window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("usersCount")) {
    loadAdminDashboard();
  }
});
async function openDriverRequestsModal() {
  document.getElementById("driverRequestsModal").style.display = "flex";

  const res = await fetch("/admin/driver-requests");
  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل تحميل الطلبات");
    return;
  }

  driverRequests = data.drivers.map(d => {
    return {
      id: d.driver_id,
      name: `${d.fast_name_driver || ""} ${d.last_name_driver || ""}`.trim(),
      age: calculateAge(d.date_of_birth_driver),
      phone: d.phone_driver
    };
  });

  renderDriverRequests(driverRequests);
}
function calculateAge(dob) {
  const age = yearsSinceBirth(dob);
  return age === null ? "" : age;
}

async function acceptDriver(id) {
  const res = await fetch(`/admin/driver-requests/${id}/accept`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل قبول السائق");
    return;
  }

  alert(
    "تم قبول السائق\n\n" +
    "رقم الدخول: " + data.loginCode + "\n" +
    "كلمة المرور: " + data.password
  );

  driverRequests = driverRequests.filter(driver => driver.id !== id);
  renderDriverRequests(driverRequests);
}

async function rejectDriver(id) {
  const ok = confirm("هل أنت متأكد من رفض وحذف هذا الطلب؟");
  if (!ok) return;

  const res = await fetch(`/admin/driver-requests/${id}/reject`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل حذف الطلب");
    return;
  }

  driverRequests = driverRequests.filter(driver => driver.id !== id);
  renderDriverRequests(driverRequests);
}
function closeDriverRequestsModal() {
  document.getElementById("driverRequestsModal").style.display = "none";
}


function renderDriverRequests(data) {
  const tbody = document.getElementById("driverRequestsTableBody");
  tbody.innerHTML = "";

  data.forEach(driver => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${driver.id}</td>
      <td>${driver.name}</td>
      <td>${driver.age}</td>
      <td>${driver.phone}</td>
      <td>
        <a class="whatsapp-btn" target="_blank"href="https://wa.me/${formatPhone(driver.phone)}">
          واتساب
        </a>
      </td>
      <td>
        <button class="accept-btn" onclick="acceptDriver(${driver.id})">قبول</button>
        <button class="reject-btn" onclick="rejectDriver(${driver.id})">رفض وحذف</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}
function formatPhone(phone) {
  if (!phone) return "";

  phone = String(phone).trim();
  phone = phone.replace(/\s+/g, "");
  phone = phone.replace("+", "");

  if (phone.startsWith("00")) {
    phone = phone.substring(2);
  }

  if (phone.startsWith("0")) {
    phone = "962" + phone.substring(1);
  }

  return phone;
}

function filterDriverRequests() {
  const keyword = document.getElementById("driverSearchInput").value.trim().toLowerCase();

  const filtered = driverRequests.filter(driver =>
    String(driver.id).includes(keyword) ||
    driver.name.toLowerCase().includes(keyword)
  );

  renderDriverRequests(filtered);
}


let pickupLocation = null;
let dropoffLocation = null;

// 🔹 تشغيل Google Autocomplete الجديد
async function initMapInputs() {
  const pickupBox = document.getElementById("pickupInput");
  const dropoffBox = document.getElementById("dropoffInput");

  if (!pickupBox || !dropoffBox || !google?.maps?.places) return;

  pickupBox.innerHTML = "";
  dropoffBox.innerHTML = "";

  const pickupAuto = new google.maps.places.PlaceAutocompleteElement();
  const dropoffAuto = new google.maps.places.PlaceAutocompleteElement();

  pickupAuto.setAttribute("placeholder", "حدد موقع الانطلاق...");
dropoffAuto.setAttribute("placeholder", "حدد وجهة الوصول...");


     pickupAuto.setAttribute("locationBias", "circle:100000@31.95,35.93");
    dropoffAuto.setAttribute("locationBias", "circle:100000@31.95,35.93");

  pickupAuto.setAttribute("lang", "ar");
  dropoffAuto.setAttribute("lang", "ar");

  pickupBox.appendChild(pickupAuto);
  dropoffBox.appendChild(dropoffAuto);

  // 📍 عند اختيار نقطة الانطلاق
  pickupAuto.addEventListener("gmp-select", async (event) => {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"]
    });

    pickupLocation = {
      name: place.formattedAddress || place.displayName,
      lat: place.location.lat(),
      lng: place.location.lng()
    };

    localStorage.setItem("pickupLocation", JSON.stringify(pickupLocation));
  });

  // 📍 عند اختيار الوجهة
  dropoffAuto.addEventListener("gmp-select", async (event) => {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"]
    });

    dropoffLocation = {
      name: place.formattedAddress || place.displayName,
      lat: place.location.lat(),
      lng: place.location.lng()
    };

    localStorage.setItem("dropoffLocation", JSON.stringify(dropoffLocation));
  });
}

// 🔹 زر "موقعي الحالي"
function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("المتصفح لا يدعم تحديد الموقع");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      pickupLocation = {
        name: "موقعي الحالي",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      localStorage.setItem("pickupLocation", JSON.stringify(pickupLocation));

      // تحديث الواجهة
      const pickupBox = document.getElementById("pickupInput");
      if (pickupBox) {
        pickupBox.innerHTML = `
          <div style="color:white;font-weight:bold;padding:12px;">
            <i class="bi bi-geo-alt-fill"></i> تم تحديد موقعي الحالي
          </div>
        `;
      }

      alert("تم تحديد موقعك الحالي بنجاح");
    },
    (error) => {
      console.log(error);
      alert("لم يتم السماح بالوصول إلى الموقع");
    }
  );
}

let mapPicker = null;
let mapMarker = null;
let selectedMapType = null;
let selectedMapLocation = null;
let mapSearchAutocomplete = null;

function openMapPicker(type) {
  selectedMapType = type;

  document.getElementById("mapPickerModal").style.display = "flex";
  document.getElementById("mapPickerTitle").innerText =
    type === "pickup" ? "حدد موقع الانطلاق" : "حدد وجهة الوصول";

  setTimeout(() => {
    initPickerMap();
  }, 300);
}

function initPickerMap() {
  const defaultLocation = { lat: 31.9539, lng: 35.9106 }; // عمان

  if (!mapPicker) {
    mapPicker = new google.maps.Map(document.getElementById("pickerMap"), {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapMarker = new google.maps.Marker({
      position: defaultLocation,
      map: mapPicker,
      draggable: true
    });

    selectedMapLocation = {
      name: "موقع محدد من الخريطة",
      lat: defaultLocation.lat,
      lng: defaultLocation.lng
    };

    mapPicker.addListener("click", (event) => {
      setMarkerLocation(event.latLng);
    });

    mapMarker.addListener("dragend", (event) => {
      setMarkerLocation(event.latLng);
    });

    const searchInput = document.getElementById("mapSearchInput");

    mapSearchAutocomplete = new google.maps.places.Autocomplete(searchInput, {
      componentRestrictions: { country: "jo" },
      fields: ["formatted_address", "geometry", "name"]
    });

    mapSearchAutocomplete.addListener("place_changed", () => {
      const place = mapSearchAutocomplete.getPlace();

      if (!place.geometry) {
        alert("اختر موقع من الاقتراحات");
        return;
      }

      mapPicker.setCenter(place.geometry.location);
      mapPicker.setZoom(16);
      setMarkerLocation(place.geometry.location, place.formatted_address || place.name);
    });
  }

  google.maps.event.trigger(mapPicker, "resize");
}

function setMarkerLocation(latLng, placeName = null) {
  mapMarker.setPosition(latLng);

  selectedMapLocation = {
    name: placeName || "موقع محدد من الخريطة",
    lat: latLng.lat(),
    lng: latLng.lng()
  };

  reverseGeocode(latLng);
}

function reverseGeocode(latLng) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === "OK" && results[0]) {
      selectedMapLocation.name = results[0].formatted_address;
    }
  });
}

function confirmMapLocation() {
  if (!selectedMapLocation) {
    alert("حدد موقع من الخريطة");
    return;
  }

  if (selectedMapType === "pickup") {
    pickupLocation = selectedMapLocation;
    localStorage.setItem("pickupLocation", JSON.stringify(pickupLocation));

    const pickupBox = document.getElementById("pickupInput");
    pickupBox.innerHTML = `
      <div style="color:white;font-weight:bold;padding:12px;">
        <i class="bi bi-geo-alt-fill"></i> ${pickupLocation.name}
      </div>
    `;
  }

  if (selectedMapType === "dropoff") {
    dropoffLocation = selectedMapLocation;
    localStorage.setItem("dropoffLocation", JSON.stringify(dropoffLocation));

    const dropoffBox = document.getElementById("dropoffInput");
    dropoffBox.innerHTML = `
      <div style="color:white;font-weight:bold;padding:12px;">
        <i class="bi bi-flag-fill"></i> ${dropoffLocation.name}
      </div>
    `;
  }

  closeMapPicker();
}

function closeMapPicker() {
  document.getElementById("mapPickerModal").style.display = "none";
}

function getAge(dob) {
  const age = yearsSinceBirth(dob);
  return age === null ? "--" : age;
}

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

window.addEventListener("DOMContentLoaded", () => {
  loadCustomerSubscriptions();
});

function drawCustomerRoute(bookingId, pickup, dropoff) {
  const mapEl = document.getElementById(`customerMap-${bookingId}`);
  drawDirectionsOnMap(mapEl, pickup, dropoff);
}

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
          : trip.status === "completed"
          ? "تم التوصيل"
          : "قادم";

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
              <span>${actionText}</span>
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
      <button class="accept-btn" onclick="markDriverStarted(${trip.daily_trip_id})">
        بدء الرحلة
      </button>
    `
    : trip.status === "driver_started"
    ? `
      <button class="accept-btn" onclick="markDriverArrived(${trip.daily_trip_id})">
        أنا وصلت
      </button>
    `
    : trip.status === "driver_arrived"
    ? `
      <button class="accept-btn" onclick="markPassengerPicked(${trip.daily_trip_id})">
        هل أقلت الراكب؟
      </button>
    `
    : trip.status === "passenger_picked"
    ? `
      <button class="accept-btn" onclick="markTripCompleted(${trip.daily_trip_id})">
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
async function markDriverArrived(tripId) {
  const res = await fetch(`/driver/daily-trips/${tripId}/arrived`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إرسال الإشعار");
    return;
  }

  alert("تم إشعار الراكب بأنك وصلت");
  loadDriverTodayTrips();
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

window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("driverTodayTripsList")) {
    loadDriverTodayTrips();
  }
});

async function markTripCompleted(tripId) {
  const res = await fetch(`/driver/daily-trips/${tripId}/completed`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إنهاء الرحلة");
    return;
  }

  alert("تم إنهاء الرحلة بنجاح");
  loadDriverTodayTrips();
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

async function markDriverStarted(tripId) {
  const res = await fetch(`/driver/daily-trips/${tripId}/start`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل بدء الرحلة");
    return;
  }

  loadDriverTodayTrips();
}
async function markPassengerPicked(tripId) {
  const res = await fetch(`/driver/daily-trips/${tripId}/picked`, {
    method: "PUT"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل تأكيد ركوب الراكب");
    return;
  }

  loadDriverTodayTrips();
}

document.querySelectorAll(".otp-field").forEach((input,index,inputs)=>{

    input.addEventListener("input",()=>{

        input.value=input.value.replace(/\D/g,'');

        if(input.value && index<inputs.length-1){
            inputs[index+1].focus();
        }

    });

    input.addEventListener("keydown",(e)=>{

        if(
            e.key==="Backspace" &&
            !input.value &&
            index>0
        ){
            inputs[index-1].focus();
        }

    });

});