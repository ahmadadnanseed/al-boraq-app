function closeOTP() {
    document.getElementById('otpModal').style.display = 'none';
}

function verifyOTP() {
    alert("تم التحقق بنجاح!");
    window.location.href = "index.html";
}

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", handleSignup);
}

async function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById("userName").value;
  const phone = document.getElementById("countryCode").value + document.getElementById("userPhone").value;
  const dob = document.getElementById("userDOB").value;
  const password = document.getElementById("userPass").value;

  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, phone, dob, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("userId", data.userId);
      alert("تم إنشاء الحساب بنجاح");
      window.location.href = "index.html";
    } 
  } catch (err) {
    console.log("Signup fetch error:", err);
    alert("خطأ في الاتصال بالسيرفر");
  }
}

window.closeOTP = closeOTP;
window.verifyOTP = verifyOTP;
window.handleSignup = handleSignup;
