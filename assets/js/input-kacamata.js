let productList = [];
let editingProductId = null;
let deletingProductId = null;

document.addEventListener("DOMContentLoaded", function () {
  initInputKacamataPage();
});

/**
 * Initialize Input Kacamata Page
 */
function initInputKacamataPage() {
  let session = getSession();
  if (!session) {
    session = USERS[0]; // BM001 - Budi Santoso (Branch Manager)
    setSession(session);
  }

  // Only Branch Manager can access this page
  setupSidebarForInput(session);
  populateUserInfo(session);
  setupLogout();
  updateDate();

  // Load products from localStorage or use defaults
  loadProducts();

  // Render table
  renderProductTable(productList);
  updateStats();

  // Setup events
  setupFormEvents();
  setupTableEvents();
  setupModalEvents();
  setupToggleForm();
}

/**
 * Setup sidebar based on role
 */
function setupSidebarForInput(session) {
  const navDashboard = document.querySelector(".js-nav-dashboard");
  const managerMenus = document.querySelector(".js-manager-menus");
  const sidebarRole = document.querySelector(".js-sidebar-role");
  const headerBadge = document.querySelector(".js-header-badge");

  if (session.role === "manager") {
    if (navDashboard) navDashboard.href = "dashboard-manager.html";
    if (managerMenus) managerMenus.style.display = "block";
    if (sidebarRole) sidebarRole.textContent = "Branch Manager";
    if (headerBadge) {
      headerBadge.textContent = "Branch Manager";
      headerBadge.className = "header-badge badge-manager";
    }
  } else {
    if (navDashboard) navDashboard.href = "dashboard-kasir.html";
    if (managerMenus) managerMenus.style.display = "none";
    if (sidebarRole) sidebarRole.textContent = "Karyawan / Kasir";
    if (headerBadge) {
      headerBadge.textContent = "Karyawan";
      headerBadge.className = "header-badge badge-kasir";
    }
  }
}

/**
 * Load products from localStorage or defaults
 */
function loadProducts() {
  const stored = localStorage.getItem("pos_products");
  if (stored) {
    productList = JSON.parse(stored);
  } else {
    productList = JSON.parse(JSON.stringify(PRODUCTS));
    saveProducts();
  }
}

/**
 * Save products to localStorage
 */
function saveProducts() {
  localStorage.setItem("pos_products", JSON.stringify(productList));
}

/**
 * Generate new product ID
 */
function generateProductId() {
  const maxNum = productList.reduce((max, p) => {
    const num = parseInt(p.id.replace("PRD", "")) || 0;
    return num > max ? num : max;
  }, 0);
  return "PRD" + String(maxNum + 1).padStart(3, "0");
}

/**
 * Update stats cards
 */
function updateStats() {
  const totalProducts = document.getElementById("totalProducts");
  const totalCategories = document.getElementById("totalCategories");
  const lowStockCount = document.getElementById("lowStockCount");
  const totalValue = document.getElementById("totalValue");

  if (totalProducts) totalProducts.textContent = productList.length;

  if (totalCategories) {
    const cats = new Set(productList.map((p) => p.kategori));
    totalCategories.textContent = cats.size;
  }

  if (lowStockCount) {
    const low = productList.filter((p) => p.stok <= 5).length;
    lowStockCount.textContent = low;
  }

  if (totalValue) {
    const value = productList.reduce((sum, p) => sum + p.harga * p.stok, 0);
    totalValue.textContent = formatRupiah(value);
  }
}

/**
 * Render product table
 */
