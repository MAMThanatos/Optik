// assets/js/data-pelanggan.js

document.addEventListener("DOMContentLoaded", async function () {
  await fetchSession();
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Sidebar role management
  const sidebarRole = document.querySelector(".js-sidebar-role");
  const headerBadge = document.querySelector(".js-header-badge");
  const navDashboard = document.querySelector(".js-nav-dashboard");
  const managerMenus = document.querySelector(".js-manager-menus");
  const managerOnlyLinks = document.querySelectorAll(".js-manager-only");

  if (session.role === "manager") {
    if (sidebarRole) sidebarRole.textContent = "Branch Manager";
    if (headerBadge) {
      headerBadge.textContent = "Branch Manager";
      headerBadge.className = "header-badge badge-manager js-header-badge";
    }
    if (navDashboard) navDashboard.href = "dashboard-manager.html";
    if (managerMenus) managerMenus.style.display = "block";
  } else {
    if (sidebarRole) sidebarRole.textContent = "Kasir";
    if (headerBadge) {
      headerBadge.textContent = "Kasir";
      headerBadge.className = "header-badge badge-kasir js-header-badge";
    }
    if (navDashboard) navDashboard.href = "dashboard-kasir.html";
    if (managerMenus) managerMenus.style.display = "none";
    managerOnlyLinks.forEach(link => link.style.display = "none");
  }

  let pelangganData = [];
  const searchInput = document.getElementById("searchPelanggan");

  async function loadCustomers() {
    try {
      const response = await fetch("../api/get_pelanggan.php");
      const result = await response.json();
      if (result.status === "success") {
        pelangganData = result.data;
        renderTable();
      } else {
        alert("Gagal memuat data pelanggan: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    }
  }

  function renderTable() {
    const tbody = document.getElementById("pelangganTableBody");
    const query = searchInput.value.toLowerCase().trim();

    let filtered = (Array.isArray(pelangganData) ? pelangganData : []).filter(p => {
      const nama = p.nama || "";
      const hp = p.no_hp || "";
      const idStr = "PLG" + String(p.id).padStart(3, "0");
      return nama.toLowerCase().includes(query) || hp.toLowerCase().includes(query) || idStr.toLowerCase().includes(query);
    });

    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:30px;color:#a0aec0;">
            Tidak ada data pelanggan ditemukan.
          </td>
        </tr>`;
      document.getElementById("pelangganInfo").textContent = "Menampilkan 0 pelanggan";
      return;
    }

    filtered.forEach((p, idx) => {
      const tr = document.createElement("tr");
      const padId = "PLG" + String(p.id).padStart(3, "0");
      
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${padId}</strong></td>
        <td style="font-weight: 500;">${p.nama}</td>
        <td>${p.no_hp}</td>
        <td>${p.alamat}</td>
        <td style="font-size:13px;color:#718096;">${p.tanggal_daftar}</td>
        <td>
          <button class="action-btn" title="Edit" onclick="editPelanggan(${p.id})">✏️</button>
          <button class="action-btn" title="Hapus" onclick="confirmDeletePelanggan(${p.id}, '${p.nama}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("pelangganInfo").textContent = `Menampilkan ${filtered.length} dari ${pelangganData.length} pelanggan`;
  }

  searchInput.addEventListener("input", renderTable);
  loadCustomers();

  // Modals elements
  const modal = document.getElementById("pelangganModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnCancelModal = document.getElementById("btnCancelModal");
  const form = document.getElementById("pelangganForm");
  
  const formMode = document.getElementById("formMode");
  const originalId = document.getElementById("originalId");
  const inputNama = document.getElementById("inputNama");
  const inputNoHP = document.getElementById("inputNoHP");
  const inputAlamat = document.getElementById("inputAlamat");
  const modalTitle = document.getElementById("modalTitle");

  // Open modal for adding
  const btnTambah = document.getElementById("btnTambahPelanggan");
  if (btnTambah) {
    btnTambah.addEventListener("click", function() {
      formMode.value = "add";
      originalId.value = "";
      form.reset();
      modalTitle.textContent = "➕ Tambah Pelanggan";
      modal.classList.add("show");
    });
  }

  function closeAndResetModal() {
    modal.classList.remove("show");
    form.reset();
  }

  btnCloseModal.addEventListener("click", closeAndResetModal);
  btnCancelModal.addEventListener("click", (e) => {
    e.preventDefault();
    closeAndResetModal();
  });

  // Edit Customer
  window.editPelanggan = function(id) {
    const p = pelangganData.find(item => item.id === id);
    if (!p) return;

    formMode.value = "edit";
    originalId.value = p.id;
    inputNama.value = p.nama;
    inputNoHP.value = p.no_hp === "-" ? "" : p.no_hp;
    inputAlamat.value = p.alamat === "-" ? "" : p.alamat;
    
    modalTitle.textContent = "✏️ Edit Pelanggan";
    modal.classList.add("show");
  };

  // Save Customer (Add/Edit)
  document.getElementById("btnSavePelanggan").addEventListener("click", async (e) => {
    e.preventDefault();
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const mode = formMode.value;
    const namaVal = inputNama.value.trim();
    const hpVal = inputNoHP.value.trim();
    const alamatVal = inputAlamat.value.trim();
    
    try {
      const response = await fetch("../api/simpan_pelanggan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode,
          id: originalId.value,
          nama: namaVal,
          no_hp: hpVal,
          alamat: alamatVal
        })
      });

      const result = await response.json();

      if (result.status === "success") {
        showToast("✅", result.message);
        closeAndResetModal();
        loadCustomers();
      } else {
        alert("Gagal: " + result.message);
      }
    } catch(err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat menyimpan data.");
    }
  });

  // Delete Customer logic
  const deleteModal = document.getElementById("deleteModal");
  const deletePelangganId = document.getElementById("deletePelangganId");
  const deletePelangganName = document.getElementById("deletePelangganName");
  const btnCloseDelete = document.getElementById("btnCloseDelete");
  const btnCancelDelete = document.getElementById("btnCancelDelete");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");

  window.confirmDeletePelanggan = function(id, nama) {
    deletePelangganId.value = id;
    deletePelangganName.textContent = nama;
    deleteModal.classList.add("show");
  };

  function closeDeleteModal() {
    deleteModal.classList.remove("show");
  }

  btnCloseDelete.addEventListener("click", closeDeleteModal);
  btnCancelDelete.addEventListener("click", closeDeleteModal);

  btnConfirmDelete.addEventListener("click", async () => {
    const targetId = deletePelangganId.value;
    
    try {
      const response = await fetch("../api/hapus_pelanggan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId })
      });
      
      const result = await response.json();
      
      if (result.status === "success") {
        showToast("✅", result.message);
        closeDeleteModal();
        loadCustomers();
      } else {
        alert("Gagal: " + result.message);
      }
    } catch(err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat menghapus data.");
    }
  });

  function showToast(icon, message) {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastMsg = document.getElementById("toastMessage");
    if (toast && toastMsg && toastIcon) {
      toastIcon.textContent = icon;
      toastMsg.textContent = message;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }
  }
});
