[
  "core/api",
  "core/storage",
  "core/dom",
  "shared/maps",
  "pages/login",
  "pages/signup",
  "pages/forgot-password",
  "pages/profile",
  "pages/notifications",
  "pages/booking",
  "pages/seats",
  "pages/driver-profile",
  "pages/driver-requests",
  "pages/driver-daily-trips"
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
    جدول الرحلات + فتح/إغلاق الاشتراك
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