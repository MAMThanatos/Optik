document.addEventListener("DOMContentLoaded", function () {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Set up sidebar elements based on role
  const roleEl = document.querySelector(".js-sidebar-role");
  const badgeEl = document.querySelector(".js-header-badge");
  const dashboardLink = document.querySelector(".js-nav-dashboard");
  const inputKacamataLink = document.querySelector(".js-nav-input");
  const managerMenus = document.querySelector(".js-manager-menus");
  
  if (roleEl) roleEl.textContent = session.role === "manager" ? "Branch Manager" : "Kasir";
  if (badgeEl) {
    badgeEl.textContent = session.role === "manager" ? "Branch Manager" : "Kasir";
    badgeEl.className = `header-badge ${session.role === "manager" ? 'badge-manager' : 'badge-kasir'} js-header-badge`;
  }
  
  if (dashboardLink) {
    dashboardLink.href = session.role === "manager" ? "dashboard-manager.html" : "dashboard-kasir.html";
  }

  if (session.role !== "manager" && inputKacamataLink) {
    inputKacamataLink.style.display = "none";
  }

  if (session.role === "manager" && managerMenus) {
    managerMenus.style.display = "block";
  }

  // Load products from API
  let products = [];
  
  async function loadProducts() {
    try {
      const response = await fetch("../api/get_barang.php");
      const result = await response.json();
      if (result.status === "success") {
        products = result.data;
        renderTable();
      } else {
        console.error("Gagal memuat stok:", result.message);
      }
    } catch (e) {
      console.error("Kesalahan jaringan:", e);
    }
  }

  const searchInput = document.getElementById("searchStok");
  const filterSelect = document.getElementById("filterKategori");
  
  function renderTable() {
    const tbody = document.getElementById("stokTableBody");
    const query = searchInput.value.toLowerCase();
    const category = filterSelect.value;

    let filtered = products.filter(p => {
      const matchSearch = (p.nama || "").toLowerCase().includes(query) || (p.id || "").toLowerCase().includes(query);
      const matchCat = category === "all" || p.kategori === category;
      return matchSearch && matchCat;
    });

    tbody.innerHTML = "";
    filtered.forEach(p => {
      const tr = document.createElement("tr");
      
      let statusClass = "stock-ok";
      let statusText = "Aman";
      if (p.stok === 0) {
        statusClass = "stock-empty";
        statusText = "Habis";
      } else if (p.stok < 10) {
        statusClass = "stock-low";
        statusText = "Menipis";
      }

      tr.innerHTML = `
        <td>${p.id}</td>
        <td style="font-weight: 500;">${p.nama}</td>
        <td>${p.kategori}</td>
        <td>${p.merek}</td>
        <td>${formatRupiah(p.harga)}</td>
        <td>${p.stok}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("stokInfo").textContent = `Menampilkan ${filtered.length} produk`;

    // Update Stats
    const totalStok = products.reduce((acc, p) => acc + p.stok, 0);
    const stokMenipis = products.filter(p => p.stok < 10).length;

    document.getElementById("totalStok").textContent = totalStok;
    document.getElementById("stokMenipis").textContent = stokMenipis;
  }

  searchInput.addEventListener("input", renderTable);
  filterSelect.addEventListener("change", renderTable);

  loadProducts();
});
