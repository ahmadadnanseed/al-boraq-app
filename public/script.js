window.initMapInputs = window.initMapInputs || function() {
  window.__googleMapsReady = true;
};

[
  "core/api",
  "core/storage",
  "core/dom",
  "shared/helpers",
  "shared/navigation",
  "shared/sidebar",
  "shared/maps",
  "pages/login",
  "pages/signup",
  "pages/forgot-password",
  "pages/profile",
  "pages/notifications",
  "pages/subscriptions",
  "pages/booking",
  "pages/seats",
  "pages/driver-signup",
  "pages/driver-profile",
  "pages/driver-requests",
  "pages/driver-daily-trips",
  "pages/admin"
].forEach((name) => {
  const script = document.createElement("script");
  script.async = false;
  script.src = `js/${name}.js`;
  document.head.appendChild(script);
});
/* =========================================================
    تحميل الصفحة (عام)
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
    الأدمن Tabs
========================================================= */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(p => p.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
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