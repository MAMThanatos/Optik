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
  const searchInput = document.getElementById("searchTx");
  const tbody = document.getElementById("salesTableBody");
  let transactions = [];

  async function loadTransactions() {
    try {
      const response = await fetch("../api/get_transaksi.php");
      const result = await response.json();
      if (result.status === "success") {
        transactions = result.data;
      } else {
        console.error("Gagal memuat transaksi:", result.message);
        alert("Gagal memuat transaksi dari server.");
      }
    } catch (e) {
      console.error("Kesalahan jaringan:", e);
      alert("Terjadi kesalahan jaringan saat memuat transaksi.");
    }
    renderReport();
  }

  function renderReport() {
    const filterVal = timeFilter.value;
    const searchVal = searchInput.value.toLowerCase();
    const now = new Date();
    
    let salesEvents = [];

    transactions.forEach(tx => {
      // Kasus 1: Transaksi DP yang Sudah Lunas
      if (tx.statusPesanan === 'Sudah Diambil' && tx.nominal_dp > 0) {
        // Event 1: DP paid on tx.tanggal
        const dpAmt = tx.nominal_dp;
        let metodeDP = tx.metodePembayaran;
        if (tx.metodePembayaran.includes(" / ")) {
          metodeDP = tx.metodePembayaran.split(" / ")[0];
        }
        salesEvents.push({
          tanggal: tx.tanggal,
          id: tx.id + "-DP",
          baseId: tx.id,
          kasirNama: tx.kasirNama,
          items: tx.items,
          metode: metodeDP,
          nominal: dpAmt,
          tipe: "DP"
        });

        // Event 2: Pelunasan paid on tx.tanggal_pelunasan
        if (tx.tanggal_pelunasan) {
          const pelunasanAmt = tx.total - tx.nominal_dp;
          let metodeLunas = tx.metodePembayaran;
          if (tx.metodePembayaran.includes(" / ")) {
            metodeLunas = tx.metodePembayaran.split(" / ")[1].replace(" (Lunas)", "");
          }
          salesEvents.push({
            tanggal: tx.tanggal_pelunasan,
            id: tx.id + "-LUNAS",
            baseId: tx.id,
            kasirNama: tx.kasirNama,
            items: tx.items,
            metode: metodeLunas,
            nominal: pelunasanAmt,
            tipe: "Pelunasan"
          });
        }
      }
      // Kasus 2: Transaksi DP yang Masih Diproses (Belum Lunas)
      else if (tx.statusPesanan === 'Diproses') {
        const dpAmt = tx.uangMuka;
        salesEvents.push({
          tanggal: tx.tanggal,
          id: tx.id + "-DP",
          baseId: tx.id,
          kasirNama: tx.kasirNama,
          items: tx.items,
          metode: tx.metodePembayaran,
          nominal: dpAmt,
          tipe: "DP"
        });
      }
      // Kasus 3: Transaksi Lunas Biasa (Tanpa DP)
      else {
        salesEvents.push({
          tanggal: tx.tanggal,
          id: tx.id,
          baseId: tx.id,
          kasirNama: tx.kasirNama,
          items: tx.items,
          metode: tx.metodePembayaran,
          nominal: tx.total,
          tipe: "Lunas"
        });
      }
    });

    // Filter berdasarkan Periode Waktu
    let filteredEvents = salesEvents.filter(ev => {
      const cleanDateStr = ev.tanggal.includes(" ") ? ev.tanggal.replace(" ", "T") : ev.tanggal;
      const txDate = new Date(cleanDateStr);
      
      if (filterVal === "today") {
        return txDate.getDate() === now.getDate() &&
               txDate.getMonth() === now.getMonth() &&
               txDate.getFullYear() === now.getFullYear();
      } else if (filterVal === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        weekAgo.setHours(0,0,0,0);
        return txDate >= weekAgo && txDate <= now;
      } else if (filterVal === "month") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Filter berdasarkan kolom pencarian
    if (searchVal) {
      filteredEvents = filteredEvents.filter(ev => 
        ev.baseId.toLowerCase().includes(searchVal) || 
        ev.kasirNama.toLowerCase().includes(searchVal)
      );
    }

    // Urutkan berdasarkan tanggal terbaru
    filteredEvents.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    let totalPendapatan = 0;
    let totalItem = 0;
    
    tbody.innerHTML = "";

    if (filteredEvents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">Tidak ada data transaksi</td></tr>`;
    } else {
      filteredEvents.forEach(ev => {
        totalPendapatan += ev.nominal;
        
        let itemHtml = "";
        ev.items.forEach(item => {
          // Hanya hitung Qty item pada fase DP/Lunas biasa agar tidak dobel hitung saat fase Pelunasan
          if (ev.tipe !== "Pelunasan") {
            totalItem += item.qty;
          }
          itemHtml += `<div>${item.qty}x ${item.nama}</div>`;
        });

        const dateObj = new Date(ev.tanggal);
        const dateStr = dateObj.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" });

        // Labelling type bayar (DP / Lunas)
        const typeLabel = ev.tipe === "DP" 
          ? ' <span style="background:#fff3cd; color:#856404; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px; font-weight:bold; vertical-align:middle;">DP</span>' 
          : (ev.tipe === "Pelunasan" 
            ? ' <span style="background:#e6fffa; color:#319795; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px; font-weight:bold; vertical-align:middle;">PELUNASAN</span>'
            : '');

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div style="font-weight:600;">${dateStr}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">${timeStr}</div>
          </td>
          <td style="font-family:monospace;font-weight:600;">
            <a href="#" onclick="showTxDetail('${ev.baseId}'); return false;" style="color:var(--accent); text-decoration:underline; font-weight:700;">${ev.baseId}</a>${typeLabel}
          </td>
          <td>${ev.kasirNama}</td>
          <td><div class="item-list">${itemHtml}</div></td>
          <td><span class="method-badge">${ev.metode}</span></td>
          <td style="font-weight:700; color: ${ev.tipe === 'Pelunasan' ? '#319795' : 'inherit'};">${formatRupiah(ev.nominal)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.getElementById("totPendapatan").textContent = formatRupiah(totalPendapatan);
    document.getElementById("totTransaksi").textContent = filteredEvents.length.toLocaleString("id-ID");
    document.getElementById("totItemTerjual").textContent = totalItem.toLocaleString("id-ID");
    document.getElementById("salesInfo").textContent = `Menampilkan ${filteredEvents.length} transaksi`;
  }

  // ----------------------------------------------------
  // FITUR DETAIL TRANSAKSI (POP-UP STRUK & REKAM MEDIS)
  // ----------------------------------------------------
  window.showTxDetail = function(txId) {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) {
      alert("Data transaksi tidak ditemukan!");
      return;
    }

    const profile = getStoreProfile();
    const dateObj = new Date(tx.tanggal);
    const dateStr = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const content = document.getElementById("txDetailContent");
    
    // Render items list HTML
    let itemsHtml = "";
    if (tx.items && tx.items.length > 0) {
      itemsHtml = tx.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-family: monospace;">
          <span>${item.nama}</span>
          <span>${formatRupiah(item.harga * item.qty)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-family: monospace; color: #718096; font-size: 0.85rem;">
          <span>${item.qty} x ${formatRupiah(item.harga)}</span>
          <span></span>
        </div>
      `).join("");
    } else {
      itemsHtml = `<div style="text-align: center; color: #718096; font-family: monospace; padding: 10px;">Item produk tidak tercatat</div>`;
    }

    // Render prescription HTML if OD/OS details exist
    let resepHtml = "";
    if (tx.od_sph || tx.od_cyl || tx.od_axis || tx.os_sph || tx.os_cyl || tx.os_axis || tx.pd || tx.addisi) {
      resepHtml = `
        <div style="margin: 15px 0; padding: 12px; border: 1px dashed #cbd5e0; border-radius: 6px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #2d3748; display: flex; align-items: center; gap: 5px;">🕶️ Rekam Medis / Resep Kacamata</h4>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse; text-align: center;">
            <thead>
              <tr style="border-bottom: 1px solid #cbd5e0; color: #718096; font-weight: 600;">
                <th>MATA</th>
                <th>SPH</th>
                <th>CYL</th>
                <th>AXIS</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #edf2f7;">
                <td style="font-weight: 600; color: #4a5568; text-align: left; padding: 6px 0;">Kanan (OD)</td>
                <td>${tx.od_sph || "-"}</td>
                <td>${tx.od_cyl || "-"}</td>
                <td>${tx.od_axis || "-"}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; color: #4a5568; text-align: left; padding: 6px 0;">Kiri (OS)</td>
                <td>${tx.os_sph || "-"}</td>
                <td>${tx.os_cyl || "-"}</td>
                <td>${tx.os_axis || "-"}</td>
              </tr>
            </tbody>
          </table>
          <div style="display: flex; gap: 20px; margin-top: 10px; font-size: 11px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-weight: 500;">
            <div><span style="color:#718096;">PD:</span> <strong>${tx.pd || "-"}</strong></div>
            <div><span style="color:#718096;">ADD:</span> <strong>${tx.addisi || "-"}</strong></div>
          </div>
        </div>
      `;
    }

    // Render total tagihan details
    const totalTagihan = parseFloat(tx.total);
    const subtotal = parseFloat(tx.subtotal || totalTagihan);
    const diskon = parseFloat(tx.diskonNominal || 0);
    const uangMuka = parseFloat(tx.uangMuka || totalTagihan);
    const sisaTagihan = totalTagihan - uangMuka;
    
    let dpSectionHtml = "";
    if (sisaTagihan > 0 || tx.statusPesanan === "Diproses") {
      dpSectionHtml = `
        <div style="display: flex; justify-content: space-between; font-family: monospace; margin-top: 4px;">
          <span>Uang Muka (DP)</span>
          <span>${formatRupiah(uangMuka)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-family: monospace; color: red; font-weight: bold; margin-top: 4px;">
          <span>Sisa Tagihan</span>
          <span>${formatRupiah(sisaTagihan)}</span>
        </div>
      `;
    }

    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; font-family: monospace;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700;">${profile.nama || 'Optik Lucky Prastica'}</h3>
        <p style="margin: 3px 0; font-size: 11px; color: #718096;">${profile.alamat || '-'}</p>
        <p style="margin: 3px 0; font-size: 11px; color: #718096;">Telp: ${profile.telepon || '-'}</p>
      </div>

      <div style="border-top: 1px dashed #cbd5e0; border-bottom: 1px dashed #cbd5e0; padding: 10px 0; margin-bottom: 15px; font-size: 12px; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>No. Invoice</span><span>${tx.id}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Tanggal</span><span>${dateStr} ${timeStr}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Kasir</span><span>${tx.kasirNama || '-'}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Pelanggan</span><span>${tx.pelanggan || '-'}</span></div>
        <div style="display: flex; justify-content: space-between;">
          <span>Status</span>
          <span style="font-weight: 600; color: ${tx.statusPesanan === 'Diproses' ? 'orange' : 'green'};">${tx.statusPesanan}</span>
        </div>
      </div>

      <!-- Items List -->
      <div>
        ${itemsHtml}
      </div>

      <!-- Prescription Resep -->
      ${resepHtml}

      <!-- Totals Section -->
      <div style="border-top: 1px dashed #cbd5e0; padding-top: 10px; margin-top: 15px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; font-family: monospace;">
          <span>Subtotal</span>
          <span>${formatRupiah(subtotal)}</span>
        </div>
        ${diskon > 0 ? `
          <div style="display: flex; justify-content: space-between; font-family: monospace; color: #319795; margin-top: 4px;">
            <span>Diskon</span>
            <span>-${formatRupiah(diskon)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-family: monospace; font-weight: bold; margin-top: 4px; padding-top: 4px; border-top: 1px solid #edf2f7; font-size: 13px;">
          <span>Total Belanja</span>
          <span>${formatRupiah(totalTagihan)}</span>
        </div>
        ${dpSectionHtml}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e0;"></div>
        <div style="display: flex; justify-content: space-between; font-family: monospace; margin-top: 4px;">
          <span>Dibayar (${tx.metodePembayaran || '-'})</span>
          <span>${formatRupiah(parseFloat(tx.uangDiterima || 0))}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-family: monospace; margin-top: 4px;">
          <span>Kembalian</span>
          <span>${formatRupiah(parseFloat(tx.kembalian || 0))}</span>
        </div>
      </div>
    `;

    document.getElementById("txDetailModal").classList.add("show");
  };

  const txDetailModal = document.getElementById("txDetailModal");
  const closeTxDetailBtn = document.getElementById("btnCloseTxDetail");
  const closeTxDetailBtnBottom = document.getElementById("btnCloseTxDetailBottom");
  
  const hideTxDetailModal = () => txDetailModal.classList.remove("show");
  if(closeTxDetailBtn) closeTxDetailBtn.addEventListener("click", hideTxDetailModal);
  if(closeTxDetailBtnBottom) closeTxDetailBtnBottom.addEventListener("click", hideTxDetailModal);

  timeFilter.addEventListener("change", renderReport);
  searchInput.addEventListener("input", renderReport);

  loadTransactions();
});
