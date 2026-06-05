let selectedSeats = [];
let isVisaVerified = false;

function selectSeat(seatElement) {
  const seatNumber = seatElement.dataset.seat;

  if (seatElement.classList.contains("reserved")) return;

  seatElement.classList.toggle("selected");

  if (seatElement.classList.contains("selected")) {
    selectedSeats.push(seatNumber);
  } else {
    selectedSeats = selectedSeats.filter(s => s !== seatNumber);
  }

  updateSeatsSummary();
}

function calculateDistanceKm(pickup, dropoff) {
  const R = 6371;
  const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
  const dLng = (dropoff.lng - pickup.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(pickup.lat * Math.PI / 180) *
    Math.cos(dropoff.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateMonthlyPrice(distanceKm, seatsCount, tripType) {
  const days = 22;
  const pricePerKm = 0.20;

  let oneSeatPrice = distanceKm * pricePerKm * days;

  if (tripType === "round-trip") {
    oneSeatPrice *= 2;
  }

  return oneSeatPrice * seatsCount;
}

function updateSeatsSummary() {
  const bookingData = JSON.parse(localStorage.getItem("bookingData") || "{}");

  const pickup = bookingData.pickup || JSON.parse(localStorage.getItem("pickupLocation") || "null");
  const dropoff = bookingData.dropoff || JSON.parse(localStorage.getItem("dropoffLocation") || "null");
  const tripType = bookingData.trip_type || bookingData.tripType || "one-way";

  const count = selectedSeats.length;

  document.getElementById("selectedSeatsCount").innerText = count;
  document.getElementById("selectedSeatsText").innerText =
    count ? selectedSeats.join("، ") : "لا يوجد";

  const confirmBtn = document.getElementById("confirmBtn");
  confirmBtn.disabled = count === 0;

  if (!pickup || !dropoff || count === 0) {
    document.getElementById("distanceText").innerText = "--";
    document.getElementById("priceText").innerText = "--";
    return;
  }

  const distanceKm = calculateDistanceKm(pickup, dropoff);
  const price = calculateMonthlyPrice(distanceKm, count, tripType);

  document.getElementById("distanceText").innerText = distanceKm.toFixed(2);
  document.getElementById("priceText").innerText = price.toFixed(2);
}

async function cancelSeatBooking() {
  const bookingId = localStorage.getItem("bookingId");

  if (!bookingId) {
    window.location.href = "booking.html";
    return;
  }

  const ok = confirm("هل تريد إلغاء الحجز وحذفه؟");
  if (!ok) return;

  const res = await fetch(`/booking/${bookingId}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "فشل إلغاء الحجز");
    return;
  }

  localStorage.removeItem("bookingId");
  alert("تم إلغاء الحجز");
  window.location.href = "booking.html";
}

function openVisaModal() {
  if (selectedSeats.length === 0) {
    alert("اختر مقعد واحد على الأقل أولاً");
    return;
  }
  document.getElementById("visaModal").style.display = "flex";
}

function closeVisaModal() {
  document.getElementById("visaModal").style.display = "none";
  document.getElementById("visaForm").reset();
}

function handleVisaSubmit(event) {
  event.preventDefault();
  
  const cardNumber = document.getElementById("visaCardNumber").value;
  if (cardNumber.length !== 16) {
    alert("الرجاء إدخال رقم بطاقة ائتمان صحيح مكون من 16 خانة");
    return;
  }

  isVisaVerified = true;
  closeVisaModal();
  confirmBooking();
}

async function confirmBooking() {
  if (!isVisaVerified) {
    alert("يجب تعبئة بيانات الدفع أولاً لإكمال الاشتراك والطلب!");
    openVisaModal();
    return;
  }

  const bookingId = localStorage.getItem("bookingId");

  if (!bookingId) {
    alert("لا يوجد رقم حجز");
    isVisaVerified = false;
    return;
  }

  if (selectedSeats.length === 0) {
    alert("اختر مقعد واحد على الأقل");
    isVisaVerified = false;
    return;
  }

  const pickup = JSON.parse(localStorage.getItem("pickupLocation"));
  const dropoff = JSON.parse(localStorage.getItem("dropoffLocation"));
  const bookingData = JSON.parse(localStorage.getItem("bookingData") || "{}");

  const tripType = bookingData.trip_type || "one-way";

  try {
    const routeInfo = await getRealRouteInfo(pickup, dropoff);

    const price = calculateMonthlyPrice(
      routeInfo.distanceKm,
      selectedSeats.length,
      tripType
    );

    const res = await fetch(`/booking/${bookingId}/confirm`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selected_seats: selectedSeats,
        seats_count: selectedSeats.length,
        price: price.toFixed(2),
        distance_km: routeInfo.distanceKm.toFixed(2),
        duration_min: routeInfo.durationMin
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "فشل إرسال الطلب");
      isVisaVerified = false;
      return;
    }

    alert("تم التحقق من وسيلة الدفع بنجاح! وتم إرسال طلب اشتراكك إلى السائقين");
    isVisaVerified = false;
    window.location.href = "schedule.html";

  } catch (err) {
    console.log("Route error:", err);
    alert("تعذر حساب المسافة الحقيقية");
    isVisaVerified = false;
  }
}

function initSeatsPage() {
  if (document.getElementById("selectedSeatsCount")) {
    updateSeatsSummary();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initSeatsPage);
} else {
  initSeatsPage();
}

window.selectedSeats = selectedSeats;
window.selectSeat = selectSeat;
window.calculateDistanceKm = calculateDistanceKm;
window.calculateMonthlyPrice = calculateMonthlyPrice;
window.updateSeatsSummary = updateSeatsSummary;
window.cancelSeatBooking = cancelSeatBooking;
window.openVisaModal = openVisaModal;
window.closeVisaModal = closeVisaModal;
window.handleVisaSubmit = handleVisaSubmit;
window.confirmBooking = confirmBooking;
window.initSeatsPage = initSeatsPage;