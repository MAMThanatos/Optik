document.addEventListener("DOMContentLoaded", function () {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Hanya Branch Manager yang boleh akses (opsional, disesuaikan)
  if (session.role !== "manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  // DOM Elements
  const timeFilter = document.getElementById("timeFilter");
  const searchInput = document.getElementById("searchTx");
  const tbody = document.getElementById("salesTableBody");
  
  // Data
  let transactions = getTransactions();

  function renderReport() {
    const filterVal = timeFilter.value;
    const searchVal = searchInput.value.toLowerCase();
    const now = new Date();
    
    // Filter by Date
    let filteredTxs = transactions.filter(tx => {
      const txDate = new Date(tx.tanggal);
      if (filterVal === "today") {
        return txDate.toDateString() === now.toDateString();
      } else if (filterVal === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo && txDate <= now;
      } else if (filterVal === "month") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true; // "all"
    });

    // Filter by Search
    if (searchVal) {
      filteredTxs = filteredTxs.filter(tx => 
        tx.id.toLowerCase().includes(searchVal) || 
        tx.kasirNama.toLowerCase().includes(searchVal)
      );
    }

    // Sort by date (newest first)
    filteredTxs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    // Calculate Stats
    let totalPendapatan = 0;
    let totalItem = 0;
    
    tbody.innerHTML = "";

    if (filteredTxs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">Tidak ada data transaksi</td></tr>`;
    } else {
      filteredTxs.forEach(tx => {
        totalPendapatan += tx.total;
        
        // Item breakdown
        let itemHtml = "";
        let txItemsCount = 0;
        
        tx.items.forEach(item => {
          totalItem += item.qty;
          txItemsCount += item.qty;
          itemHtml += `<div>${item.qty}x ${item.nama}</div>`;
        });

        // Date format
        const dateObj = new Date(tx.tanggal);
        const dateStr = dateObj.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" });

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div style="font-weight:600;">${dateStr}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">${timeStr}</div>
          </td>
          <td style="font-family:monospace;font-weight:600;">${tx.id}</td>
          <td>${tx.kasirNama}</td>
          <td><div class="item-list">${itemHtml}</div></td>
          <td><span class="method-badge">${tx.metodePembayaran}</span></td>
          <td style="font-weight:700;">${formatRupiah(tx.total)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Update Summary Cards
    document.getElementById("totPendapatan").textContent = formatRupiah(totalPendapatan);
    document.getElementById("totTransaksi").textContent = filteredTxs.length.toLocaleString("id-ID");
    document.getElementById("totItemTerjual").textContent = totalItem.toLocaleString("id-ID");
    document.getElementById("salesInfo").textContent = `Menampilkan ${filteredTxs.length} transaksi`;
  }

  // Event Listeners
  timeFilter.addEventListener("change", renderReport);
  searchInput.addEventListener("input", renderReport);

  // Initial Render
  renderReport();
});
