document.addEventListener("DOMContentLoaded", function () {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  if (session.role !== "manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  // DOM Elements
  const timeFilter = document.getElementById("timeFilter");
  const tbody = document.getElementById("expenseTableBody");
  
  // Data
  let transactions = getTransactions();
  let expenses = getExpenses();

  // Helper to calculate date match
  function isDateMatch(dateStr, filterVal) {
    const itemDate = new Date(dateStr);
    const now = new Date();
    
    if (filterVal === "today") {
      return itemDate.toDateString() === now.toDateString();
    } else if (filterVal === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return itemDate >= weekAgo && itemDate <= now;
    } else if (filterVal === "month") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    return true; // "all"
  }

  function renderReport() {
    const filterVal = timeFilter.value;
    
    // 1. Calculate Income (Revenue & Gross Profit)
    let filteredTxs = transactions.filter(tx => isDateMatch(tx.tanggal, filterVal));
    
    let totalPendapatan = 0;
    let totalLabaKotor = 0;

    filteredTxs.forEach(tx => {
      totalPendapatan += tx.total;
      // Estimasikan Laba Kotor = 40% dari Total Pendapatan (HPP = 60%)
      totalLabaKotor += (tx.total * 0.4); 
    });

    // 2. Calculate & Render Expenses
    let filteredExps = expenses.filter(ex => isDateMatch(ex.tanggal, filterVal));
    
    // Sort expenses newest first
    filteredExps.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    let totalPengeluaran = 0;
    tbody.innerHTML = "";

    if (filteredExps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">Belum ada catatan pengeluaran</td></tr>`;
    } else {
      filteredExps.forEach(ex => {
        totalPengeluaran += ex.nominal;

        const dateObj = new Date(ex.tanggal);
        const dateStr = dateObj.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${dateStr}</td>
          <td style="font-weight:600;">${ex.kategori}</td>
          <td>${ex.keterangan || "-"}</td>
          <td>${ex.kasirNama}</td>
          <td style="font-weight:700;" class="text-danger">- ${formatRupiah(ex.nominal)}</td>
          <td>
            <button class="action-btn" title="Hapus" onclick="deleteExpense('${ex.id}')">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 3. Calculate Net Profit
    const labaBersih = totalLabaKotor - totalPengeluaran;

    // Update Summary Cards
    document.getElementById("totPendapatan").textContent = formatRupiah(totalPendapatan);
    document.getElementById("totLabaKotor").textContent = formatRupiah(totalLabaKotor);
    document.getElementById("totPengeluaran").textContent = formatRupiah(totalPengeluaran);
    
    const labaBersihEl = document.getElementById("totLabaBersih");
    labaBersihEl.textContent = formatRupiah(labaBersih);
    
    // Change color based on profit/loss
    if (labaBersih < 0) {
      labaBersihEl.style.color = "var(--danger)";
    } else {
      labaBersihEl.style.color = "var(--success)";
    }

    document.getElementById("expenseInfo").textContent = `Menampilkan ${filteredExps.length} catatan pengeluaran`;
  }

  // --- Modal Logic ---
  const modal = document.getElementById("expenseModal");
  const form = document.getElementById("expenseForm");

  document.getElementById("btnTambahPengeluaran").addEventListener("click", () => {
    form.reset();
    modal.classList.add("show");
  });

  const closeModal = () => modal.classList.remove("show");
  document.getElementById("btnCloseExpense").addEventListener("click", closeModal);
  document.getElementById("btnCancelExpense").addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  document.getElementById("btnSaveExpense").addEventListener("click", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const newExpense = {
      id: "EXP-" + Date.now(),
      tanggal: new Date().toISOString(),
      kategori: document.getElementById("expCategory").value,
      nominal: parseInt(document.getElementById("expNominal").value),
      keterangan: document.getElementById("expDesc").value,
      kasirId: session.id,
      kasirNama: session.nama
    };

    expenses.push(newExpense);
    saveExpenses(expenses);
    
    closeModal();
    renderReport();
  });

  window.deleteExpense = function(id) {
    if(confirm("Hapus catatan pengeluaran ini?")) {
      expenses = expenses.filter(e => e.id !== id);
      saveExpenses(expenses);
      renderReport();
    }
  }

  // Event Listeners
  timeFilter.addEventListener("change", renderReport);

  // Initial Render
  renderReport();
});
