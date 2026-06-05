/* ========================================================
   🚀 المنطق البرمجي المؤمن والحارس لصفحة استعراض الكيانات للأدمن
======================================================== */

// التقاط المعاملات من الرابط
const urlParams = new URLSearchParams(window.location.search);
const targetId = urlParams.get('id');
const targetType = urlParams.get('type');

// تشغيل الجلب فوراً عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  if (targetId && targetType) {
    loadTargetDetails();
  } else {
    const viewTitleEl = document.getElementById('viewTitle');
    if (viewTitleEl) viewTitleEl.innerText = "خطأ: لم يتم تحديد كيان للبحث عنه.";
  }
});

// 🚀 التعديل: نقوم بجلب التوكن بداخل دالة الهيدرز مباشرة لكي يتعرف عليها المتصفح
function getAuthHeaders() {
  const token = localStorage.getItem("token"); // 🔑 أضفنا هذا السطر لتعريف المتغير بأمان
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

async function loadTargetDetails() {
  try {
  
const response = await fetch(`/admin/advanced-search/${targetType === 'customer' ? 'users' : targetType === 'driver' ? 'drivers' : 'activeSubs'}/${targetId}`, {
  headers: getAuthHeaders()
});
    if (response.status === 401 || response.status === 403) {
      alert("جلسة منتهية، يرجى إعادة تسجيل الدخول.");
      localStorage.clear();
      window.location.href = "/login.html";
      return;
    }

    const result = await response.json();

    if (!result.success) {
      document.getElementById('viewTitle').innerText = result.message;
      return;
    }

    document.getElementById('deleteBtn').style.display = "block";
    document.getElementById('mainCard').style.display = "block";
    
    const data = result.data;
    let gridHTML = "";
    let statsHTML = "";

    if (result.type === "customer") {
      document.getElementById('viewTitle').innerText = `ملف العميل: ${data.name}`;
      gridHTML = `
        <div class="info-item"><label>الاسم الكامل</label><span>${data.name}</span></div>
        <div class="info-item"><label>رقم الهاتف</label><span>${data.phone}</span></div>
        <div class="info-item"><label>تاريخ الميلاد</label><span>${data.dob}</span></div>
      `;
      statsHTML = `
        <div class="stat-box"><div class="stat-circle">${data.completedTrips}</div><span>رحلات منجزة</span></div>
        <div class="stat-box orange"><div class="stat-circle">${data.postponedTrips}</div><span>رحلات مؤجلة</span></div>
        <div class="stat-box"><div class="stat-circle" style="border-top-color:#3a86ff;">${data.remainingTrips}</div><span>رحلات متبقية/مجدولة</span></div>
      `;
    } 
    
    else if (result.type === "driver") {
      document.getElementById('viewTitle').innerText = `ملف الكابتن: ${data.name}`;
      gridHTML = `
        <div class="info-item"><label>اسم السائق</label><span>${data.name}</span></div>
        <div class="info-item"><label>رقم هاتف الكابتن</label><span>${data.phone}</span></div>
        <div class="info-item"><label>العنوان السكني</label><span>${data.address}</span></div>
      `;
      statsHTML = `
        <div class="stat-box"><div class="stat-circle" style="border-top-color:#ffbe0b;">⭐ ${data.avgRating}</div><span>متوسط التقييم العام</span></div>
        <div class="stat-box orange"><div class="stat-circle">${data.dailyEarnings} JOD</div><span>أرباح اليوم</span></div>
        <div class="stat-box"><div class="stat-circle">${data.totalEarnings} JOD</div><span>إجمالي الأرباح الكلية</span></div>
      `;
    } 
    
    else if (result.type === "booking") {
      document.getElementById('viewTitle').innerText = `تفاصيل الاشتراك / الرحلة رقم: #${data.id}`;
      gridHTML = `
        <div class="info-item"><label>صاحب الرحلة (المستفيد)</label><span>${data.customerName}</span></div>
        <div class="info-item"><label>نوع الرحلة</label><span>${data.type === 'round-trip' ? 'ذهاب وإياب' : 'ذهاب فقط'}</span></div>
        <div class="info-item"><label>تكلفة العقد</label><span>${data.price} JOD</span></div>
      `;
      statsHTML = `
        <div class="stat-box"><div class="stat-circle">${data.doneTrips}</div><span>أيام تم إنجازها</span></div>
        <div class="stat-box orange"><div class="stat-circle">${data.deferredTrips}</div><span>أيام تم تأجيلها</span></div>
        <div class="stat-box"><div class="stat-circle" style="border-top-color:#3a86ff;">${data.pendingTrips}</div><span>أيام متبقية جارية</span></div>
      `;
    }

    document.getElementById('infoGrid').innerHTML = gridHTML;
    document.getElementById('statsContainer').innerHTML = statsHTML;

  } catch (err) {
    console.error(err);
    document.getElementById('viewTitle').innerText = "فشل الاتصال بالسيرفر لجلب الإحصائيات الخاصة.";
  }
}

async function handleDelete() {
  const entityName = targetType === 'customer' ? 'مستخدم' : targetType === 'driver' ? 'سائق' : 'رحلة';
  if (!confirm(`تحذير نهائي: هل أنت متأكد تماماً من حذف هذا الـ ${entityName} بشكل نهائي من قاعدة البيانات؟`)) return;
  
  try {
    const response = await fetch(`/admin/delete-target/${targetType}/${targetId}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const resData = await response.json();
    
    if (resData.success) {
      alert("تم الحذف بنجاح!");
      window.location.href = "/admin.html";
    } else {
      alert(resData.message);
    }
  } catch (err) {
    alert("خطأ داخلي أثناء تنفيذ عملية الحذف.");
  }
}

// جعل دالة الحذف مرئية للـ HTML
window.handleDelete = handleDelete;