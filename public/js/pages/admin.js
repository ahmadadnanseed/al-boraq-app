// ملف: js/pages/admin.js

let currentSection = "users";
let adminChart = null;
let currentRows = [];
let driverRequests = [];

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

// 🔒 دالة مساعدة لجلب هيدر الأمان بالتوكن المشفر تلقائياً
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

// 🔒 دالة للتحقق من الاستجابة وطرد المتطفلين أو من انتهت جلستهم
function handleAuthResponse(status) {
  if (status === 401 || status === 403) {
    alert("جلسة غير صالحة أو غير مصرح لك بدخول هذا القسم!");
    localStorage.clear();
    window.location.href = "login.html";
    return true;
  }
  return false;
}

// الدالة الأساسية لتغذية بطاقات العدادات العلوية وتشغيل الصفحة بنجاح وطرد الأصفار
async function loadAdminDashboard() {
  const res = await fetch("/admin/dashboard-data", {
    headers: getAuthHeaders()
  });

  if (handleAuthResponse(res.status)) return;

  const data = await res.json();

  if (!data.success) {
    alert("فشل تحميل بيانات لوحة التحكم");
    return;
  }

  const source = data.counts ? data.counts : data;

  document.getElementById("usersCount").innerText = source.usersCount ?? 0;
  document.getElementById("pendingSubsCount").innerText = source.pendingSubsCount ?? 0;
  document.getElementById("activeSubsCount").innerText = source.activeSubsCount ?? 0;
  document.getElementById("driversCount").innerText = source.driversCount ?? 0;

  // تحميل القسم الأول وجلب الرسم البياني والجدول الخاص به فوراً
  await loadAdminSection("users");
}

function selectDashboardSection(sectionKey, evt) {
  document.querySelectorAll(".overview-card").forEach(card => {
    card.classList.remove("active-card");
  });

  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add("active-card");
  }
  loadAdminSection(sectionKey);
}

// دالة تحميل القسم لتقوم بتحديث الجدول السفلي وتحديث الرسم البياني بالأرباح والتحليلات
async function loadAdminSection(sectionKey) {
  currentSection = sectionKey;

  // 1. جلب بيانات الجدول السفلي المعتادة
  const res = await fetch(`/admin/dashboard-section/${sectionKey}`, {
    headers: getAuthHeaders()
  });
  if (handleAuthResponse(res.status)) return;
  const data = await res.json();
  if (!data.success) return;

  currentRows = data.rows;
  renderAdminTable(sectionKey, currentRows);
  resetSearchBox();

  // 2. 🚀 السحر التفاعلي الحقيقي: جلب التقارير المالية والتقييمات وتحديث الـ Chart
  updateDynamicChart(sectionKey);
}

// دالة تحديث وبناء الرسم البياني التفاعلي ديناميكياً بالألوان المخصصة لبراق
async function updateDynamicChart(sectionKey) {
  const chartElement = document.getElementById("myAdminChart") || document.getElementById("adminChart") || document.querySelector("canvas");
  if (!chartElement) return;

  try {
    const res = await fetch(`/admin/chart-analytics/${sectionKey}`, {
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (!result.success) return;

    // تحديث عنوان كرت الرسم البياني بالـ HTML ليتناسب مع القسم المالي المختار
    const chartTitleElement = document.getElementById("chartTitle");
    if (chartTitleElement) chartTitleElement.innerText = result.title;

    // تدمير الرسم البياني السابق لمنع تداخل الأعمدة والظلال الثابتة عند التحويل
    if (adminChart) {
      adminChart.destroy();
    }

    const ctx = chartElement.getContext("2d");
    const colors = ["#2E75B6", "#ED7D31", "#70AD47", "#FFC000", "#14b8ff"];

    adminChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: result.labels,
        datasets: [{
          label: result.datasetLabel,
          data: result.values,
          backgroundColor: colors.slice(0, result.values.length),
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#ffffff", font: { family: "Arial", size: 13 } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#ffffff" } },
          x: { grid: { display: false }, ticks: { color: "#ffffff", font: { weight: "bold" } } }
        }
      }
    });

  } catch (err) {
    console.log("Error updating dynamic chart visuals:", err);
  }
}

// دالة الإقلاع الافتراضية
async function initAdminChart() {
  updateDynamicChart("users");
}

function renderAdminTable(sectionKey, rows) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  if (!tableHead || !tableBody) return;

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

