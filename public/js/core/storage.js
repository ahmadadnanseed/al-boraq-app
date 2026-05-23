(function () {
  function getStorageItem(key) {
    return localStorage.getItem(key);
  }

  function setStorageItem(key, value) {
    localStorage.setItem(key, value);
  }

  function removeStorageItem(key) {
    localStorage.removeItem(key);
  }

  function getJsonStorageItem(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function setJsonStorageItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUserId() {
    return localStorage.getItem("userId");
  }

  function getDriverId() {
    return localStorage.getItem("driverId");
  }

  function getAdminId() {
    return localStorage.getItem("adminId");
  }

  function clearAuth() {
    localStorage.removeItem("userId");
    localStorage.removeItem("driverId");
    localStorage.removeItem("adminId");
    localStorage.removeItem("userType");
  }

  window.getStorageItem = window.getStorageItem || getStorageItem;
  window.setStorageItem = window.setStorageItem || setStorageItem;
  window.removeStorageItem = window.removeStorageItem || removeStorageItem;
  window.getJsonStorageItem = window.getJsonStorageItem || getJsonStorageItem;
  window.setJsonStorageItem = window.setJsonStorageItem || setJsonStorageItem;
  window.getUserId = window.getUserId || getUserId;
  window.getDriverId = window.getDriverId || getDriverId;
  window.getAdminId = window.getAdminId || getAdminId;
  window.clearAuth = window.clearAuth || clearAuth;
})();
