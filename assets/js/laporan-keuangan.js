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

    filteredTxs.forEach(tx => {
      totalPendapatan += tx.total;
      
      // Hitung HPP (Harga Pokok Penjualan)
      let hpp = 0;
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach(item => {
          // Jika ada harga_beli di history, pakai itu. Jika tidak, gunakan margin 40% (HPP 60%) sebagai fallback untuk data lama.
          let hb = item.harga_beli !== undefined ? item.harga_beli : (item.harga * 0.6);
          hpp += (hb * item.qty);
        });
      } else {
        hpp = tx.total * 0.6;
      }
      
      totalLabaKotor += (tx.total - hpp); 
    });

    let filteredExps = expenses.filter(ex => isDateMatch(ex.tanggal, filterVal));
    
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

    document.getElementById("expenseInfo").textContent = `Menampilkan ${filteredExps.length} catatan pengeluaran`;
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
