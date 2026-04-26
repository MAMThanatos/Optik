document.addEventListener("DOMContentLoaded", function () {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Hanya Branch Manager yang boleh akses
  if (session.role !== "manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  // Load and Render Users
  let usersData = [];
  const searchInput = document.getElementById("searchKaryawan");

  async function loadUsers() {
    try {
      const response = await fetch("../api/get_karyawan.php");
      const result = await response.json();
      if (result.status === "success") {
        usersData = result.data;
        renderTable();
      } else {
        alert("Gagal memuat data: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    }
  }

  function renderTable() {
    const tbody = document.getElementById("karyawanTableBody");
    const query = searchInput.value.toLowerCase();

    let filtered = (Array.isArray(usersData) ? usersData : []).filter(u => {
      const nama = u.nama || "";
      const id = u.id || "";
      return nama.toLowerCase().includes(query) || id.toLowerCase().includes(query);
    });

    tbody.innerHTML = "";
    filtered.forEach(u => {
      const tr = document.createElement("tr");
      
      let roleBadge = u.role === "manager" 
        ? '<span class="role-badge role-manager">Branch Manager</span>'
        : '<span class="role-badge role-kasir">Kasir</span>';

      // Hide password for security visually
      const pwd = u.password || "";
      let maskedPassword = "•".repeat(pwd.length);

      tr.innerHTML = `
        <td>${u.id}</td>
        <td style="font-weight: 500;">${u.nama}</td>
        <td>${roleBadge}</td>
        <td>${maskedPassword}</td>
        <td>
          <button class="action-btn" title="Edit" onclick="editKaryawan('${u.id}')">✏️</button>
          ${u.id !== session.id ? `<button class="action-btn" title="Hapus" onclick="confirmDeleteKaryawan('${u.id}', '${u.nama}')">🗑️</button>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("karyawanInfo").textContent = `Menampilkan ${filtered.length} karyawan`;
  }

  searchInput.addEventListener("input", renderTable);
  loadUsers();

  // --- Modal Logic ---
  const modal = document.getElementById("karyawanModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnCancelModal = document.getElementById("btnCancelModal");
  const form = document.getElementById("karyawanForm");
  
  const formMode = document.getElementById("formMode");
  const originalId = document.getElementById("originalId");
  const inputId = document.getElementById("inputId");
  const inputNama = document.getElementById("inputNama");
  const inputPassword = document.getElementById("inputPassword");
  const modalTitle = document.getElementById("modalTitle");

  window.openModalAddKaryawan = function() {
    try {
      if (!modal) throw new Error("Modal element not found");
      if (!form) throw new Error("Form element not found");
      
      formMode.value = "add";
      originalId.value = "";
      form.reset();
      inputId.readOnly = false;
      modalTitle.textContent = "➕ Tambah Karyawan";
      modal.classList.add("show");
    } catch (e) {
      alert("Terjadi kesalahan saat membuka form: " + e.message);
      console.error(e);
    }
  };

  // Keep this just in case, but rely on onclick mainly.
  const btnTambah = document.getElementById("btnTambahKaryawan");
  if(btnTambah) {
    btnTambah.addEventListener("click", window.openModalAddKaryawan);
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

  // Global Edit Function
  window.editKaryawan = function(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) return;

    formMode.value = "edit";
    originalId.value = user.id;
    inputId.value = user.id;
    inputId.readOnly = true; // prevent changing ID on edit
    inputNama.value = user.nama;
    inputPassword.value = user.password;
    
    modalTitle.textContent = "✏️ Edit Karyawan";
    modal.classList.add("show");
  };

  // Save Employee
  document.getElementById("btnSaveKaryawan").addEventListener("click", async (e) => {
    e.preventDefault();
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const mode = formMode.value;
    const newId = inputId.value.trim(); // Username
    
    try {
      const response = await fetch("../api/simpan_karyawan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode,
          id: newId,
          original_id: originalId.value,
          nama: inputNama.value.trim(),
          password: inputPassword.value.trim(),
          role: "karyawan" // Selalu jadikan karyawan by default
        })
      });

      const result = await response.json();

      if (result.status === "success") {
        showToast(result.message);
        closeAndResetModal();
        loadUsers(); // Reload dari database
      } else {
        alert("Gagal: " + result.message);
      }
    } catch(err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat menyimpan data.");
    }
  });

  // --- Delete Logic ---
  const deleteModal = document.getElementById("deleteModal");
  const deleteKaryawanId = document.getElementById("deleteKaryawanId");
  const deleteKaryawanName = document.getElementById("deleteKaryawanName");
  const btnCloseDelete = document.getElementById("btnCloseDelete");
  const btnCancelDelete = document.getElementById("btnCancelDelete");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");

  window.confirmDeleteKaryawan = function(id, nama) {
    deleteKaryawanId.value = id;
    deleteKaryawanName.textContent = nama;
    deleteModal.classList.add("show");
  };

  function closeDeleteModal() {
    deleteModal.classList.remove("show");
  }

  btnCloseDelete.addEventListener("click", closeDeleteModal);
  btnCancelDelete.addEventListener("click", closeDeleteModal);

  btnConfirmDelete.addEventListener("click", async () => {
    const targetId = deleteKaryawanId.value;
    
    try {
      const response = await fetch("../api/hapus_karyawan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId })
      });
      
      const result = await response.json();
      
      if (result.status === "success") {
        showToast(result.message);
        closeDeleteModal();
        loadUsers(); // Reload dari database
      } else {
        alert("Gagal: " + result.message);
      }
    } catch(err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat menghapus data.");
    }
  });

  // --- Toast Notification ---
  function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");
    if (toast && toastMsg) {
      toastMsg.textContent = message;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }
  }

});
