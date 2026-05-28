# 🕶️ Optik Lucky Prastica - Point of Sale (POS) & Inventory System

Sistem Informasi Manajemen Inventory dan Kasir (Point of Sale) berbasis Web yang dirancang khusus untuk operasional **Optik Lucky Prastica**. Aplikasi ini berfokus pada transaksi retail, pencatatan resep ukuran lensa pasien (OD/OS), manajemen stok barang, serta rekapitulasi keuangan (pendapatan & pengeluaran).

---

## 🚀 Fitur Utama

### 1. Sistem Autentikasi Multi-Role
* **Manager:** Memiliki hak akses penuh ke seluruh sistem, termasuk laporan laba-rugi, manajemen akun karyawan, dan pengaturan pesan struk toko.
* **Karyawan (Kasir):** Memiliki akses untuk melayani transaksi kasir, mencatat resep mata, menambah pelanggan, mengecek stok, dan menginput pengeluaran harian.

### 2. Modul Transaksi & Kasir Retail
* Pencatatan resep ukuran lensa lengkap:
  * **OD (Oculus Dextra - Kanan):** Spheris, Cylinder, Axis.
  * **OS (Oculus Sinister - Kiri):** Spheris, Cylinder, Axis.
  * **Parameter Tambahan:** PD (Pupillary Distance) dan Addisi.
* Fitur **Uang Muka (DP - Down Payment)** untuk pemesanan kacamata/lensa yang membutuhkan proses pembuatan/faset terlebih dahulu.
* Manajemen status pesanan yang interaktif: `Diproses` ➡️ `Siap Diambil` ➡️ `Sudah Diambil`.
* Kalkulasi otomatis diskon, subtotal, uang diterima, dan kembalian.

### 3. Manajemen Stok & Barang (Inventory)
* Pengelolaan data kacamata (CRUD) beserta kode barang unik, merek, kategori, harga beli, harga jual, dan jumlah stok tersedia.
* Fitur unggah gambar produk untuk mempermudah identifikasi barang saat transaksi.

### 4. Manajemen Pelanggan (Pasien)
* Database rekam medis resep kacamata pelanggan untuk memudahkan pencarian riwayat ukuran lensa saat mereka melakukan pembelian kembali di masa mendatang.

### 5. Modul Keuangan & Operasional
* **Pencatatan Pengeluaran:** Fitur bagi kasir/manager untuk mencatat biaya operasional toko (listrik, gaji, pembelian alat, dll).
* **Statistik Dashboard:** Grafik ringkasan total pendapatan harian/bulanan, pengeluaran, jumlah pelanggan, serta peringatan stok kritis.
* **Cetak Struk Transaksi:** Sinkronisasi pesan struk dan informasi toko melalui menu pengaturan manager.

---

## 🛠️ Arsitektur & Teknologi

Aplikasi ini dibangun menggunakan arsitektur **Client-Server Berbasis API** terpisah secara modular:

* **Front-End:** HTML5, CSS3 (Custom Styling modern & clean), Vanilla JavaScript (AJAX menggunakan Fetch API).
* **Back-End:** PHP (Native API, penanganan Session, autentikasi aman dengan `password_hash`).
* **Database:** MySQL / MariaDB dengan relasi inter-tabel terstruktur (*Foreign Key Constraints* dengan mode `CASCADE` dan `SET NULL`).

### Struktur Database (`optik_lucky_prastica`)
* `pengguna`: Menyimpan data akun login manager dan karyawan.
* `kacamata`: Menyimpan data master inventaris produk kacamata dan lensa.
* `pelanggan`: Menyimpan data profil pelanggan/pasien optik.
* `transaksi`: Menyimpan data utama penjualan, nominal DP, resep lensa (OD/OS), dan metode pembayaran.
* `detail_transaksi`: Menyimpan detail item kacamata yang dibeli dalam satu transaksi (Relasi *Many-to-Many*).
* `pengeluaran`: Menyimpan catatan pengeluaran kas operasional toko.
* `pengaturan`: Menyimpan konfigurasi profil toko dan teks pada struk belanja.
