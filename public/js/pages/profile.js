let currentField = "";

function goToProfile() {
  window.location.href = "profile.html";
}

async function loadProfile() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch(`/user/${userId}`);
    const data = await res.json();

    if (!data.success) {
      alert(data.message || "تعذر جلب البيانات");
      return;
    }

    const user = data.user;

    const fullName = `${user.fast_name_caustomer || ""} ${user.last_name_caustomer || ""}`.trim();
    const phone = user.phone_caustomer || "";
    const dob = user.date_of_birth_caustomer || "";
    const email = user.email || "";
    const gender = user.gender || "";

    document.getElementById("topName").innerText = fullName;
    document.getElementById("topPhone").innerText = phone;

    document.getElementById("val-name").innerText = fullName;
    document.getElementById("val-phone").innerText = phone;
    document.getElementById("val-dob").innerText = dob;
    document.getElementById("val-email").innerText = email;
    document.getElementById("val-gender").innerText = gender;

    document.getElementById("avatarLetter").innerText = fullName ? fullName.charAt(0) : "";
  } catch (err) {
    console.log("Load profile error:", err);
  }
}

if (document.getElementById("topName")) {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", loadProfile);
  } else {
    loadProfile();
  }
}

function openEdit(field, title) {
  currentField = field;

  document.getElementById("modalTitle").innerText = "تعديل " + title;

  const valEl = document.getElementById("val-" + field);
  const currentValue = valEl ? valEl.innerText : "";

  let inputHTML = "";

  if (field === "name" || field === "phone") {
    inputHTML = `<input type="text" id="editInput" value="${currentValue}" style="width:100%;padding:10px;">`;
  } else if (field === "email") {
    inputHTML = `<input type="email" id="editInput" value="${currentValue}" style="width:100%;padding:10px;">`;
  } else if (field === "dob") {
    inputHTML = `<input type="date" id="editInput" value="${currentValue}" style="width:100%;padding:10px;">`;
  } else if (field === "gender") {
    inputHTML = `
      <select id="editInput" style="width:100%;padding:10px;">
        <option value="ذكر" ${currentValue === "ذكر" ? "selected" : ""}>ذكر</option>
        <option value="أنثى" ${currentValue === "أنثى" ? "selected" : ""}>أنثى</option>
      </select>
    `;
  }

  document.getElementById("inputBox").innerHTML = inputHTML;
  document.getElementById("profileEditModal").style.display = "flex";
}

function closeEdit() {
  document.getElementById("profileEditModal").style.display = "none";
}

async function saveChange() {
  const userId = localStorage.getItem("userId");
  const editInput = document.getElementById("editInput");

  if (!editInput) {
    alert("لا يوجد حقل تعديل");
    return;
  }

  const newValue = editInput.value;

  let bodyData = {
    name: document.getElementById("val-name").innerText,
    phone: document.getElementById("val-phone").innerText,
    dob: document.getElementById("val-dob").innerText,
    email: document.getElementById("val-email").innerText,
    gender: document.getElementById("val-gender").innerText
  };

  if (currentField === "name") bodyData.name = newValue;
  if (currentField === "phone") bodyData.phone = newValue;
  if (currentField === "email") bodyData.email = newValue;
  if (currentField === "dob") bodyData.dob = newValue;
  if (currentField === "gender") bodyData.gender = newValue;

  try {
    const res = await fetch(`/user/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    const data = await res.json();

    if (data.success) {
      if (currentField === "name") {
        document.getElementById("val-name").innerText = newValue;
        document.getElementById("topName").innerText = newValue;
      }

      if (currentField === "phone") {
        document.getElementById("val-phone").innerText = newValue;
        document.getElementById("topPhone").innerText = newValue;
      }

      if (currentField === "email") {
        document.getElementById("val-email").innerText = newValue;
      }

      if (currentField === "dob") {
        document.getElementById("val-dob").innerText = newValue;
      }

      if (currentField === "gender") {
        document.getElementById("val-gender").innerText = newValue;
      }

      alert("تم التعديل بنجاح");
      closeEdit();
    } else {
      alert(data.message || "فشل التعديل");
    }
  } catch (err) {
    console.log("Save change error:", err);
    alert("خطأ في الاتصال بالسيرفر");
  }
}

function handleLogout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("driverId");
  localStorage.removeItem("userType");
  window.location.replace("index.html");
}

window.goToProfile = goToProfile;
window.loadProfile = loadProfile;
window.openEdit = openEdit;
window.closeEdit = closeEdit;
window.saveChange = saveChange;
window.handleLogout = handleLogout;
