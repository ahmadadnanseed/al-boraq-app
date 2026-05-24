function openNav() {
    document.getElementById("sideMenu").style.width = "300px";
    document.getElementById("overlay").style.display = "block";
}

function closeNav() {
    document.getElementById("sideMenu").style.width = "0";
    document.getElementById("overlay").style.display = "none";
}

function checkLoginButtons() {
  const userId = localStorage.getItem("userId");

  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");

  if (userId) {
    if (signupBtn) signupBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "none";
  } else {
    if (signupBtn) signupBtn.style.display = "inline-block";
    if (loginBtn) loginBtn.style.display = "inline-block";
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", checkLoginButtons);
} else {
  checkLoginButtons();
}

window.openNav = openNav;
window.closeNav = closeNav;
window.checkLoginButtons = checkLoginButtons;
