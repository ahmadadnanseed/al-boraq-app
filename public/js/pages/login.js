
async function handleLogin(e) {
  e.preventDefault();

  const rawInput = document.getElementById("userPhone").value.trim();
  const countryCode = document.getElementById("countryCode").value;
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMessage");

  if (errorMsg) errorMsg.innerText = "";

  let loginData;

  if (/^admin\d+$/i.test(rawInput)) {
    loginData = {
      loginType: "admin",
      adminCode: rawInput,
      password: password
    };
  } else if (/^driver\d+$/i.test(rawInput)) {
    loginData = {
      loginType: "driver",
      driverCode: rawInput,
      password: password
    };
  } else {
    loginData = {
      loginType: "customer",
      phone: countryCode + rawInput,
      password: password
    };
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
    });

    const data = await res.json();

    if (data.success) {
    if (data.success) {
  
  if (data.role === "admin") {
    localStorage.setItem("token", data.token); 
    localStorage.setItem("adminId", data.adminId);
    localStorage.setItem("userType", "admin");
    
    localStorage.removeItem("userId");
    localStorage.removeItem("driverId");
    window.location.href = `admin.html?token=${data.token}`; 

  } else if (data.role === "driver") {
    localStorage.setItem("token", data.token); 
    localStorage.setItem("driverId", data.driverId);
    localStorage.setItem("userType", "driver");
    
    localStorage.removeItem("userId");
    localStorage.removeItem("adminId");
    window.location.href = `driver-requests.html?token=${data.token}`; 

  } else {
    localStorage.setItem("token", data.token); 
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userType", "customer");
    
    localStorage.removeItem("driverId");
    localStorage.removeItem("adminId");
    window.location.href = "index.html";
  }
}
      if (errorMsg) errorMsg.innerText = data.message || "فشل تسجيل الدخول";
    }

  } catch (err) {
    console.error("Login Error:", err);
    if (errorMsg) errorMsg.innerText = "خطأ في الاتصال بالسيرفر";
  }
}

window.handleLogin = handleLogin;