let resetPhoneNumber = "";
let resetCode = "";

async function sendResetCode() {
  const phoneInput = document.getElementById("resetPhone").value.trim();

  if (!phoneInput) {
    alert("أدخل رقم الهاتف");
    return;
  }

  resetPhoneNumber = "+962" + phoneInput;

  const res = await fetch("/forgot-password/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: resetPhoneNumber })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إرسال الرمز");
    return;
  }

  window.open(data.whatsappUrl, "_blank");
document.getElementById(
"verificationPhone"
).innerText = resetPhoneNumber;
  showResetStep(2);
}

async function verifyResetCode() {
  const inputs = document.querySelectorAll(".otp-field");
  resetCode = Array.from(inputs).map(input => input.value).join("");

  if (resetCode.length !== 4) {
    alert("أدخل رمز التحقق كاملاً");
    return;
  }

  const res = await fetch("/forgot-password/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: resetPhoneNumber,
      code: resetCode
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "رمز غير صحيح");
    return;
  }

  showResetStep(3);
}

async function finishPasswordReset() {
  const newPass = document.getElementById("newPass").value.trim();
  const confirmPass = document.getElementById("confirmNewPass").value.trim();

  if (!newPass || !confirmPass) {
    alert("أدخل كلمة المرور");
    return;
  }

  if (newPass !== confirmPass) {
    alert("كلمتا المرور غير متطابقتين");
    return;
  }

  const res = await fetch("/forgot-password/reset", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: resetPhoneNumber,
      code: resetCode,
      newPassword: newPass
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل تغيير كلمة المرور");
    return;
  }

  alert("تم تغيير كلمة المرور بنجاح");
  window.location.href = "login.html";
}

function showResetStep(step) {
  document.getElementById("forgot-step1").style.display = "none";
  document.getElementById("forgot-step2").style.display = "none";
  document.getElementById("forgot-step3").style.display = "none";

  document.getElementById(`forgot-step${step}`).style.display = "block";
}

window.sendResetCode = sendResetCode;
window.verifyResetCode = verifyResetCode;
window.finishPasswordReset = finishPasswordReset;
window.showResetStep = showResetStep;