async function handleAdminSearch() {
  const searchInput = document.getElementById("searchInput");
  const resultBox = document.getElementById("searchResultBox");

  if (!searchInput || !resultBox) return;

  const searchId = searchInput.value.trim();
  if (!searchId) {
    alert("الرجاء إدخال الـ ID أولاً للبحث الموجه");
    return;
  }

  // تحديد اسم القسم ليعرفه الأدمن باللغة العربية أثناء البحث
  let currentSectionName = sectionTitles[currentSection] || "القسم الحالي";
  resultBox.innerHTML = `جاري البحث في قسم [${currentSectionName}]...`;

  try {
    // نمرر currentSection مع الـ searchId في مسار الـ API
    const res = await fetch(`/admin/advanced-search/${currentSection}/${searchId}`, {
      headers: getAuthHeaders()
    });

    if (handleAuthResponse(res.status)) return;

    const result = await res.json();

    if (result.success) {
      let entityLabel = result.type === "customer" ? "راكب / مستخدم" : result.type === "driver" ? "سائق / كابتن" : "اشتراك رحلة";
      
      // 🚀 جلب التوكن الحالي المخزن في المتصفح لتمريره بالرابط علناً بالطريقة القديمة
      const token = localStorage.getItem("token");

      resultBox.innerHTML = `
        <h4 style="color: #17b497; margin-top: 10px;">تم العثور على النتيجة ✅</h4>
        <div style="margin-top: 8px; font-size: 14px; line-height: 1.6;">
          <p><strong>نوع الكيان:</strong> ${entityLabel}</p>
          <p><strong>المعرف ID:</strong> ${result.data.id}</p>
          <p><strong>الاسم:</strong> ${result.data.name || result.data.customerName || 'موقع خريطة مجدول'}</p>
        </div>
        
        <button type="button" onclick="window.location.href='/admin-view.html?id=${result.data.id}&type=${result.type}&token=${token}'"
                style="margin-top: 15px; width: 100%; padding: 10px; background: #f27a2b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.3s; box-shadow: 0 4px 12px rgba(242, 122, 43, 0.3);">
          📊 عرض الملف الشخصي والإحصائيات
        </button>
      `;
    } else {
      // سيعرض رسالة تفيد بعدم وجود هذا الـ ID في هذا القسم تحديداً
      resultBox.innerHTML = `<span style="color: #e63946;">❌ ${result.message}</span>`;
    }
  } catch (err) {
    console.error("Advanced search error:", err);
    resultBox.innerHTML = `<span style="color: #e63946;">خطأ أثناء الاتصال بالسيرفر.</span>`;
  }
}
function resetSearchBox() {
  const searchInput = document.getElementById("searchInput");
  const searchResultBox = document.getElementById("searchResultBox");
  if (searchInput) searchInput.value = "";
  if (searchResultBox) searchResultBox.innerHTML = "اكتب الـ ID ثم اضغط بحث";
}

async function openDriverRequestsModal() {
  const modal = document.getElementById("driverRequestsModal");
  if (modal) modal.style.display = "flex";

  const res = await fetch("/admin/driver-requests", {
    headers: getAuthHeaders()
  });

  if (handleAuthResponse(res.status)) return;

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

function yearsSinceBirth(dobString) {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function acceptDriver(id) {
  const res = await fetch(`/admin/driver-requests/${id}/accept`, {
    method: "PUT",
    headers: getAuthHeaders()
  });

  if (handleAuthResponse(res.status)) return;

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
    method: "PUT",
    headers: getAuthHeaders()
  });

  if (handleAuthResponse(res.status)) return;

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل حذف الطلب");
    return;
  }

  driverRequests = driverRequests.filter(driver => driver.id !== id);
  renderDriverRequests(driverRequests);
}

function closeDriverRequestsModal() {
  const modal = document.getElementById("driverRequestsModal");
  if (modal) modal.style.display = "none";
}

function renderDriverRequests(data) {
  const tbody = document.getElementById("driverRequestsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  data.forEach(driver => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${driver.id}</td>
      <td>${driver.name}</td>
      <td>${driver.age}</td>
      <td>${driver.phone}</td>
      <td>
        <a class="whatsapp-btn" target="_blank" href="https://wa.me/${formatPhone(driver.phone)}">
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

function verifyAdminClientAccess() {
  if (!window.location.pathname.includes("admin.html")) {
    return true; 
  }
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  if (!token || userType !== "admin") {
    alert("غير مصرح لك بدخول لوحة التحكم، يرجى تسجيل الدخول أولاً.");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function formatPhone(phone) {
  if (!phone) return "";
  phone = String(phone).trim().replace(/\s+/g, "").replace("+", "");
  if (phone.startsWith("00")) phone = phone.substring(2);
  if (phone.startsWith("0")) phone = "962" + phone.substring(1);
  return phone;
}

function filterDriverRequests() {
  const keyword = document.getElementById("driverSearchInput").value.trim().toLowerCase();
  const filtered = driverRequests.filter(driver =>
    String(driver.id).includes(keyword) || driver.name.toLowerCase().includes(keyword)
  );
  renderDriverRequests(filtered);
}

function initAdminPage() {
  if (!verifyAdminClientAccess()) return;

  if (document.getElementById("usersCount")) {
    loadAdminDashboard();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initAdminPage);
} else {
  initAdminPage();
}

// ربط الدوال بنطاق الـ Window العالمي
window.loadAdminDashboard = loadAdminDashboard;
window.loadAdminSection = loadAdminSection;
window.selectDashboardSection = selectDashboardSection;
window.renderAdminTable = renderAdminTable;
window.handleAdminSearch = handleAdminSearch; // 🚀 ربط الدالة الجديدة بنطاق الويندوز
window.resetSearchBox = resetSearchBox;
window.openDriverRequestsModal = openDriverRequestsModal;
window.calculateAge = calculateAge;
window.acceptDriver = acceptDriver;
window.rejectDriver = rejectDriver;
window.closeDriverRequestsModal = closeDriverRequestsModal;
window.renderDriverRequests = renderDriverRequests;
window.formatPhone = formatPhone;
window.filterDriverRequests = filterDriverRequests;
window.initAdminPage = initAdminPage;
window.initAdminChart = initAdminChart;