/**
 * Sistem Kasir
 */

let cart = [];
let selectedPaymentMethod = null;
let selectedBank = null;

document.addEventListener("DOMContentLoaded", function () {
  initKasirPage();
});

/**
 * Initialize Kasir Page
 */
function initKasirPage() {
  let session = getSession();
  if (!session) {
    // Auto-set demo session for preview
    session = USERS[2]; // KR001 - Andi Pratama (Karyawan)
    setSession(session);
  }

  // Setup sidebar based on role
  setupSidebarRole(session);

  // Populate user info
  populateUserInfo(session);
  setupLogout();
  updateDate();

  // Render products
  renderProducts(PRODUCTS);

  // Setup search & filter
  setupSearch();
  setupCategoryFilter();

  // Setup cart events
  setupCartEvents();

  // Setup payment modal
  setupPaymentModal();
}

/**
 * Setup sidebar based on user role
 */
function setupSidebarRole(session) {
  const navDashboard = document.querySelector(".js-nav-dashboard");
  const navExtra = document.querySelector(".js-nav-extra");
  const managerMenus = document.querySelector(".js-manager-menus");
  const sidebarRole = document.querySelector(".js-sidebar-role");
  const headerBadge = document.querySelector(".js-header-badge");

  if (session.role === "branch_manager") {
    if (navDashboard) navDashboard.href = "dashboard-manager.html";
    if (navExtra) navExtra.style.display = "flex";
    if (managerMenus) managerMenus.style.display = "block";
    if (sidebarRole) sidebarRole.textContent = "Branch Manager";
    if (headerBadge) {
      headerBadge.textContent = "Branch Manager";
      headerBadge.className = "header-badge badge-manager";
    }
  } else {
    if (navDashboard) navDashboard.href = "dashboard-kasir.html";
    if (navExtra) navExtra.style.display = "none";
    if (managerMenus) managerMenus.style.display = "none";
    if (sidebarRole) sidebarRole.textContent = "Karyawan / Kasir";
    if (headerBadge) {
      headerBadge.textContent = "Karyawan";
      headerBadge.className = "header-badge badge-kasir";
    }
  }
}

/**
 * Render product cards
 */
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#718096;">Tidak ada produk ditemukan</div>';
    return;
  }

  grid.innerHTML = products
    .map(
      (p) => `
    <div class="product-card" onclick="addToCart('${p.id}')">
      <div class="add-badge">+</div>
      <div class="prod-category">${p.kategori}</div>
      <div class="prod-name">${p.nama}</div>
      <div class="prod-brand">${p.merek}</div>
      <div class="prod-price">${formatRupiah(p.harga)}</div>
      <div class="prod-stock ${p.stok <= 5 ? "low" : ""}">
        Stok: ${p.stok} ${p.stok <= 5 ? "⚠️" : ""}
      </div>
    </div>
  `
    )
    .join("");
}

/**
 * Setup search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById("searchProduct");
  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    filterProducts();
  });
}

/**
 * Setup category filter
 */
function setupCategoryFilter() {
  const catBtns = document.querySelectorAll(".cat-btn");
  catBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      catBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filterProducts();
    });
  });
}

/**
 * Filter products by search and category
 */
function filterProducts() {
  const searchVal = (
    document.getElementById("searchProduct").value || ""
  ).toLowerCase();
  const activeCat = document.querySelector(".cat-btn.active");
  const category = activeCat ? activeCat.getAttribute("data-cat") : "all";

  let filtered = PRODUCTS.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(searchVal) ||
      p.merek.toLowerCase().includes(searchVal) ||
      p.kategori.toLowerCase().includes(searchVal);
    const matchCat = category === "all" || p.kategori === category;
    return matchSearch && matchCat;
  });

  renderProducts(filtered);
}

/**
 * Add product to cart
 */
function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    if (existingItem.qty >= product.stok) {
      alert("Stok tidak mencukupi!");
      return;
    }
    existingItem.qty += 1;
  } else {
    if (product.stok <= 0) {
      alert("Stok habis!");
      return;
    }
    cart.push({
      id: product.id,
      nama: product.nama,
      harga: product.harga,
      qty: 1,
      maxStok: product.stok,
    });
  }

  renderCart();
  updateTotals();
}

/**
 * Remove item from cart
 */
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
  updateTotals();
}

/**
 * Change item quantity
 */
function changeQty(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }
  if (newQty > item.maxStok) {
    alert("Stok tidak mencukupi!");
    return;
  }

  item.qty = newQty;
  renderCart();
  updateTotals();
}

/**
 * Render cart items
 */
function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const btnPay = document.getElementById("btnPay");

  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty" id="cartEmpty">
        <span>🛒</span>
        <p>Keranjang masih kosong</p>
        <small>Klik produk untuk menambahkan</small>
      </div>`;
    if (btnPay) btnPay.disabled = true;
    return;
  }

  if (btnPay) btnPay.disabled = false;

  cartItemsEl.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nama}</div>
        <div class="cart-item-price">${formatRupiah(item.harga)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">${formatRupiah(item.harga * item.qty)}</div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>
  `
    )
    .join("");
}

