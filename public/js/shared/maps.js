function openMaps() {
    window.open("https://www.google.com/maps", "_blank");
}

function isGoogleMapsReady() {
  return typeof google !== "undefined" && google.maps;
}

function getRealRouteInfo(pickup, dropoff) {
  return new Promise((resolve, reject) => {
    if (!isGoogleMapsReady()) {
      reject("Google Maps API is not loaded");
      return;
    }

    console.log("PICKUP:", pickup);
    console.log("DROPOFF:", dropoff);

    const service = new google.maps.DirectionsService();

    service.route(
      {
        origin: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
        destination: { lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        console.log("Directions status:", status);

        if (status !== "OK") {
          alert("خطأ: " + status);
          reject(status);
          return;
        }

        const leg = result.routes[0].legs[0];

        resolve({
          distanceKm: leg.distance.value / 1000,
          durationMin: Math.ceil(leg.duration.value / 60)
        });
      }
    );
  });
}

function drawDirectionsOnMap(mapEl, pickup, dropoff) {
  if (!isGoogleMapsReady()) return;

  if (!pickup || !dropoff) {
    alert("بيانات الموقع غير مكتملة");
    return;
  }

  mapEl.style.display = "block";

  const map = new google.maps.Map(mapEl, {
    center: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map
  });

  directionsService.route(
    {
      origin: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
      destination: { lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
      travelMode: google.maps.TravelMode.DRIVING
    },
    (result, status) => {
      if (status !== "OK") {
        alert("تعذر عرض المسار");
        return;
      }

      directionsRenderer.setDirections(result);
    }
  );
}

function drawDriverRoute(bookingId, pickup, dropoff) {
  const mapEl = document.getElementById(`driverMap-${bookingId}`);
  drawDirectionsOnMap(mapEl, pickup, dropoff);
}

function drawDriverToCustomerMap(tripId, pickup, dropoff) {
  if (!pickup || !dropoff) {
    alert("إحداثيات الرحلة (موقع الراكب أو الوجهة) غير مكتملة");
    return;
  }

  // 1. تحديد نقطة البداية والنهاية من البيانات الحقيقية القادمة من السيرفر
  const origin = { lat: parseFloat(pickup.lat), lng: parseFloat(pickup.lng) };
  const destination = { lat: parseFloat(dropoff.lat), lng: parseFloat(dropoff.lng) };

  // 2. التحقق من وجود مكتبة جوجل مابس
  if (typeof google === "undefined" || !google.maps) {
    alert("مكتبة جوجل مابس لم يتم تحميلها بعد");
    return;
  }

  // 3. الإمساك بعنصر الخريطة المصغرة الخاص بالكرت الحالي
  const mapEl = document.getElementById(`driverTodayMap-${tripId}`);
  if (!mapEl) {
    alert("تعذر تحضير عنصر الخريطة في الشاشة");
    return;
  }

  // إظهار عنصر الخريطة
  mapEl.style.display = "block";

  // 4. بناء الخريطة وتشغيل خدمة رسم المسارات الديناميكية
  const map = new google.maps.Map(mapEl, {
    zoom: 13,
    center: origin,
    disableDefaultUI: true // لتنظيف شكل الخريطة المصغرة على الموبايل
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  
  directionsRenderer.setMap(map);

  // 5. طلب رسم الطريق الفعلي من موقع الراكب إلى وجهته
  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(response);
      } else {
        console.error("جوجل مابس فشل في رسم الطريق بسبب: " + status);
      }
    }
  );
}

function drawCustomerRoute(bookingId, pickup, dropoff) {
  const mapEl = document.getElementById(`customerMap-${bookingId}`);
  drawDirectionsOnMap(mapEl, pickup, dropoff);
}

var pickupLocation = null;
var dropoffLocation = null;

async function initMapInputs() {
  const pickupBox = document.getElementById("pickupInput");
  const dropoffBox = document.getElementById("dropoffInput");

  if (!pickupBox || !dropoffBox || !isGoogleMapsReady() || !google.maps.places) return;

  pickupBox.innerHTML = "";
  dropoffBox.innerHTML = "";

  const pickupAuto = new google.maps.places.PlaceAutocompleteElement();
  const dropoffAuto = new google.maps.places.PlaceAutocompleteElement();

  pickupAuto.setAttribute("placeholder", "حدد موقع الانطلاق...");
dropoffAuto.setAttribute("placeholder", "حدد وجهة الوصول...");


     pickupAuto.setAttribute("locationBias", "circle:100000@31.95,35.93");
    dropoffAuto.setAttribute("locationBias", "circle:100000@31.95,35.93");

  pickupAuto.setAttribute("lang", "ar");
  dropoffAuto.setAttribute("lang", "ar");

  pickupBox.appendChild(pickupAuto);
  dropoffBox.appendChild(dropoffAuto);

  pickupAuto.addEventListener("gmp-select", async (event) => {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"]
    });

    pickupLocation = {
      name: place.formattedAddress || place.displayName,
      lat: place.location.lat(),
      lng: place.location.lng()
    };

    localStorage.setItem("pickupLocation", JSON.stringify(pickupLocation));
  });

  dropoffAuto.addEventListener("gmp-select", async (event) => {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"]
    });

    dropoffLocation = {
      name: place.formattedAddress || place.displayName,
      lat: place.location.lat(),
      lng: place.location.lng()
    };

    localStorage.setItem("dropoffLocation", JSON.stringify(dropoffLocation));
  });
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("المتصفح لا يدعم تحديد الموقع");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      pickupLocation = {
        name: "موقعي الحالي",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      localStorage.setItem("pickupLocation", JSON.stringify(pickupLocation));

      const pickupBox = document.getElementById("pickupInput");
      if (pickupBox) {
        pickupBox.innerHTML = `
          <div style="color:white;font-weight:bold;padding:12px;">
            <i class="bi bi-geo-alt-fill"></i> تم تحديد موقعي الحالي
          </div>
        `;
      }

      alert("تم تحديد موقعك الحالي بنجاح");
    },
    (error) => {
      console.log(error);
      alert("لم يتم السماح بالوصول إلى الموقع");
    }
  );
}

