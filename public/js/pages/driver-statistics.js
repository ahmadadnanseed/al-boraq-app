document.addEventListener("DOMContentLoaded", loadDriverStatistics);

async function loadDriverStatistics() {
  const driverId = localStorage.getItem("driverId");

  if (!driverId) {
    alert("يجب تسجيل الدخول كسائق");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`/driver/statistics/${driverId}`);
    const data = await response.json();

    if (!data.success) {
      alert(data.message || "فشل تحميل الإحصائيات");
      return;
    }

    const stats = data.statistics;

    setText("todayTripsCount", stats.todayTrips || 0);
    setText("monthlyTripsCount", stats.monthlyTrips || 0);

    setText("todayEarnings", formatMoney(stats.todayEarnings));
    setText("monthlyEarnings", formatMoney(stats.monthlyEarnings));

    setText("completedTripsCount", stats.completedTrips || 0);
    setText("pendingTripsCount", stats.pendingTrips || 0);
    setText("postponedTripsCount", stats.postponedTrips || 0);
    setText("cancelledTripsCount", stats.cancelledTrips || 0);

    setText("availableBalance", formatMoney(stats.availableBalance));

    updateBars(stats);

  } catch (error) {
    console.log("Driver statistics fetch error:", error);
    alert("حدث خطأ أثناء تحميل الإحصائيات");
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function formatMoney(value) {
  const amount = Number(value || 0).toFixed(2);
  return `${amount} JD`;
}

function updateBars(stats) {
  const completed = Number(stats.completedTrips || 0);
  const pending = Number(stats.pendingTrips || 0);
  const postponed = Number(stats.postponedTrips || 0);
  const cancelled = Number(stats.cancelledTrips || 0);

  const max = Math.max(completed, pending, postponed, cancelled, 1);

  setBarHeight(".bar.completed", completed, max);
  setBarHeight(".bar.pending", pending, max);
  setBarHeight(".bar.postponed", postponed, max);
  setBarHeight(".bar.cancelled", cancelled, max);
}

function setBarHeight(selector, value, max) {
  const bar = document.querySelector(selector);
  if (!bar) return;

  const height = Math.max((value / max) * 140, 20);
  bar.style.height = `${height}px`;
}
let isWithdrawVerified = false;

// دالة لفتح نافذة السحب
function openWithdrawModal() {
  document.getElementById("withdrawModal").style.display = "flex";
}

// دالة لإغلاق نافذة السحب وتصفير المدخلات
function closeWithdrawModal() {
  document.getElementById("withdrawModal").style.display = "none";
  document.getElementById("withdrawForm").reset();
}

// دالة لتغيير النصوص حسب خيار السائق (محفظة أو بنك) لتبدو احترافية
function toggleWithdrawFields() {
  const method = document.getElementById("withdrawMethod").value;
  const label = document.getElementById("methodLabel");
  const input = document.getElementById("methodInput");
  
  if (method === "bank") {
    label.innerText = "رقم الحساب الدولي (IBAN) أو كليك:";
    input.placeholder = "JOXXXXXXXXXXXXXXXXXXXXXXXX";
  } else {
    label.innerText = "رقم المحفظة الإلكترونية:";
    input.placeholder = "079XXXXXXXX";
  }
}

// معالجة إرسال طلب السحب فور التحقق من إدخال البيانات
function handleWithdrawSubmit(event) {
  event.preventDefault();
  
  isWithdrawVerified = true;
  closeWithdrawModal();
  
  // استدعاء دالة الإرسال الفعلية للسيرفر الخاصة بك
  confirmWithdrawal();
}

// دالة إرسال طلب السحب للسيرفر (قم بدمج منطق الـ Fetch الخاص بك داخلها)
async function confirmWithdrawal() {
  if (!isWithdrawVerified) {
    alert("الرجاء تحديد واجهة الحساب لإتمام عملية السحب!");
    openWithdrawModal();
    return;
  }

  // هنا تضع كود الـ Fetch الحقيقي لإرسال الطلب للأدمن، على سبيل المثال:
  try {
    // مثال لـ API السحب:
    // const res = await fetch('/driver/withdraw', { method: 'POST', ... });
    
    alert("تم التحقق من الحساب بنجاح! تم إرسال طلب السحب وبانتظار موافقة الأدمن.");
    isWithdrawVerified = false; // إعادة التصفير للأمان
    
  } catch (err) {
    console.log("Withdrawal error:", err);
    alert("حدث خطأ أثناء معالجة طلب السحب");
    isWithdrawVerified = false;
  }
}

// تصدير الدوال للنطاق العالمي لتفادي مشاكل الـ HTML
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;
window.toggleWithdrawFields = toggleWithdrawFields;
window.handleWithdrawSubmit = handleWithdrawSubmit;
window.confirmWithdrawal = confirmWithdrawal;