/**
 * Update totals
 */
function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const discountPercent =
    parseInt(document.getElementById("discountInput").value) || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const grandTotal = subtotal - discountAmount;

  document.getElementById("subtotalAmount").textContent =
    formatRupiah(subtotal);
  document.getElementById("discountAmount").textContent =
    "- " + formatRupiah(discountAmount);
  document.getElementById("grandTotal").textContent = formatRupiah(grandTotal);
}

/**
 * Setup cart events
 */
function setupCartEvents() {
  // Clear cart
  const btnClear = document.getElementById("btnClearCart");
  if (btnClear) {
    btnClear.addEventListener("click", function () {
      if (cart.length === 0) return;
      if (confirm("Kosongkan keranjang?")) {
        cart = [];
        renderCart();
        updateTotals();
      }
    });
  }

  // Discount input
  const discountInput = document.getElementById("discountInput");
  if (discountInput) {
    discountInput.addEventListener("input", function () {
      let val = parseInt(this.value) || 0;
      if (val < 0) val = 0;
      if (val > 100) val = 100;
      this.value = val;
      updateTotals();
    });
  }
}

/**
 * Setup payment modal
 */
function setupPaymentModal() {
  const btnPay = document.getElementById("btnPay");
  const paymentModal = document.getElementById("paymentModal");
  const btnClose = document.getElementById("btnClosePayment");
  const btnCancel = document.getElementById("btnCancelPay");
  const btnConfirm = document.getElementById("btnConfirmPay");
  const receiptModal = document.getElementById("receiptModal");

  // Open payment modal
  if (btnPay) {
    btnPay.addEventListener("click", function () {
      if (cart.length === 0) return;
      openPaymentModal();
    });
  }

  // Close payment modal
  if (btnClose) {
    btnClose.addEventListener("click", closePaymentModal);
  }
  if (btnCancel) {
    btnCancel.addEventListener("click", closePaymentModal);
  }

  // Confirm payment
  if (btnConfirm) {
    btnConfirm.addEventListener("click", confirmPayment);
  }

  // Cash input
  const cashInput = document.getElementById("cashInput");
  if (cashInput) {
    cashInput.addEventListener("input", handleCashInput);
  }

  // Bank buttons
  const bankBtns = document.querySelectorAll(".bank-btn");
  bankBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      bankBtns.forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");
      selectedBank = this.getAttribute("data-bank");
      validatePayment();
    });
  });

  // Receipt actions
  const btnPrint = document.getElementById("btnPrint");
  if (btnPrint) {
    btnPrint.addEventListener("click", function () {
      window.print();
    });
  }

  const btnNewTx = document.getElementById("btnNewTransaction");
  if (btnNewTx) {
    btnNewTx.addEventListener("click", function () {
      cart = [];
      selectedPaymentMethod = null;
      selectedBank = null;
      document.getElementById("discountInput").value = 0;
      renderCart();
      updateTotals();
      if (receiptModal) receiptModal.classList.remove("show");
    });
  }
}

/**
 * Open payment modal
 */
function openPaymentModal() {
  const modal = document.getElementById("paymentModal");
  const paymentTotalEl = document.getElementById("paymentTotal");
  const methodGrid = document.getElementById("methodGrid");
  const btnConfirm = document.getElementById("btnConfirmPay");

  // Reset
  selectedPaymentMethod = null;
  selectedBank = null;
  hideAllPaymentSections();
  if (btnConfirm) btnConfirm.disabled = true;

  // Calculate total
  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const discountPercent =
    parseInt(document.getElementById("discountInput").value) || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const grandTotal = subtotal - discountAmount;

  if (paymentTotalEl) paymentTotalEl.textContent = formatRupiah(grandTotal);

  // Render payment methods
  if (methodGrid) {
    methodGrid.innerHTML = PAYMENT_METHODS.map(
      (m) => `
      <button class="method-btn" data-method="${m.id}" onclick="selectPaymentMethod('${m.id}')">
        <span class="method-icon">${m.icon}</span>
        <div class="method-name">${m.nama}</div>
        <div class="method-desc">${m.desc}</div>
      </button>
    `
    ).join("");
  }

  if (modal) modal.classList.add("show");
}

/**
 * Close payment modal
 */
function closePaymentModal() {
  const modal = document.getElementById("paymentModal");
  if (modal) modal.classList.remove("show");
}

/**
 * Select payment method
 */
function selectPaymentMethod(methodId) {
  selectedPaymentMethod = methodId;
  selectedBank = null;

  // Update button styles
  const methodBtns = document.querySelectorAll(".method-btn");
  methodBtns.forEach((btn) => {
    btn.classList.toggle(
      "selected",
      btn.getAttribute("data-method") === methodId
    );
  });

  // Show relevant section
  hideAllPaymentSections();

  if (methodId === "tunai") {
    document.getElementById("tunaiSection").style.display = "block";
    document.getElementById("cashInput").value = "";
    document.getElementById("kembalianRow").style.display = "none";
  } else if (methodId === "transfer") {
    document.getElementById("transferSection").style.display = "block";
    document.querySelectorAll(".bank-btn").forEach((b) => b.classList.remove("selected"));
  } else if (methodId === "qris") {
    document.getElementById("qrisSection").style.display = "block";
  } else if (methodId === "kartu") {
    document.getElementById("kartuSection").style.display = "block";
  }

  validatePayment();
}

