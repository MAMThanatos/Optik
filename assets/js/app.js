document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

function initApp() {
  const path = window.location.pathname;

  if (path.includes("login.html")) {
    initLoginPage();
  } else if (
    path.includes("dashboard-manager.html") || 
    path.includes("manajemen-karyawan.html") || 
    path.includes("input-kacamata.html") ||
    path.includes("laporan-penjualan.html")
  ) {
    initDashboard("branch_manager");
  } else if (path.includes("dashboard-kasir.html")) {
    initDashboard("karyawan");
  } else if (path.includes("cek-stok.html") || path.includes("kasir.html")) {
    const session = getSession();
    if (session) {
      initDashboard(session.role);
    } else {
      window.location.href = "login.html";
    }
  }
}

/**
 * Halaman Login
 */
function initLoginPage() {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");

  if (!form) return;

  clearSession();

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const userId = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!userId || !password) {
      showError(errorEl, "Mohon isi ID dan Password.");
      return;
    }

    const user = authenticateUser(userId, password);

    if (user) {
      setSession(user);

      // Redirect based on role
      if (user.role === "branch_manager") {
        window.location.href = "dashboard-manager.html";
      } else {
        window.location.href = "dashboard-kasir.html";
      }
    } else {
      showError(errorEl, "ID atau Password salah. Silakan coba lagi.");
    }
  });
}

/**
 * Dashboard
 * @param {string} expectedRole
 */
function initDashboard(expectedRole) {
  const session = getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  if (session.role !== expectedRole) {
    if (session.role === "branch_manager") {
      window.location.href = "dashboard-manager.html";
    } else {
      window.location.href = "dashboard-kasir.html";
    }
    return;
  }

  populateUserInfo(session);

  setActiveNav();

  setupLogout();

  updateDate();

  animateStats();

  // Role-based menu visibility
  const managerMenus = document.querySelectorAll(".js-manager-menus");
  const managerOnlyNavs = document.querySelectorAll(".js-manager-only");
  
  if (session.role === "branch_manager") {
    managerMenus.forEach(el => el.style.display = "block");
    managerOnlyNavs.forEach(el => el.style.display = "flex");
  } else {
    managerMenus.forEach(el => el.style.display = "none");
    managerOnlyNavs.forEach(el => el.style.display = "none");
  }
}

/**
 * @param {object} user - User data
 */
function populateUserInfo(user) {
  const nameEls = document.querySelectorAll(".js-user-name");
  const roleEls = document.querySelectorAll(".js-user-role");
  const avatarEls = document.querySelectorAll(".js-user-avatar");
  const welcomeEl = document.querySelector(".js-welcome-name");
  const cabangEl = document.querySelector(".js-cabang");

  const initials = user.nama
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  nameEls.forEach((el) => (el.textContent = user.nama));
  roleEls.forEach((el) => {
    el.textContent =
      user.role === "branch_manager" ? "Branch Manager" : "Karyawan / Kasir";
  });
  avatarEls.forEach((el) => (el.textContent = initials));

  if (welcomeEl) welcomeEl.textContent = user.nama;
  if (cabangEl) cabangEl.textContent = user.cabang;
}

/**
 * Set active navigation item
 */
function setActiveNav() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      navItems.forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

/**
 * Tombol Logout
 */
function setupLogout() {
  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      clearSession();
      window.location.href = "login.html";
    });
  }
}

/**
 * Update tanggal hari ini di dashboard
 */
function updateDate() {
  const dateEl = document.querySelector(".js-date");
  if (dateEl) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const today = new Date().toLocaleDateString("id-ID", options);
    dateEl.textContent = today;
  }
}

/**
 * Animasi angka pada statistik
 */
function animateStats() {
  const statValues = document.querySelectorAll(".stat-value[data-target]");
  statValues.forEach((el) => {
    const target = parseInt(el.getAttribute("data-target"));
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";
    let current = 0;
    const increment = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = prefix + current.toLocaleString("id-ID") + suffix;
    }, 30);
  });
}

/**
 * Menampilkan pesan error sementara
 * @param {HTMLElement} el - Error element
 * @param {string} message - Error message
 */
function showError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => {
    el.classList.remove("show");
  }, 4000);
}