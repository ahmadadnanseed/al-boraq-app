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

function initAdminPage() {
  if (document.getElementById("usersCount")) {
    loadAdminDashboard();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initAdminPage);
} else {
  initAdminPage();
}

window.loadAdminDashboard = loadAdminDashboard;
window.loadAdminSection = loadAdminSection;
window.selectDashboardSection = selectDashboardSection;
window.renderAdminChart = renderAdminChart;
window.renderAdminTable = renderAdminTable;
window.searchById = searchById;
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
