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

function drivergoToProfile() {
    window.location.href = "driver-profile.html";
}

function initSidebar() {
  loadSidebarUserData();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initSidebar);
} else {
  initSidebar();
}

window.loadSidebarUserData = loadSidebarUserData;
window.drivergoToProfile = drivergoToProfile;
window.initSidebar = initSidebar;
