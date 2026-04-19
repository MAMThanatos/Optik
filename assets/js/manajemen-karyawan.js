document.addEventListener("DOMContentLoaded", function () {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Hanya Branch Manager yang boleh akses
  if (session.role !== "branch_manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  // Load and Render Users
  let usersData = getUsers();
  const searchInput = document.getElementById("searchKaryawan");

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
      
      let roleBadge = u.role === "branch_manager" 
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
  renderTable();

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
  document.getElementById("btnSaveKaryawan").addEventListener("click", (e) => {
    e.preventDefault();
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const mode = formMode.value;
    const newId = inputId.value.trim();
    
    if (mode === "add") {
      // Check if ID exists
      if (usersData.some(u => u.id === newId)) {
        alert("ID Karyawan sudah terdaftar! Silakan gunakan ID lain.");
        return;
      }
      
      const newUser = {
        id: newId,
        nama: inputNama.value.trim(),
        password: inputPassword.value.trim(),
        role: "karyawan"
      };
      
      usersData.push(newUser);
      saveUsers(usersData);
      showToast("Karyawan berhasil ditambahkan!");
      
    } else if (mode === "edit") {
      const targetId = originalId.value;
      const userIndex = usersData.findIndex(u => u.id === targetId);
      
      if (userIndex !== -1) {
        usersData[userIndex].nama = inputNama.value.trim();
        usersData[userIndex].password = inputPassword.value.trim();
        
        saveUsers(usersData);
        showToast("Data karyawan berhasil diperbarui!");
        
        // If editing own profile, update session
        if (targetId === session.id) {
          setSession(usersData[userIndex]);
          // Optionally update UI elements directly
          document.querySelector(".js-user-name").textContent = usersData[userIndex].nama;
        }
      }
    }

    closeAndResetModal();
    renderTable();
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

  btnConfirmDelete.addEventListener("click", () => {
    const targetId = deleteKaryawanId.value;
    usersData = usersData.filter(u => u.id !== targetId);
    saveUsers(usersData);
    
    closeDeleteModal();
    renderTable();
    showToast("Karyawan berhasil dihapus!");
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
