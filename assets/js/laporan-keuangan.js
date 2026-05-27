document.addEventListener("DOMContentLoaded", async function () {
  await fetchSession();
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  if (session.role !== "manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  const timeFilter = document.getElementById("timeFilter");
  const tbody = document.getElementById("expenseTableBody");
  let transactions = [];
  let expenses = [];

  async function loadData() {
    try {
      const response = await fetch("../api/get_transaksi.php");
      const result = await response.json();
      if (result.status === "success") {
        transactions = result.data;
      } else {
        alert("Gagal memuat transaksi dari server.");
      }
    } catch (e) {
      console.error("Kesalahan jaringan:", e);
      alert("Terjadi kesalahan jaringan saat memuat transaksi.");
    }
    
    try {
      const expResponse = await fetch("../api/get_pengeluaran.php");
      const expResult = await expResponse.json();
      if (expResult.status === "success") {
        expenses = expResult.data;
      } else {
        alert("Gagal memuat pengeluaran dari server.");
      }
    } catch(e) {
      console.error("Gagal load pengeluaran", e);
      alert("Terjadi kesalahan jaringan saat memuat pengeluaran.");
    }

    renderReport();
  }

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
    return true;
  }

  function renderReport() {
    const filterVal = timeFilter.value;
    
    let filteredTxs = transactions.filter(tx => isDateMatch(tx.tanggal, filterVal));
    
    let totalPendapatan = 0;
    let totalLabaKotor = 0;
    let ledger = [];

    filteredTxs.forEach(tx => {
      totalPendapatan += tx.total;
      
      // Hitung HPP (Harga Pokok Penjualan)
      let hpp = 0;
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach(item => {
          let hb = item.harga_beli !== undefined ? item.harga_beli : (item.harga * 0.6);
          hpp += (hb * item.qty);
        });
      } else {
        hpp = tx.total * 0.6;
      }
      
      totalLabaKotor += (tx.total - hpp); 

      // Tambahkan Pemasukan ke ledger
      ledger.push({
        tanggal: tx.tanggal,
        id: tx.id,
        tipe: 'Pemasukan',
        kategori: 'Penjualan',
        keterangan: tx.pelanggan ? `Penjualan kacamata ke ${tx.pelanggan}` : 'Penjualan Kacamata',
        operator: tx.kasirNama || '-',
        nominal: tx.total,
        bisaDihapus: false
      });
    });

    let filteredExps = expenses.filter(ex => isDateMatch(ex.tanggal, filterVal));
    let totalPengeluaran = 0;

    filteredExps.forEach(ex => {
      totalPengeluaran += ex.nominal;

      // Tambahkan Pengeluaran ke ledger
      ledger.push({
        tanggal: ex.tanggal,
        id: ex.id,
        tipe: 'Pengeluaran',
        kategori: ex.kategori,
        keterangan: ex.keterangan || '-',
        operator: ex.kasirNama || '-',
        nominal: ex.nominal,
        bisaDihapus: true
      });
    });

    // Urutkan ledger berdasarkan tanggal descending
    ledger.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    tbody.innerHTML = "";

    if (ledger.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#6b7280;">Belum ada catatan keuangan</td></tr>`;
    } else {
      ledger.forEach(item => {
        const dateObj = new Date(item.tanggal);
        const dateStr = dateObj.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" });

        const tr = document.createElement("tr");
        
        // CSS inline styles for premium look
        const badgeStyle = item.tipe === 'Pemasukan' 
          ? 'background: #e6fffa; color: #319795; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block;'
          : 'background: #fff5f5; color: #e53e3e; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block;';

        const nominalStyle = item.tipe === 'Pemasukan' 
          ? 'color: #319795; font-weight: 700;' 
          : 'color: #e53e3e; font-weight: 700;';

        const nominalSign = item.tipe === 'Pemasukan' ? '+ ' : '- ';

        tr.innerHTML = `
          <td>
            <div style="font-weight:600;">${dateStr}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${timeStr}</div>
          </td>
          <td style="font-family:monospace;font-weight:600;">${item.id}</td>
          <td><span style="${badgeStyle}">${item.tipe}</span></td>
          <td style="font-weight:600;">${item.kategori}</td>
          <td>${item.keterangan}</td>
          <td>${item.operator}</td>
          <td style="${nominalStyle}">${nominalSign}${formatRupiah(item.nominal)}</td>
          <td>
            ${item.bisaDihapus ? `<button class="action-btn" title="Hapus" onclick="deleteExpense('${item.id}')">🗑️</button>` : '-'}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    const labaBersih = totalLabaKotor - totalPengeluaran;

    document.getElementById("totPendapatan").textContent = formatRupiah(totalPendapatan);
    document.getElementById("totLabaKotor").textContent = formatRupiah(totalLabaKotor);
    document.getElementById("totPengeluaran").textContent = formatRupiah(totalPengeluaran);
    
    const labaBersihEl = document.getElementById("totLabaBersih");
    labaBersihEl.textContent = formatRupiah(labaBersih);
    
    if (labaBersih < 0) {
      labaBersihEl.style.color = "var(--danger)";
    } else {
      labaBersihEl.style.color = "var(--success)";
    }

    document.getElementById("expenseInfo").textContent = `Menampilkan ${ledger.length} catatan keuangan`;
  }

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

  document.getElementById("btnSaveExpense").addEventListener("click", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const btn = document.getElementById("btnSaveExpense");
    btn.disabled = true;
    btn.textContent = "Menyimpan...";

    const newExpense = {
      id: "EXP-" + Date.now(),
      tanggal: new Date().toISOString(),
      kategori: document.getElementById("expCategory").value,
      nominal: parseInt(document.getElementById("expNominal").value),
      keterangan: document.getElementById("expDesc").value,
      kasirId: session.id,
      kasirNama: session.nama
    };

    try {
      const response = await fetch("../api/simpan_pengeluaran.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense)
      });
      const result = await response.json();
      if (result.status === "success") {
        closeModal();
        loadData(); // reload all data
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat menyimpan pengeluaran.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Simpan";
    }
  });

  window.deleteExpense = async function(id) {
    if(confirm("Hapus catatan pengeluaran ini?")) {
      try {
        const response = await fetch("../api/hapus_pengeluaran.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if (result.status === "success") {
          loadData();
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat menghapus pengeluaran.");
      }
    }
  }

  timeFilter.addEventListener("change", renderReport);

  loadData();
});
