function selectCity(city) {
  const el = document.getElementById("driverAddress");

  if (el) {
    el.textContent = city;
  }
}

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

function initDriverSignupPage() {
  loadDriverSignupData();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initDriverSignupPage);
} else {
  initDriverSignupPage();
}

window.selectCity = selectCity;
window.loadDriverSignupData = loadDriverSignupData;
window.submitDriver = submitDriver;
window.initDriverSignupPage = initDriverSignupPage;
