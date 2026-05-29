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
    // Replace space with T to guarantee standard parsing across all browsers
    const cleanDateStr = dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr;
    const itemDate = new Date(cleanDateStr);
    const now = new Date();
    
    if (filterVal === "today") {
      // Strict local date comparison (ignores timezone offsets)
      return itemDate.getDate() === now.getDate() &&
             itemDate.getMonth() === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();
    } else if (filterVal === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      weekAgo.setHours(0,0,0,0);
      return itemDate >= weekAgo && itemDate <= now;
    } else if (filterVal === "month") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  }

  function renderReport() {
    const filterVal = timeFilter.value;
    
    // Update Kop Print Periode
    const printPeriodEl = document.getElementById("printPeriod");
    if (printPeriodEl) {
      let periodText = "Bulan Ini";
      if (filterVal === "today") periodText = "Hari Ini (" + new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) + ")";
      else if (filterVal === "week") periodText = "7 Hari Terakhir";
      else if (filterVal === "month") periodText = "Bulan Ini (" + new Date().toLocaleDateString("id-ID", { month: 'long', year: 'numeric' }) + ")";
      else if (filterVal === "all") periodText = "Semua Waktu";
      printPeriodEl.textContent = "Periode: " + periodText;
    }

    // Sync Store Name for Print Kop
    const profile = getStoreProfile();
    if (profile && profile.nama) {
      const printStoreNameEl = document.getElementById("printStoreName");
      if (printStoreNameEl) {
        printStoreNameEl.textContent = profile.nama;
      }
    }

    let totalPendapatan = 0;
    let totalLabaKotor = 0;
    let ledger = [];

    transactions.forEach(tx => {
      // Hitung HPP (Harga Pokok Penjualan) untuk hitung Laba Kotor proporsional
      let hpp = 0;
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach(item => {
          let hb = item.harga_beli !== undefined ? item.harga_beli : (item.harga * 0.6);
          hpp += (hb * item.qty);
        });
      } else {
        hpp = tx.total * 0.6;
      }
      const profitMarginRatio = tx.total > 0 ? (tx.total - hpp) / tx.total : 0.4;

      // Kasus 1: Transaksi DP yang SUDAH LUNAS (status 'Sudah Diambil' dan nominal_dp > 0)
      if (tx.statusPesanan === 'Sudah Diambil' && tx.nominal_dp > 0) {
        // Event 1: Pembayaran DP pada tanggal_waktu
        if (isDateMatch(tx.tanggal, filterVal)) {
          const dpAmt = tx.nominal_dp;
          totalPendapatan += dpAmt;
          totalLabaKotor += (dpAmt * profitMarginRatio);
          ledger.push({
            tanggal: tx.tanggal,
            id: tx.id + "-DP",
            tipe: 'Pemasukan',
            kategori: 'Penjualan (DP)',
            keterangan: tx.pelanggan ? `Pembayaran Uang Muka (DP) kacamata ke ${tx.pelanggan}` : 'Penjualan Kacamata (DP)',
            operator: tx.kasirNama || '-',
            nominal: dpAmt,
            bisaDihapus: false
          });
        }

        // Event 2: Pembayaran Pelunasan pada tanggal_pelunasan
        if (tx.tanggal_pelunasan && isDateMatch(tx.tanggal_pelunasan, filterVal)) {
          const pelunasanAmt = tx.total - tx.nominal_dp;
          totalPendapatan += pelunasanAmt;
          totalLabaKotor += (pelunasanAmt * profitMarginRatio);
          ledger.push({
            tanggal: tx.tanggal_pelunasan,
            id: tx.id + "-LUNAS",
            tipe: 'Pemasukan',
            kategori: 'Penjualan (Pelunasan)',
            keterangan: tx.pelanggan ? `Pelunasan sisa tagihan kacamata ke ${tx.pelanggan}` : 'Penjualan Kacamata (Pelunasan)',
            operator: tx.kasirNama || '-',
            nominal: pelunasanAmt,
            bisaDihapus: false
          });
        }
      }
      // Kasus 2: Transaksi DP yang MASIH PENDING / PROSES (status 'Diproses')
      else if (tx.statusPesanan === 'Diproses') {
        if (isDateMatch(tx.tanggal, filterVal)) {
          const dpAmt = tx.uangMuka;
          totalPendapatan += dpAmt;
          totalLabaKotor += (dpAmt * profitMarginRatio);
          ledger.push({
            tanggal: tx.tanggal,
            id: tx.id + "-DP",
            tipe: 'Pemasukan',
            kategori: 'Penjualan (DP)',
            keterangan: tx.pelanggan ? `Pembayaran Uang Muka (DP) kacamata ke ${tx.pelanggan}` : 'Penjualan Kacamata (DP)',
            operator: tx.kasirNama || '-',
            nominal: dpAmt,
            bisaDihapus: false
          });
        }
      }
      // Kasus 3: Transaksi Lunas Biasa (Tanpa DP)
      else {
        if (isDateMatch(tx.tanggal, filterVal)) {
          totalPendapatan += tx.total;
          totalLabaKotor += (tx.total - hpp);
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
        }
      }
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
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;color:#6b7280;">Belum ada catatan keuangan</td></tr>`;
    } else {
      ledger.forEach((item, index) => {
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

        // Separate columns for Pemasukan vs Pengeluaran
        const pemasukanColVal = item.tipe === 'Pemasukan' ? `+ ${formatRupiah(item.nominal)}` : '-';
        const pengeluaranColVal = item.tipe === 'Pengeluaran' ? `- ${formatRupiah(item.nominal)}` : '-';

        // Bersihkan ID Invoice jika terpecah, dan buat tautan klik struk detail
        const cleanId = item.id.replace("-DP", "").replace("-LUNAS", "");
        let refLinkHtml = "";
        if (item.tipe === 'Pemasukan' && item.kategori.startsWith('Penjualan')) {
          refLinkHtml = `<a href="javascript:void(0)" onclick="window.showTxDetail('${cleanId}')" style="font-family: monospace; font-weight: 600; color: #2b6cb0; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='#1a365d'" onmouseout="this.style.color='#2b6cb0'">${cleanId}</a>`;
        } else {
          refLinkHtml = `<span style="font-family: monospace; font-weight: 600;">${item.id}</span>`;
        }

        tr.innerHTML = `
          <td style="text-align: center;">${index + 1}</td>
          <td>
            <div style="font-weight:600;">${dateStr}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${timeStr}</div>
          </td>
          <td>${refLinkHtml}</td>
          <td style="text-align: center;"><span style="${badgeStyle}">${item.tipe}</span></td>
          <td style="font-weight:600;">${item.kategori}</td>
          <td>${item.keterangan}</td>
          <td>${item.operator}</td>
          <td style="${item.tipe === 'Pemasukan' ? nominalStyle : ''}; text-align: right;">${pemasukanColVal}</td>
          <td style="${item.tipe === 'Pengeluaran' ? nominalStyle : ''}; text-align: right;">${pengeluaranColVal}</td>
          <td style="text-align: center;">
            ${item.bisaDihapus ? `<button class="action-btn" title="Hapus" onclick="deleteExpense('${item.id}')">🗑️</button>` : '-'}
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Tambahkan baris Total (menggunakan colspan=7 agar berbaris rapi)
      const totalTr = document.createElement("tr");
      totalTr.className = "summary-row";
      totalTr.innerHTML = `
        <td colspan="7" style="text-align: right; font-weight: 700; padding: 12px 16px;">Total</td>
        <td style="font-weight: 700; color: #319795; text-align: right;">${formatRupiah(totalPendapatan)}</td>
        <td style="font-weight: 700; color: #e53e3e; text-align: right;">${formatRupiah(totalPengeluaran)}</td>
        <td></td>
      `;
      tbody.appendChild(totalTr);

      // Tambahkan baris Saldo Akhir (menggunakan colspan=8 agar berbaris rapi di kolom Pengeluaran)
      const saldoTr = document.createElement("tr");
      saldoTr.className = "saldo-row";
      const saldoAkhir = totalPendapatan - totalPengeluaran;
      saldoTr.innerHTML = `
        <td colspan="8" style="text-align: right; font-weight: 700; color: #319795; padding: 12px 16px;">Saldo akhir</td>
        <td style="font-weight: 700; color: ${saldoAkhir >= 0 ? '#319795' : '#e53e3e'}; text-align: right;">${formatRupiah(saldoAkhir)}</td>
        <td></td>
      `;
      tbody.appendChild(saldoTr);
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

    // Hitung total pengeluaran per kategori untuk Laporan Arus Kas Akuntansi
    let listrikNominal = 0;
    let gajiNominal = 0;
    let sewaNominal = 0;
    let kebersihanNominal = 0;
    let lainNominal = 0;

    filteredExps.forEach(ex => {
      if (ex.kategori === 'Listrik & Air') listrikNominal += ex.nominal;
      else if (ex.kategori === 'Gaji Karyawan') gajiNominal += ex.nominal;
      else if (ex.kategori === 'Sewa Tempat') sewaNominal += ex.nominal;
      else if (ex.kategori === 'Kebersihan') kebersihanNominal += ex.nominal;
      else lainNominal += ex.nominal;
    });

    const saldoAkhir = totalPendapatan - totalPengeluaran;

    // Render print-only professional Income Statement (Laporan Laba Rugi)
    const printCashFlowEl = document.getElementById("printCashFlowReport");
    if (printCashFlowEl) {
      const totalHPP = totalPendapatan - totalLabaKotor;
      
      printCashFlowEl.innerHTML = `
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.6; color: #000; margin: 0 auto; max-width: 650px;">
          <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin-bottom: 20px; font-weight: bold; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
            LAPORAN LABA RUGI (INCOME STATEMENT)
          </div>

          <!-- Bagian Pendapatan & HPP -->
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
            <span>Pendapatan Penjualan (Omset)</span>
            <span>${formatRupiah(totalPendapatan)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; margin-bottom: 4px; color: #333;">
            <span>Dikurangi: Harga Pokok Penjualan (HPP)</span>
            <span>(${formatRupiah(totalHPP)})</span>
          </div>
          
          <div style="border-bottom: 1px solid #000; margin: 8px 0;"></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 25px; font-size: 14px;">
            <span>LABA KOTOR (GROSS PROFIT)</span>
            <span>${formatRupiah(totalLabaKotor)}</span>
          </div>

          <!-- Bagian Beban Operasional -->
          <div style="font-weight: bold; margin-bottom: 8px;">Beban Operasional (Beban Kas Keluar):</div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; margin-bottom: 4px;">
            <span>Beban Listrik & Air</span>
            <span>${listrikNominal > 0 ? `(${formatRupiah(listrikNominal)})` : 'Rp 0'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; margin-bottom: 4px;">
            <span>Beban Gaji Karyawan</span>
            <span>${gajiNominal > 0 ? `(${formatRupiah(gajiNominal)})` : 'Rp 0'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; margin-bottom: 4px;">
            <span>Beban Sewa Tempat Toko</span>
            <span>${sewaNominal > 0 ? `(${formatRupiah(sewaNominal)})` : 'Rp 0'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; margin-bottom: 4px;">
            <span>Beban Kebersihan & Keamanan</span>
            <span>${kebersihanNominal > 0 ? `(${formatRupiah(kebersihanNominal)})` : 'Rp 0'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; margin-bottom: 4px;">
            <span>Beban Operasional Lainnya</span>
            <span>${lainNominal > 0 ? `(${formatRupiah(lainNominal)})` : 'Rp 0'}</span>
          </div>

          <div style="border-bottom: 1px solid #000; margin: 8px 0;"></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; padding-left: 20px; margin-bottom: 25px;">
            <span>Total Beban Operasional (B)</span>
            <span>(${formatRupiah(totalPengeluaran)})</span>
          </div>

          <!-- Hasil Akhir Laba Bersih -->
          <div style="border-top: 2px double #000; border-bottom: 2px double #000; padding: 8px 0; font-weight: bold; font-size: 15px; display: flex; justify-content: space-between;">
            <span>LABA BERSIH (NET PROFIT)</span>
            <span style="color: #000;">${labaBersih >= 0 ? formatRupiah(labaBersih) : `(${formatRupiah(Math.abs(labaBersih))})`}</span>
          </div>
          
          <div style="margin-top: 50px; display: flex; justify-content: flex-end; font-size: 12px; font-family: sans-serif;">
            <div style="text-align: center; width: 200px;">
              <div>Jakarta, ${new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div style="margin-top: 60px; font-weight: bold; text-decoration: underline;">${profile.nama || 'Optik Lucky Prastica'}</div>
              <div style="color: #718096; font-size: 11px;">Manajemen Toko</div>
            </div>
          </div>
        </div>
      `;
    }

    document.getElementById("expenseInfo").textContent = `Menampilkan ${ledger.length} catatan keuangan`;
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
    } else {
      resepHtml = "";
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

  // ----------------------------------------------------
  const modal = document.getElementById("expenseModal");
  const form = document.getElementById("expenseForm");

  document.getElementById("btnTambahPengeluaran").addEventListener("click", () => {
    form.reset();
    document.getElementById("expDate").value = new Date().toISOString().split("T")[0];
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

    const selectedDate = document.getElementById("expDate").value;
    const expenseDate = selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString();

    const newExpense = {
      id: "EXP-" + Date.now(),
      tanggal: expenseDate,
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
