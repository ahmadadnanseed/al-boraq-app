async function handleLogin(e) {
  e.preventDefault();

  let rawInput = document.getElementById("userPhone").value.trim();
  const countryCode = document.getElementById("countryCode").value;
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMessage");

  if (errorMsg) errorMsg.innerText = "";

  let loginData;

  // 🔧 هان السر! إذا كتب المستخدم 0 في البداية (مثال: 078...)، قم بحذفه فوراً
  if (rawInput.startsWith("0")) {
    rawInput = rawInput.substring(1); // بياخذ النص من بعد الخانة الأولى (بيحذف الـ 0)
  }

  // 1. تحديد نوع الحساب بناءً على المدخلات المعدلة عِبر الـ Regex
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
      phone: countryCode + rawInput, // هسا لو دخل 078، رح تنبعث 96278 والموضوع انحل!
      password: password
    };
  }

  try {
    // 2. إرسال الطلب إلى السيرفر عِبر الـ API
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
    });

    const data = await res.json();

    // 3. معالجة الرد بشكل منطقي سليم
    if (data.success) {
      localStorage.setItem("token", data.token);

      if (data.role === "admin") {
        localStorage.setItem("adminId", data.adminId);
        localStorage.setItem("userType", "admin");
        localStorage.removeItem("userId");
        localStorage.removeItem("driverId");
        window.location.href = `admin.html?token=${data.token}`;
        
      } else if (data.role === "driver") {
        localStorage.setItem("driverId", data.driverId);
        localStorage.setItem("userType", "driver");
        localStorage.removeItem("userId");
        localStorage.removeItem("adminId");
        window.location.href = `driver-requests.html?token=${data.token}`;
        
      } else {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userType", "customer");
        localStorage.removeItem("driverId");
        localStorage.removeItem("adminId");
        window.location.href = "index.html";
      }

    } else {
      if (errorMsg) {
        errorMsg.innerText = data.message || "فشل تسجيل الدخول، تأكد من البيانات";
      }
    }

  } catch (err) {
    console.error("Login Error:", err);
    if (errorMsg) errorMsg.innerText = "خطأ في الاتصال بالسيرفر";
  }
}

window.handleLogin = handleLogin;