/**
 * Hide all payment sections
 */
function hideAllPaymentSections() {
  const sections = ["tunaiSection", "transferSection", "qrisSection", "kartuSection"];
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

/**
 * Handle cash input
 */
function handleCashInput() {
  const cashInput = document.getElementById("cashInput");
  const kembalianRow = document.getElementById("kembalianRow");
  const kembalianAmount = document.getElementById("kembalianAmount");

  const cashValue = parseInt(cashInput.value) || 0;
  const grandTotal = getGrandTotal();

  if (cashValue > 0) {
    kembalianRow.style.display = "flex";
    const kembalian = cashValue - grandTotal;

    if (kembalian >= 0) {
      kembalianAmount.textContent = formatRupiah(kembalian);
      kembalianRow.classList.remove("kurang");
    } else {
      kembalianAmount.textContent = "Kurang " + formatRupiah(Math.abs(kembalian));
      kembalianRow.classList.add("kurang");
    }
  } else {
    kembalianRow.style.display = "none";
  }

  validatePayment();
}

/**
 * Get grand total
 */
function getGrandTotal() {
  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const discountPercent =
    parseInt(document.getElementById("discountInput").value) || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  return subtotal - discountAmount;
}

/**
 * Validate payment
 */
function validatePayment() {
  const btnConfirm = document.getElementById("btnConfirmPay");
  if (!btnConfirm) return;

  let valid = false;

  if (selectedPaymentMethod === "tunai") {
    const cashValue = parseInt(document.getElementById("cashInput").value) || 0;
    valid = cashValue >= getGrandTotal();
  } else if (selectedPaymentMethod === "transfer") {
    valid = selectedBank !== null;
  } else if (selectedPaymentMethod === "qris" || selectedPaymentMethod === "kartu") {
    valid = true;
  }

  btnConfirm.disabled = !valid;
}

/**
 * Confirm payment & show receipt
 */
function confirmPayment() {
  const session = getSession();
  const grandTotal = getGrandTotal();
  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const discountPercent =
    parseInt(document.getElementById("discountInput").value) || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));

  const invoiceNo = generateInvoice();
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const methodInfo = PAYMENT_METHODS.find(
    (m) => m.id === selectedPaymentMethod
  );
  const methodName = methodInfo ? methodInfo.nama : "-";
  const cashValue =
    selectedPaymentMethod === "tunai"
      ? parseInt(document.getElementById("cashInput").value) || 0
      : 0;
  const kembalian = selectedPaymentMethod === "tunai" ? cashValue - grandTotal : 0;

  // Build receipt
  const receiptContent = document.getElementById("receiptContent");
  if (receiptContent) {
    receiptContent.innerHTML = `
      <div class="receipt-header-section">
        <h3>OPTIK SEJAHTERA</h3>
        <p>Jl. Merdeka No. 123, Jakarta</p>
        <p>Telp: (021) 1234-5678</p>
      </div>

      <div class="receipt-info">
        <div><span>No. Invoice</span><span>${invoiceNo}</span></div>
        <div><span>Tanggal</span><span>${dateStr} ${timeStr}</span></div>
        <div><span>Kasir</span><span>${session ? session.nama : "-"}</span></div>
        <div><span>Cabang</span><span>${session ? session.cabang : "-"}</span></div>
      </div>

      <div class="receipt-items-list">
        ${cart
          .map(
            (item) => `
          <div class="receipt-item-row">
            <span>${item.nama}</span>
            <span>${formatRupiah(item.harga * item.qty)}</span>
          </div>
          <div class="receipt-item-row">
            <span class="item-detail">${item.qty} x ${formatRupiah(item.harga)}</span>
            <span></span>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="receipt-totals-section">
        <div><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
        ${
          discountPercent > 0
            ? `<div><span>Diskon (${discountPercent}%)</span><span>- ${formatRupiah(discountAmount)}</span></div>`
            : ""
        }
        <div class="receipt-grand"><span>TOTAL</span><span>${formatRupiah(grandTotal)}</span></div>
        <div><span>Pembayaran</span><span>${methodName}${selectedBank ? " (" + selectedBank + ")" : ""}</span></div>
        ${
          selectedPaymentMethod === "tunai"
            ? `
          <div><span>Tunai</span><span>${formatRupiah(cashValue)}</span></div>
          <div><span>Kembalian</span><span>${formatRupiah(kembalian)}</span></div>
        `
            : ""
        }
      </div>

      <div class="receipt-footer-section">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Garansi frame 1 tahun</p>
        <p style="margin-top:8px;">~ OptikPOS v1.0 ~</p>
      </div>
    `;
  }

  // Close payment modal, show receipt
  closePaymentModal();
  const receiptModal = document.getElementById("receiptModal");
  if (receiptModal) receiptModal.classList.add("show");
}