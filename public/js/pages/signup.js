const firebaseConfig = {
  apiKey: "AIzaSyCOwZSVTQaoIp0zwzoN0S0ZdYIXs6ScAtM",
  authDomain: "buraq-cd214.firebaseapp.com",
  projectId: "buraq-cd214",
  storageBucket: "buraq-cd214.firebasestorage.app",
  messagingSenderId: "29633524860",
  appId: "1:29633524860:web:69b659aa8c95948aec45f9"
};

firebase.initializeApp(firebaseConfig);

let confirmationResult = null;
let pendingSignupData = null;

window.addEventListener("load", () => {
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
    "recaptcha-container",
    {
      size: "invisible"
    }
  );
});

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", handleSignup);
}

async function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById("userName").value.trim();
 let rawPhone = document.getElementById("userPhone").value.trim();

rawPhone = rawPhone.replace(/\D/g, "");

if (rawPhone.startsWith("0")) {
  rawPhone = rawPhone.substring(1);
}

const phone = document.getElementById("countryCode").value + rawPhone;

  const dob = document.getElementById("userDOB").value;
  const password = document.getElementById("userPass").value;

  pendingSignupData = { name, phone, dob, password };

  try {
    confirmationResult = await firebase
      .auth()
      .signInWithPhoneNumber(phone, window.recaptchaVerifier);

    document.getElementById("otpModal").style.display = "flex";
    alert("تم إرسال رمز التحقق عبر SMS");
  } catch (error) {
    console.log("Firebase SMS error:", error);
    alert("فشل إرسال رمز التحقق. تأكد من الرقم والمحاولة مرة أخرى.");
  }
}

async function verifyOTP() {
  const code = Array.from(document.querySelectorAll(".otp-digit"))
    .map(input => input.value)
    .join("");

  if (code.length !== 4 && code.length !== 6) {
    alert("أدخل رمز التحقق كاملًا");
    return;
  }

  try {
    await confirmationResult.confirm(code);

    const res = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pendingSignupData)
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "فشل إنشاء الحساب");
      return;
    }

    localStorage.setItem("userId", data.userId);
    alert("تم إنشاء الحساب بنجاح");
    window.location.href = "index.html";

  } catch (error) {
    console.log("OTP verify error:", error);
    alert("رمز التحقق غير صحيح أو انتهت صلاحيته");
  }
}

function closeOTP() {
  document.getElementById("otpModal").style.display = "none";
}

window.handleSignup = handleSignup;
window.verifyOTP = verifyOTP;
window.closeOTP = closeOTP;