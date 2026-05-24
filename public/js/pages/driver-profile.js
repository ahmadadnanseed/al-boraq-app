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

function initDriverProfilePage() {
  if (document.getElementById("driverTopName")) {
    loadDriverProfile();
  }

  if (document.getElementById("sidebarDriverName")) {
    loadDriverSidebarData();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initDriverProfilePage);
} else {
  initDriverProfilePage();
}

window.loadDriverProfile = loadDriverProfile;
window.loadDriverSidebarData = loadDriverSidebarData;
window.driver_openEdit = driver_openEdit;
window.driver_closeEdit = driver_closeEdit;
window.driver_saveChange = driver_saveChange;
window.initDriverProfilePage = initDriverProfilePage;
