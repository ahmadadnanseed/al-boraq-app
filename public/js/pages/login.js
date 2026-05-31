// ملف: js/pages/login.js

async function handleLogin(e) {
  e.preventDefault(); // منع إعادة تحميل الصفحة الافتراضي

  const rawInput = document.getElementById("userPhone").value.trim();
  const countryCode = document.getElementById("countryCode").value;
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMessage");

  if (errorMsg) errorMsg.innerText = "";

  let loginData;

  // التمييز الذكي لنوع الحساب بناءً على الرمز المدخل (RegEx)
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
    // 1. إرسال طلب تسجيل الدخول إلى الباك آند
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
    });

    // 2. استقبال وتحليل استجابة السيرفر
    const data = await res.json();

    if (data.success) {
    if (data.success) {
  // تخزين المعرفات والتوكن (JWT) وتوجيه المستخدم بناءً على الصلاحيات
  
  if (data.role === "admin") {
    localStorage.setItem("token", data.token); 
    localStorage.setItem("adminId", data.adminId);
    localStorage.setItem("userType", "admin");
    
    localStorage.removeItem("userId");
    localStorage.removeItem("driverId");
    // 🔑 تعديل ذكي: تمرير التوكن بالرابط ليعبر حارس السيرفر ويفتح الصفحة
    window.location.href = `admin.html?token=${data.token}`; 

  } else if (data.role === "driver") {
    localStorage.setItem("token", data.token); 
    localStorage.setItem("driverId", data.driverId);
    localStorage.setItem("userType", "driver");
    
    localStorage.removeItem("userId");
    localStorage.removeItem("adminId");
    // 🔑 تمرير التوكن لصفحة السائق الرئيسية
    window.location.href = `driver-requests.html?token=${data.token}`; 

  } else {
    localStorage.setItem("token", data.token); 
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userType", "customer");
    
    localStorage.removeItem("driverId");
    localStorage.removeItem("adminId");
    window.location.href = "index.html"; // صفحة الركاب العادية ساكنة بـ public لا تحتاج توكن بالرابط
  }
}
      if (errorMsg) errorMsg.innerText = data.message || "فشل تسجيل الدخول";
    }

  } catch (err) {
    console.error("Login Error:", err);
    if (errorMsg) errorMsg.innerText = "خطأ في الاتصال بالسيرفر";
  }
}

// ربط الدالة بالـ window لتراها صفحة الـ HTML عند الضغط على زر دخول
window.handleLogin = handleLogin;