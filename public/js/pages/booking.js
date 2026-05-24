let otherPersonData = null;

function initBookingPage() {
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const checkboxes = ['checkAdult', 'checkSpecial', 'checkOther',];
  checkboxes.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', function() {
        handleSelectionLogic(this);
      });
    }
  });
}

function updateTripType(type) {
    const btnOne = document.getElementById('btnOneWay');
    const btnRound = document.getElementById('btnRoundTrip');
    const returnBox = document.getElementById('returnTimeBox');

    if (type === 'round-trip') {
        btnRound.classList.add('active');
        btnOne.classList.remove('active');
        returnBox.style.display = 'block';
    } else {
        btnOne.classList.add('active');
        btnRound.classList.remove('active');
        returnBox.style.display = 'none';
    }
}

function handleSelectionLogic(changedElement) {
    const adult = document.getElementById('checkAdult');
    const special = document.getElementById('checkSpecial');
    const other = document.getElementById('checkOther');
    const otherFields = document.getElementById('otherInfoFields');
    const fullCar = document.getElementById("checkFullCar");

    if (fullCar && fullCar.checked && (adult.checked || special.checked || other.checked)) {
        alert("لا يمكن الجمع مع مركبة كاملة");
        changedElement.checked = false;
        return;
    }

    if (adult.checked && other.checked) {
        alert("لا يمكن الجمع");
        changedElement.checked = false;
        return;
    }

    if (adult.checked && special.checked) {
        alert("لا يمكن الجمع");
        changedElement.checked = false;
        return;
    }

    otherFields.style.display = other.checked ? 'block' : 'none';
}

async function checkAndGo() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("يجب تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  if (!pickupLocation) {
    alert("يرجى تحديد موقع الانطلاق");
    return;
  }

  if (!dropoffLocation) {
    alert("يرجى تحديد وجهة الوصول");
    return;
  }

  const bookingDate = document.getElementById("bookingDate").value;
  const goTime = document.getElementById("goTime").value;
  const returnTime = document.getElementById("returnTime").value || null;

  if (!bookingDate || !goTime) {
    alert("يرجى تحديد التاريخ ووقت الذهاب");
    return;
  }

  const bookingData = {
    start_date_booking: bookingDate,
    start_time: goTime,
    end_time: returnTime,
    status: 0,
    trip_type: document.getElementById("btnRoundTrip").classList.contains("active")
      ? "round-trip"
      : "one-way",
    customer_id_fk: userId,
    dependent_id_fk: otherPersonData ? otherPersonData.dependentId : null,
    is_for_dependent: otherPersonData ? 1 : 0,
    driver_id_fk: null,
    pickup: pickupLocation,
    dropoff: dropoffLocation,
    seats_count: document.getElementById("checkSpecial").checked ? 2 : 1,
    price: null,
    distance_km: null
  };

  try {
    const res = await fetch("/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bookingData)
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "فشل حفظ الحجز");
      return;
    }

    localStorage.setItem("bookingId", data.bookingId);

    alert("تم حفظ الحجز بنجاح");

    if (bookingData.is_full_car) {
      window.location.href = "schedule.html";
    } else {
      window.location.href = "seats.html";
    }

  } catch (err) {
    console.log("Booking error:", err);
    alert("خطأ في الاتصال بالسيرفر");
  }
}

function createBooking() {
  return checkAndGo();
}

function toggleOtherPersonModal(checkbox) {
  if (checkbox.checked) {
    document.getElementById("otherPersonModal").style.display = "flex";
  } else {
    otherPersonData = null;
    document.getElementById("otherPersonPreview").style.display = "none";
    document.getElementById("otherPersonPreview").innerHTML = "";
  }
}

async function saveOtherPerson() {
  const customerId = localStorage.getItem("userId");

  if (!customerId) {
    alert("يجب تسجيل الدخول أولاً");
    return;
  }

  const firstName = document.getElementById("dependentFirstName").value.trim();
  const lastName = document.getElementById("dependentLastName").value.trim();
  const dob = document.getElementById("dependentDOB").value;
  const relationship = document.getElementById("dependentRelationship").value.trim();
  const phone = document.getElementById("dependentPhone").value.trim();

  if (!firstName || !lastName || !dob || !relationship) {
    alert("يرجى تعبئة الاسم وتاريخ الميلاد وصلة القرابة");
    return;
  }

  try {
    const res = await fetch("/dependent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName,
        lastName,
        dob,
        relationship,
        phone,
        customerId
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "فشل حفظ بيانات التابع");
      return;
    }

    otherPersonData = {
      dependentId: data.dependentId,
      firstName,
      lastName,
      dob,
      relationship,
      phone: phone || null
    };

    const preview = document.getElementById("otherPersonPreview");
    preview.style.display = "block";
    preview.innerHTML = `
      ${firstName} ${lastName}<br>
      ${relationship} | ${dob}
    `;

    document.getElementById("otherPersonModal").style.display = "none";

    alert("تم حفظ بيانات التابع بنجاح");

  } catch (err) {
    console.log("Save dependent error:", err);
    alert("خطأ في الاتصال بالسيرفر");
  }
}

function cancelOtherPerson() {
  document.getElementById("checkOther").checked = false;
  otherPersonData = null;
  document.getElementById("otherPersonModal").style.display = "none";
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initBookingPage);
} else {
  initBookingPage();
}

window.initBookingPage = initBookingPage;
window.updateTripType = updateTripType;
window.handleSelectionLogic = handleSelectionLogic;
window.checkAndGo = checkAndGo;
window.createBooking = createBooking;
window.toggleOtherPersonModal = toggleOtherPersonModal;
window.saveOtherPerson = saveOtherPerson;
window.cancelOtherPerson = cancelOtherPerson;
