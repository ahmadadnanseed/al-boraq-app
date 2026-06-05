window.initMapInputs = window.initMapInputs || function() {
  window.__googleMapsReady = true;
};

const scriptsToLoad = [
  "core/api",
  "core/storage",
  "core/dom",
  "shared/helpers",
  "shared/navigation",
  "shared/sidebar",
  "shared/maps",
  "pages/login",
  "pages/forgot-password",
  "pages/profile",
  "pages/notifications",
  "pages/subscriptions",
  "pages/booking",
  "pages/seats",
  "pages/driver-signup",
  "pages/driver-profile",
  "pages/driver-requests",
  "pages/driver-daily-trips",
  "pages/admin",
  "pages/admin-view"
];

if (window.location.pathname.includes("signup.html")) {
  scriptsToLoad.push("pages/signup");
}

scriptsToLoad.forEach((name) => {
  const script = document.createElement("script");
  script.async = false;
  script.src = `js/${name}.js`;
  document.head.appendChild(script);
});

document.addEventListener('DOMContentLoaded', function() {

    const cityBtn = document.getElementById('citySelect');
    if (cityBtn) {
        cityBtn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            this.classList.toggle('open');
        });
    }

});

function updateQty(id, change) {
    const display = document.getElementById(id);
    let val = parseInt(display.innerText);
    if (val + change >= 0) {
        display.innerText = val + change;
    }
}

function loadSchedule(header) {
    const card = header.parentElement;
    const content = card.querySelector('.sub-content-collapsible');
    const tableBody = document.getElementById('scheduleBody');

    card.classList.toggle('active');

    if (tableBody.innerHTML.trim() !== "") return;

    let today = new Date();
    let html = "";

    for (let i = 0; i < 30; i++) {
        let d = new Date();
        d.setDate(today.getDate() + i);

        html += `
        <tr>
            <td>${d.toLocaleDateString('ar-EG')}</td>
            <td>08:00 ص</td>
            <td><span style="color: green;">مجدولة</span></td>
            <td>
                <button class="edit-btn" onclick="openEditModal('${d.toISOString().split('T')[0]}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>`;
    }

    tableBody.innerHTML = html;
}

function openEditModal(date = "") {
    const modal = document.getElementById('editModal');
    const overlay = document.getElementById('overlay');

    if (modal) modal.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';

    if (date) {
        document.getElementById('newDate').value = date;
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function saveEdit() {
    alert("تم التعديل بنجاح");
    closeEditModal();
}

document.querySelectorAll('.otp-field, .otp-digit').forEach((input, index, inputs) => {
    input.addEventListener('input', () => {
        if (input.value.length >= 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });
});



function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(p => p.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}


function driver_loadSchedule(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');

    const tableBody = document.getElementById('scheduleBody');
    if (tableBody && tableBody.innerHTML === "") {
        for (let i = 1; i <= 30; i++) {
            let row = `
                <tr>
                    <td>2026-04-${i < 10 ? '0'+i : i}</td>
                    <td>08:00 ص</td>
                    <td><span style="color: green;">مجدولة</span></td>
                    <td><button onclick="openEditModal()">تعديل</button></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    }
}


document.querySelectorAll(".otp-field").forEach((input,index,inputs)=>{

    input.addEventListener("input",()=>{

        input.value=input.value.replace(/\D/g,'');

        if(input.value && index<inputs.length-1){
            inputs[index+1].focus();
        }

    });

    input.addEventListener("keydown",(e)=>{

        if(
            e.key==="Backspace" &&
            !input.value &&
            index>0
        ){
            inputs[index-1].focus();
        }

    });

});

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  
  if (!token) return;

  const links = document.querySelectorAll("a");

  links.forEach(link => {
    const href = link.getAttribute("href");

    if (href && (href.includes("driver") || href.includes("admin")) && !href.includes("?token=")) {
      
      link.addEventListener("click", (e) => {
        e.preventDefault();
        
        window.location.href = `${href}?token=${token}`;
      });
    }
  });
});