let mapPicker = null;
let mapMarker = null;
let selectedMapType = null;
let selectedMapLocation = null;
let mapSearchAutocomplete = null;

function openMapPicker(type) {
  selectedMapType = type;

  document.getElementById("mapPickerModal").style.display = "flex";
  document.getElementById("mapPickerTitle").innerText =
    type === "pickup" ? "حدد موقع الانطلاق" : "حدد وجهة الوصول";

  setTimeout(() => {
    initPickerMap();
  }, 300);
}

function initPickerMap() {
  if (!isGoogleMapsReady()) return;

  const defaultLocation = { lat: 31.9539, lng: 35.9106 };

  if (!mapPicker) {
    mapPicker = new google.maps.Map(document.getElementById("pickerMap"), {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapMarker = new google.maps.Marker({
      position: defaultLocation,
      map: mapPicker,
      draggable: true
    });

    selectedMapLocation = {
      name: "موقع محدد من الخريطة",
      lat: defaultLocation.lat,
      lng: defaultLocation.lng
    };

    mapPicker.addListener("click", (event) => {
      setMarkerLocation(event.latLng);
    });

    mapMarker.addListener("dragend", (event) => {
      setMarkerLocation(event.latLng);
    });

    const searchInput = document.getElementById("mapSearchInput");

    mapSearchAutocomplete = new google.maps.places.Autocomplete(searchInput, {
      componentRestrictions: { country: "jo" },
      fields: ["formatted_address", "geometry", "name"]
    });

    mapSearchAutocomplete.addListener("place_changed", () => {
      const place = mapSearchAutocomplete.getPlace();

      if (!place.geometry) {
        alert("اختر موقع من الاقتراحات");
        return;
      }

      mapPicker.setCenter(place.geometry.location);
      mapPicker.setZoom(16);
      setMarkerLocation(place.geometry.location, place.formatted_address || place.name);
    });
  }

  google.maps.event.trigger(mapPicker, "resize");
}

function setMarkerLocation(latLng, placeName = null) {
  if (!isGoogleMapsReady()) return;

  mapMarker.setPosition(latLng);

  selectedMapLocation = {
    name: placeName || "موقع محدد من الخريطة",
    lat: latLng.lat(),
    lng: latLng.lng()
  };

  reverseGeocode(latLng);
}

function reverseGeocode(latLng) {
  if (!isGoogleMapsReady()) return;

  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === "OK" && results[0]) {
      selectedMapLocation.name = results[0].formatted_address;
    }
  });
}

function confirmMapLocation() {
  if (!selectedMapLocation) {
    alert("حدد موقع من الخريطة");
    return;
  }

  if (selectedMapType === "pickup") {
    pickupLocation = selectedMapLocation;
    localStorage.setItem("pickupLocation", JSON.stringify(pickupLocation));

    const pickupBox = document.getElementById("pickupInput");
    pickupBox.innerHTML = `
      <div style="color:white;font-weight:bold;padding:12px;">
        <i class="bi bi-geo-alt-fill"></i> ${pickupLocation.name}
      </div>
    `;
  }

  if (selectedMapType === "dropoff") {
    dropoffLocation = selectedMapLocation;
    localStorage.setItem("dropoffLocation", JSON.stringify(dropoffLocation));

    const dropoffBox = document.getElementById("dropoffInput");
    dropoffBox.innerHTML = `
      <div style="color:white;font-weight:bold;padding:12px;">
        <i class="bi bi-flag-fill"></i> ${dropoffLocation.name}
      </div>
    `;
  }

  closeMapPicker();
}

function closeMapPicker() {
  document.getElementById("mapPickerModal").style.display = "none";
}

window.openMaps = openMaps;
window.isGoogleMapsReady = isGoogleMapsReady;
window.getRealRouteInfo = getRealRouteInfo;
window.drawDirectionsOnMap = drawDirectionsOnMap;
window.drawDriverRoute = drawDriverRoute;
window.drawDriverToCustomerMap = drawDriverToCustomerMap;
window.drawCustomerRoute = drawCustomerRoute;
window.initMapInputs = initMapInputs;
window.useCurrentLocation = useCurrentLocation;
window.openMapPicker = openMapPicker;
window.initPickerMap = initPickerMap;
window.setMarkerLocation = setMarkerLocation;
window.reverseGeocode = reverseGeocode;
window.confirmMapLocation = confirmMapLocation;
window.closeMapPicker = closeMapPicker;
