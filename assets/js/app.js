document.addEventListener("DOMContentLoaded", async function () {
  await fetchSession();
  initApp();
});

// State variables for Pelunasan DP
let activePelunasanTxId = null;
let activePelunasanTotal = 0;
let activePelunasanDP = 0;
let activePelunasanSisa = 0;
let selectedPelunasanMethod = "tunai";
let selectedPelunasanBank = null;

function initApp() {
  // Sync pengaturan dari server agar struk kasir selalu update
  syncStoreProfile();

  const path = window.location.pathname;

  if (path.includes("login.html")) {
    initLoginPage();
  } else if (
    path.includes("dashboard-manager.html") || 
    path.includes("manajemen-karyawan.html") || 
    path.includes("input-kacamata.html") ||
    path.includes("laporan-penjualan.html") ||
    path.includes("laporan-keuangan.html") ||
    path.includes("pengaturan.html")
  ) {
    initDashboard("manager");
  } else if (path.includes("dashboard-kasir.html")) {
    initDashboard("karyawan");
  } else if (path.includes("cek-stok.html") || path.includes("kasir.html") || path.includes("data-pelanggan.html")) {
    const session = getSession();
    if (session) {
      initDashboard(session.role);
    } else {
      window.location.href = "login.html";
    }
  }

  // Setup modal pelunasan jika ada di halaman
  if (document.getElementById("pelunasanModal")) {
    setupPelunasanModal();
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

  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (togglePasswordBtn && passwordInput) {
    const eyeIcon = togglePasswordBtn.querySelector(".eye-icon");
    const eyeOffIcon = togglePasswordBtn.querySelector(".eye-off-icon");

    togglePasswordBtn.addEventListener("click", function () {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.style.display = "none";
        eyeOffIcon.style.display = "block";
      } else {
        passwordInput.type = "password";
        eyeIcon.style.display = "block";
        eyeOffIcon.style.display = "none";
      }
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!userId || !password) {
      showError(errorEl, "Mohon isi Username dan Password.");
      return;
    }

    try {
      const response = await fetch("../api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: userId,
          password: password
        })
      });

      const result = await response.json();

      if (result.status === "success") {
        setSession(result.data);

        if (result.data.role === "manager") {
          window.location.href = "dashboard-manager.html";
        } else {
          window.location.href = "dashboard-kasir.html";
        }
      } else {
        showError(errorEl, result.message || "Username atau Password salah.");
      }
    } catch (error) {
      console.error(error);
      showError(errorEl, "Terjadi kesalahan koneksi ke server.");
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
    if (session.role === "manager") {
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

  if (window.location.pathname.includes("dashboard")) {
    fetchDashboardData(session);
  } else {
    animateStats();
  }

  const managerMenus = document.querySelectorAll(".js-manager-menus");
  const managerOnlyNavs = document.querySelectorAll(".js-manager-only");
  
  if (session.role === "manager") {
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
      user.role === "manager" ? "Branch Manager" : "Karyawan / Kasir";
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
    logoutBtn.addEventListener("click", async function () {
      await clearSession();
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

/**
 * Sinkronisasi Profil Toko dari Database
 */
async function syncStoreProfile() {
  try {
    const response = await fetch("../api/get_pengaturan.php");
    const result = await response.json();
    if (result.status === "success" && result.data) {
      saveStoreProfile(result.data);
    }
  } catch (error) {
    console.error("Gagal sinkronisasi profil toko:", error);
  }
}

/**
 * Fetch dashboard data from API
 */
async function fetchDashboardData(session) {
  try {
    const response = await fetch("../api/get_dashboard_stats.php");
    const result = await response.json();
    if (result.status === "success") {
      const data = result.data;
      
      // Update stat cards data-target attributes
      const cards = [
        { label: "Penjualan Hari Ini", target: data.penjualan_hari_ini },
        { label: "Transaksi Hari Ini", target: data.transaksi_hari_ini },
        { label: "Stok Kacamata", target: data.stok_kacamata },
        { label: "Karyawan Aktif", target: data.karyawan_aktif },
        { label: "Stok Menipis", target: data.stok_menipis },
        { label: "Total Stok", target: data.stok_kacamata } // for kasir
      ];

      const statLabels = document.querySelectorAll(".stat-label");
      statLabels.forEach(labelEl => {
        const text = labelEl.textContent.trim();
        const cardMatch = cards.find(c => c.label === text);
        if (cardMatch) {
          const valueEl = labelEl.parentElement.querySelector(".stat-value");
          if (valueEl) {
            valueEl.setAttribute("data-target", cardMatch.target);
          }
        }
      });

      // Update recent transactions table
      const tbody = document.getElementById("recentTransactionsTable");
      if (tbody) {
        if (data.transaksi_terbaru.length === 0) {
          const colSpan = session.role === "manager" ? 6 : 5;
          tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 20px; color: #718096;">Belum ada transaksi</td></tr>`;
        } else {
          tbody.innerHTML = data.transaksi_terbaru.map(tx => {
            if (session.role === "manager") {
              return `
                <tr>
                  <td style="font-family:monospace;font-weight:600;">${tx.id}</td>
                  <td>${tx.pelanggan || "-"}</td>
                  <td>${tx.produk_contoh || "-"}</td>
                  <td style="font-weight:600;">${formatRupiah(parseFloat(tx.total))}</td>
                  <td>${tx.kasirNama}</td>
                  <td>
                    <span class="status-badge ${tx.status === 'Sudah Diambil' || tx.status === 'Selesai' || !tx.status ? 'success' : 'warning'}">${tx.status || 'Sudah Diambil'}</span>
                    ${tx.status === 'Diproses' ? `<button class="btn-lunas-dp" onclick="lunasinDP('${tx.id}', ${parseFloat(tx.total)})" style="margin-left: 8px; padding: 4px 8px; font-size: 11px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight:600; transition: background 0.2s;" onmouseover="this.style.background='#2b6cb0'" onmouseout="this.style.background='#3182ce'">Pelunasan</button>` : ''}
                  </td>
                </tr>
              `;
            } else {
              return `
                <tr>
                  <td style="font-family:monospace;font-weight:600;">${tx.id}</td>
                  <td>${tx.pelanggan || "-"}</td>
                  <td>${tx.produk_contoh || "-"}</td>
                  <td style="font-weight:600;">${formatRupiah(parseFloat(tx.total))}</td>
                  <td>
                    <span class="status-badge ${tx.status === 'Sudah Diambil' || tx.status === 'Selesai' || !tx.status ? 'success' : 'warning'}">${tx.status || 'Sudah Diambil'}</span>
                    ${tx.status === 'Diproses' ? `<button class="btn-lunas-dp" onclick="lunasinDP('${tx.id}', ${parseFloat(tx.total)})" style="margin-left: 8px; padding: 4px 8px; font-size: 11px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight:600; transition: background 0.2s;" onmouseover="this.style.background='#2b6cb0'" onmouseout="this.style.background='#3182ce'">Pelunasan</button>` : ''}
                  </td>
                </tr>
              `;
            }
          }).join("");
        }
      }

      animateStats();
    }
  } catch (error) {
    console.error("Gagal memuat dashboard:", error);
    animateStats();
  }
}

window.lunasinDP = async function(txId, total) {
  try {
    const txRes = await fetch("../api/get_transaksi.php");
    const txData = await txRes.json();
    if (txData.status === "success") {
      const tx = txData.data.find(t => t.id === txId);
      if (tx) {
        // Set state variables
        activePelunasanTxId = tx.id;
        activePelunasanTotal = parseFloat(tx.total);
        activePelunasanDP = parseFloat(tx.uang_muka);
        activePelunasanSisa = activePelunasanTotal - activePelunasanDP;

        // Update modal info
        document.getElementById("pModalInvoice").textContent = tx.id;
        document.getElementById("pModalPelanggan").textContent = tx.pelanggan || "-";
        document.getElementById("pModalTotal").textContent = formatRupiah(activePelunasanTotal);
        document.getElementById("pModalDP").textContent = formatRupiah(activePelunasanDP);
        document.getElementById("pModalSisa").textContent = formatRupiah(activePelunasanSisa);

        // Reset modal fields to default state
        if (window.resetPelunasanModal) {
          window.resetPelunasanModal();
        }

        // Show the Pelunasan Modal
        document.getElementById("pelunasanModal").classList.add("show");
      } else {
        alert("Transaksi tidak ditemukan.");
      }
    } else {
      alert("Gagal mengambil detail transaksi dari database.");
    }
  } catch (err) {
    console.error("Gagal membuka modul pelunasan:", err);
    alert("Terjadi kesalahan jaringan saat memuat detail transaksi.");
  }
};

function setupPelunasanModal() {
  const modal = document.getElementById("pelunasanModal");
  const btnClose = document.getElementById("btnClosePelunasanModal");
  const btnCancel = document.getElementById("btnCancelPelunasanModal");
  const btnConfirm = document.getElementById("btnConfirmPelunasan");
  const cashInput = document.getElementById("pCashInput");

  if (!modal) return;

  // Close handlers
  const closeModal = () => {
    modal.classList.remove("show");
  };
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  // Method Selection
  const methodBtns = {
    tunai: document.getElementById("pMethodTunai"),
    transfer: document.getElementById("pMethodTransfer"),
    qris: document.getElementById("pMethodQris"),
    kartu: document.getElementById("pMethodKartu")
  };

  const sections = {
    tunai: document.getElementById("pTunaiSection"),
    transfer: document.getElementById("pTransferSection"),
    qris: document.getElementById("pQrisSection"),
    kartu: document.getElementById("pKartuSection")
  };

  const selectMethod = (methodId) => {
    selectedPelunasanMethod = methodId;
    selectedPelunasanBank = null;

    // Toggle button active classes
    Object.keys(methodBtns).forEach(key => {
      if (methodBtns[key]) {
        methodBtns[key].classList.toggle("selected", key === methodId);
      }
    });

    // Show/hide sections
    Object.keys(sections).forEach(key => {
      if (sections[key]) {
        sections[key].style.display = key === methodId ? "block" : "none";
      }
    });

    // Reset inputs/classes inside transfer bank options
    const bankBtns = document.querySelectorAll(".bank-options .bank-btn");
    bankBtns.forEach(b => b.classList.remove("selected"));

    validatePelunasan();
  };

  Object.keys(methodBtns).forEach(key => {
    if (methodBtns[key]) {
      methodBtns[key].addEventListener("click", () => selectMethod(key));
    }
  });

  // Bank Selection
  const bankBtns = document.querySelectorAll(".bank-options .bank-btn");
  bankBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      bankBtns.forEach(b => b.classList.remove("selected"));
      this.classList.add("selected");
      selectedPelunasanBank = this.getAttribute("data-pbank");
      validatePelunasan();
    });
  });

  // Cash Input listener
  if (cashInput) {
    cashInput.addEventListener("input", function() {
      const cashValue = parseFloat(this.value) || 0;
      const kembalianRow = document.getElementById("pKembalianRow");
      const kembalianAmount = document.getElementById("pKembalianAmount");

      if (cashValue > 0) {
        if (kembalianRow) kembalianRow.style.display = "flex";
        const kembalian = cashValue - activePelunasanSisa;

        if (kembalian >= 0) {
          if (kembalianAmount) {
            kembalianAmount.textContent = formatRupiah(kembalian);
            kembalianAmount.style.color = "#38a169";
          }
          if (kembalianRow) {
            kembalianRow.classList.remove("kurang");
            kembalianRow.style.background = "#f0fff4";
            kembalianRow.style.borderColor = "#c6f6d5";
          }
        } else {
          if (kembalianAmount) {
            kembalianAmount.textContent = "Kurang " + formatRupiah(Math.abs(kembalian));
            kembalianAmount.style.color = "#e53e3e";
          }
          if (kembalianRow) {
            kembalianRow.classList.add("kurang");
            kembalianRow.style.background = "#fff5f5";
            kembalianRow.style.borderColor = "#fed7d7";
          }
        }
      } else {
        if (kembalianRow) kembalianRow.style.display = "none";
      }
      validatePelunasan();
    });
  }

  // Validation function
  const validatePelunasan = () => {
    let valid = false;

    if (selectedPelunasanMethod === "tunai") {
      const cashVal = parseFloat(cashInput.value) || 0;
      valid = cashVal >= activePelunasanSisa;
    } else if (selectedPelunasanMethod === "transfer") {
      valid = selectedPelunasanBank !== null;
    } else if (selectedPelunasanMethod === "qris" || selectedPelunasanMethod === "kartu") {
      valid = true;
    }

    if (btnConfirm) btnConfirm.disabled = !valid;
  };

  // Expose reset/select method for opening trigger
  window.resetPelunasanModal = () => {
    selectMethod("tunai");
    if (cashInput) cashInput.value = "";
    const kembalianRow = document.getElementById("pKembalianRow");
    if (kembalianRow) kembalianRow.style.display = "none";
  };

  // Submit Handler
  if (btnConfirm) {
    btnConfirm.addEventListener("click", async function() {
      btnConfirm.disabled = true;
      btnConfirm.textContent = "Memproses...";

      let finalMetode = selectedPelunasanMethod.toUpperCase();
      if (selectedPelunasanMethod === "transfer" && selectedPelunasanBank) {
        finalMetode += " - " + selectedPelunasanBank;
      }

      const cashValue = selectedPelunasanMethod === "tunai" ? (parseFloat(cashInput.value) || 0) : activePelunasanSisa;
      const kembalian = selectedPelunasanMethod === "tunai" ? (cashValue - activePelunasanSisa) : 0;

      try {
        const response = await fetch("../api/pelunasan_transaksi.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_transaksi: activePelunasanTxId,
            metode_pembayaran: finalMetode,
            uang_diterima: cashValue,
            kembalian: kembalian
          })
        });

        const result = await response.json();

        if (result.status === "success") {
          alert("Pembayaran sisa tagihan berhasil dilunasi! Struk kuitansi pelunasan final LUNAS dicetak otomatis.");
          
          // Print Receipt
          await printSettlementReceipt(activePelunasanTxId, finalMetode, cashValue, kembalian);

          // Close modal and reload page
          modal.classList.remove("show");
          location.reload();
        } else {
          alert("Gagal melakukan pelunasan: " + result.message);
          btnConfirm.disabled = false;
          btnConfirm.textContent = "✅ Konfirmasi & Cetak Struk";
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan jaringan saat memproses pelunasan.");
        btnConfirm.disabled = false;
        btnConfirm.textContent = "✅ Konfirmasi & Cetak Struk";
      }
    });
  }
}