function renderProductTable(products) {
  const tbody = document.getElementById("productTableBody");
  const tableInfo = document.getElementById("tableInfo");

  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:40px;color:var(--text-light);">
          Tidak ada produk ditemukan
        </td>
      </tr>`;
    if (tableInfo) tableInfo.textContent = "Menampilkan 0 produk";
    return;
  }

  tbody.innerHTML = products
    .map(
      (p, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${p.id}</strong></td>
      <td>
        <div style="font-weight:600;">${p.nama}</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${p.deskripsi || "-"}</div>
      </td>
      <td><span class="status-badge status-selesai" style="background:#EBF8FF;color:#2B6CB0;">${p.kategori}</span></td>
      <td>${p.merek}</td>
      <td>${p.ukuranLensa || "-"}</td>
      <td style="font-weight:600;">${formatRupiah(p.harga)}</td>
      <td>
        <span class="stock-badge ${getStockClass(p.stok)}">
          ${p.stok} ${p.stok <= 5 ? "⚠️" : ""}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="openEditModal('${p.id}')" title="Edit">✏️</button>
          <button class="btn-delete" onclick="openDeleteModal('${p.id}')" title="Hapus">🗑️</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  if (tableInfo) tableInfo.textContent = `Menampilkan ${products.length} dari ${productList.length} produk`;
}

/**
 * Get stock CSS class
 */
function getStockClass(stok) {
  if (stok <= 0) return "stock-empty";
  if (stok <= 5) return "stock-low";
  return "stock-ok";
}

/**
 * Setup form events
 */
function setupFormEvents() {
  const form = document.getElementById("productForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nama = document.getElementById("inputNama").value.trim();
    const merek = document.getElementById("inputMerek").value.trim();
    const kategori = document.getElementById("inputKategori").value;
    const ukuran = document.getElementById("inputUkuran").value.trim() || "-";
    const harga = parseInt(document.getElementById("inputHarga").value) || 0;
    const stok = parseInt(document.getElementById("inputStok").value) || 0;
    const deskripsi = document.getElementById("inputDeskripsi").value.trim();

    if (!nama || !merek || !kategori || harga <= 0) {
      showToast("❌", "Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    const newProduct = {
      id: generateProductId(),
      nama: nama,
      kategori: kategori,
      merek: merek,
      harga: harga,
      stok: stok,
      ukuranLensa: ukuran,
      deskripsi: deskripsi,
    };

    productList.push(newProduct);
    saveProducts();

    // Reset form
    form.reset();

    // Re-render
    filterAndRender();
    updateStats();

    showToast("✅", `Produk "${nama}" berhasil ditambahkan!`);
  });
}

/**
 * Setup table search & filter events
 */
function setupTableEvents() {
  const searchInput = document.getElementById("searchTable");
  const filterSelect = document.getElementById("filterCategory");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterAndRender();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", function () {
      filterAndRender();
    });
  }
}

/**
 * Filter and render table
 */
function filterAndRender() {
  const searchVal = (document.getElementById("searchTable").value || "").toLowerCase();
  const catVal = document.getElementById("filterCategory").value;

  let filtered = productList.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(searchVal) ||
      p.merek.toLowerCase().includes(searchVal) ||
      p.id.toLowerCase().includes(searchVal);
    const matchCat = catVal === "all" || p.kategori === catVal;
    return matchSearch && matchCat;
  });

  renderProductTable(filtered);
}

/**
 * Toggle form visibility
 */
function setupToggleForm() {
  const btn = document.getElementById("btnToggleForm");
  const formBody = document.getElementById("formBody");
  const toggleIcon = document.getElementById("toggleIcon");

  if (btn && formBody) {
    btn.addEventListener("click", function () {
      formBody.classList.toggle("collapsed");
      if (toggleIcon) {
        toggleIcon.textContent = formBody.classList.contains("collapsed") ? "▶" : "▼";
      }
    });
  }
}

/**
 * Setup modal events
 */
function setupModalEvents() {
  // Edit modal
  const btnCloseEdit = document.getElementById("btnCloseEdit");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const btnSaveEdit = document.getElementById("btnSaveEdit");

  if (btnCloseEdit) btnCloseEdit.addEventListener("click", closeEditModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener("click", closeEditModal);
  if (btnSaveEdit) btnSaveEdit.addEventListener("click", saveEditProduct);

  // Delete modal
  const btnCloseDelete = document.getElementById("btnCloseDelete");
  const btnCancelDelete = document.getElementById("btnCancelDelete");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");

  if (btnCloseDelete) btnCloseDelete.addEventListener("click", closeDeleteModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener("click", closeDeleteModal);
  if (btnConfirmDelete) btnConfirmDelete.addEventListener("click", confirmDeleteProduct);
}

/**
 * Open edit modal
 */
function openEditModal(productId) {
  const product = productList.find((p) => p.id === productId);
  if (!product) return;

  editingProductId = productId;

  document.getElementById("editId").value = product.id;
  document.getElementById("editNama").value = product.nama;
  document.getElementById("editMerek").value = product.merek;
  document.getElementById("editKategori").value = product.kategori;
  document.getElementById("editUkuran").value = product.ukuranLensa || "";
  document.getElementById("editHarga").value = product.harga;
  document.getElementById("editStok").value = product.stok;
  document.getElementById("editDeskripsi").value = product.deskripsi || "";

  document.getElementById("editModal").classList.add("show");
}

/**
 * Close edit modal
 */
function closeEditModal() {
  document.getElementById("editModal").classList.remove("show");
  editingProductId = null;
}

/**
 * Save edited product
 */
function saveEditProduct() {
  if (!editingProductId) return;

  const product = productList.find((p) => p.id === editingProductId);
  if (!product) return;

  const nama = document.getElementById("editNama").value.trim();
  const merek = document.getElementById("editMerek").value.trim();
  const kategori = document.getElementById("editKategori").value;
  const ukuran = document.getElementById("editUkuran").value.trim() || "-";
  const harga = parseInt(document.getElementById("editHarga").value) || 0;
  const stok = parseInt(document.getElementById("editStok").value) || 0;
  const deskripsi = document.getElementById("editDeskripsi").value.trim();

  if (!nama || !merek || !kategori || harga <= 0) {
    showToast("❌", "Mohon lengkapi semua field yang wajib diisi!");
    return;
  }

  product.nama = nama;
  product.merek = merek;
  product.kategori = kategori;
  product.ukuranLensa = ukuran;
  product.harga = harga;
  product.stok = stok;
  product.deskripsi = deskripsi;

  saveProducts();
  closeEditModal();
  filterAndRender();
  updateStats();

  showToast("✅", `Produk "${nama}" berhasil diperbarui!`);
}

/**
 * Open delete modal
 */
function openDeleteModal(productId) {
  const product = productList.find((p) => p.id === productId);
  if (!product) return;

  deletingProductId = productId;
  document.getElementById("deleteProductName").textContent = product.nama;
  document.getElementById("deleteModal").classList.add("show");
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("show");
  deletingProductId = null;
}

/**
 * Confirm delete product
 */
function confirmDeleteProduct() {
  if (!deletingProductId) return;

  const product = productList.find((p) => p.id === deletingProductId);
  const nama = product ? product.nama : "";

  productList = productList.filter((p) => p.id !== deletingProductId);
  saveProducts();
  closeDeleteModal();
  filterAndRender();
  updateStats();

  showToast("🗑️", `Produk "${nama}" berhasil dihapus!`);
}

/**
 * Show toast notification
 */
function showToast(icon, message) {
  const toast = document.getElementById("toast");
  const toastIcon = document.getElementById("toastIcon");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast) return;

  if (toastIcon) toastIcon.textContent = icon;
  if (toastMessage) toastMessage.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