async function printSettlementReceipt(txId, pelunasanMethod, pelunasanDiterima, pelunasanKembalian) {
  try {
    const txRes = await fetch("../api/get_transaksi.php");
    const txData = await txRes.json();
    if (txData.status === "success") {
      const tx = txData.data.find(t => t.id === txId);
      if (tx) {
        const profile = getStoreProfile();
        // Parse dates safely
        const dateObj = new Date(tx.tanggal.includes(" ") ? tx.tanggal.replace(" ", "T") : tx.tanggal);
        const dateStr = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

        const itemsHtml = tx.items.map(item => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${item.nama}</span>
            <span>Rp ${item.harga.toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #555; font-size: 13px;">
            <span>${item.qty} x Rp ${item.harga.toLocaleString("id-ID")}</span>
            <span></span>
          </div>
        `).join("");

        let resepHtml = "";
        if (tx.od_sph || tx.od_cyl || tx.od_axis || tx.os_sph || tx.os_cyl || tx.os_axis || tx.pd || tx.addisi) {
          resepHtml = `
            <div style="margin: 15px 0; padding: 10px; border: 1px dashed #000; border-radius: 4px; font-size: 12px;">
              <div style="font-weight: bold; margin-bottom: 5px; text-align: center;">🕶️ REKAM MEDIS / RESEP KACAMATA</div>
              <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px;">
                <thead>
                  <tr style="border-bottom: 1px solid #000; font-weight: bold;">
                    <th>MATA</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px dashed #000;">
                    <td style="text-align: left; padding: 4px 0;">Kanan (OD)</td>
                    <td>${tx.od_sph || "-"}</td>
                    <td>${tx.od_cyl || "-"}</td>
                    <td>${tx.od_axis || "-"}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 4px 0;">Kiri (OS)</td>
                    <td>${tx.os_sph || "-"}</td>
                    <td>${tx.os_cyl || "-"}</td>
                    <td>${tx.os_axis || "-"}</td>
                  </tr>
                </tbody>
              </table>
              <div style="display: flex; gap: 15px; margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px;">
                <div>PD: <strong>${tx.pd || "-"}</strong></div>
                <div>ADD: <strong>${tx.addisi || "-"}</strong></div>
              </div>
            </div>
          `;
        }

        const totalTagihan = parseFloat(tx.total);
        const subtotal = parseFloat(tx.subtotal || totalTagihan);
        const diskon = parseFloat(tx.diskonNominal || 0);
        
        const dpPaid = activePelunasanDP; 
        const sisaPaid = activePelunasanSisa;

        const printWindow = window.open("", "_blank", "width=600,height=700");
        printWindow.document.write(`
          <html>
            <head>
              <title>Struk Bukti Pelunasan - ${tx.id}</title>
              <style>
                body {
                  font-family: 'Courier New', Courier, monospace;
                  font-size: 14px;
                  color: #000;
                  padding: 20px;
                  max-width: 450px;
                  margin: 0 auto;
                }
                .text-center { text-align: center; }
                .hr-dashed { border-top: 1px dashed #000; margin: 10px 0; }
                .flex-between { display: flex; justify-content: space-between; }
                .section-title { font-weight: bold; margin-top: 12px; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <div class="text-center">
                <h3 style="margin: 0;">${profile.nama}</h3>
                <p style="margin: 3px 0; font-size: 12px;">${profile.alamat}</p>
                <p style="margin: 3px 0; font-size: 12px;">Telp: ${profile.telepon}</p>
              </div>

              <div class="hr-dashed"></div>

              <div style="font-size: 12px; line-height: 1.4;">
                <div class="flex-between"><span>No. Invoice</span><span>${tx.id}</span></div>
                <div class="flex-between"><span>Tanggal Transaksi</span><span>${dateStr} ${timeStr}</span></div>
                <div class="flex-between"><span>Kasir</span><span>${tx.kasirNama}</span></div>
                <div class="flex-between"><span>Pelanggan</span><span>${tx.pelanggan || '-'}</span></div>
                <div class="flex-between"><span>Status Pembayaran</span><span style="font-weight:bold; color:green;">LUNAS (Selesai)</span></div>
              </div>

              <div class="hr-dashed"></div>
              
              <div class="section-title">RINCIAN PRODUK</div>
              <div>${itemsHtml}</div>

              ${resepHtml}

              <div class="hr-dashed"></div>

              <div style="line-height: 1.4;">
                <div class="flex-between"><span>Subtotal</span><span>Rp ${subtotal.toLocaleString("id-ID")}</span></div>
                ${diskon > 0 ? `<div class="flex-between"><span>Diskon</span><span>-Rp ${diskon.toLocaleString("id-ID")}</span></div>` : ""}
                <div class="flex-between" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px;">
                  <span>TOTAL BELANJA</span>
                  <span>Rp ${totalTagihan.toLocaleString("id-ID")}</span>
                </div>

                <div class="section-title" style="margin-top:8px;">RIWAYAT PEMBAYARAN</div>
                <div class="flex-between" style="color: #555;">
                  <span>1. Uang Muka (DP) Terbayar</span>
                  <span>Rp ${dpPaid.toLocaleString("id-ID")}</span>
                </div>
                <div class="flex-between" style="font-weight: bold; color: #000; margin-top: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
                  <span>2. Pelunasan Sisa Tagihan</span>
                  <span>Rp ${sisaPaid.toLocaleString("id-ID")}</span>
                </div>

                <div class="flex-between" style="font-size: 12px; color: #444; margin-top: 6px;">
                  <span>Metode Pelunasan</span>
                  <span>${pelunasanMethod}</span>
                </div>
                <div class="flex-between" style="font-size: 12px; color: #444;">
                  <span>Bayar</span>
                  <span>Rp ${pelunasanDiterima.toLocaleString("id-ID")}</span>
                </div>
                <div class="flex-between" style="font-size: 12px; color: #444;">
                  <span>Kembalian</span>
                  <span>Rp ${pelunasanKembalian.toLocaleString("id-ID")}</span>
                </div>

                <div class="text-center" style="font-weight: bold; color: green; margin-top: 15px; border: 2px solid green; padding: 6px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
                  ** LUNAS / SUDAH DIAMBIL **
                </div>
              </div>

              <div class="hr-dashed"></div>

              <div class="text-center" style="font-size: 12px; margin-top: 20px;">
                <p>${profile.pesan_struk.replace(/\n/g, "<br>")}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  } catch (err) {
    console.error("Gagal cetak struk pelunasan:", err);
  }
}
