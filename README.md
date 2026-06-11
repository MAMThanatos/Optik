# 🕶️ Rancang Bangun Sistem Informasi Point of Sale (POS) dan Inventory Berbasis Web pada Optik Lucky Prastica

Sistem Informasi Manajemen Inventory dan Kasir (Point of Sale) berbasis Web yang dirancang khusus untuk operasional **Optik Lucky Prastica**. Aplikasi ini berfokus pada transaksi retail, pencatatan resep ukuran lensa pasien (OD/OS), manajemen stok barang, serta rekapitulasi keuangan (Laporan Laba Rugi & Pengeluaran).

---

## 🚀 Fitur Utama

### 1. Sistem Autentikasi Multi-Role
* 💼 **Manager (Branch Manager):** Memiliki hak akses penuh ke seluruh sistem, termasuk analisis Laporan Laba Rugi akuntansi, manajemen akun karyawan/staf, CRUD produk kacamata, dan pengaturan pesan struk cetak toko.
* 🛒 **Karyawan (Kasir):** Memiliki akses untuk melayani transaksi kasir POS, mencatat resep lensa mata kustom, menambah pelanggan baru, mengecek stok barang, dan menginput pengeluaran harian operasional toko.

### 2. Modul Transaksi & Kasir Retail (POS)
* 👁️ **Pencatatan Resep Lensa Lengkap:**
  * **OD (Oculus Dextra - Kanan):** Spheris (SPH), Cylinder (CYL), Axis.
  * **OS (Oculus Sinister - Kiri):** Spheris (SPH), Cylinder (CYL), Axis.
  * **Parameter Tambahan:** PD (Pupillary Distance) dan Addisi.
* 💳 **Fitur Uang Muka (DP - Down Payment):** Didesain khusus untuk pemesanan kacamata/lensa resep yang membutuhkan proses faset/gosok lensa di laboratorium terlebih dahulu.
* 📦 **Manajemen Status Pesanan Terintegrasi:** Pelacakan pesanan secara real-time (`Diproses` ➡️ `Siap Diambil` ➡️ `Sudah Diambil`) untuk memudahkan kasir/manager memantau pesanan yang belum dilunasi.
* 🧮 **Kalkulator Otomatis:** Perhitungan diskon persen, subtotal, grand total belanja, uang tunai diterima, sisa tagihan DP, dan kembalian secara presisi.

### 3. Manajemen Stok & Barang (Inventory)
* 👓 **CRUD Inventaris Kacamata:** Pengelolaan data kacamata dan lensa beserta kode barang unik, kategori (Frame, Lensa, Sunglasses, Kontak, Aksesoris), harga beli, harga jual, dan jumlah stok.
* 🖼️ **Unggah Gambar Produk:** Fitur upload foto kacamata untuk memudahkan visualisasi produk di halaman kasir belanja.

### 4. Manajemen Pelanggan (Pasien)
* 👥 **Database Profil Pelanggan:** Pendaftaran pelanggan baru dengan validasi nomor HP, mempermudah manajemen riwayat kontak pasien.

### 5. Modul Keuangan & Laporan Standar Akuntansi
* 💸 **Pencatatan Kas Keluar (Beban):** Fitur mencatat beban pengeluaran operasional toko (Listrik & Air, Gaji Karyawan, Sewa Tempat, Kebersihan, dll).
* 📊 **Laporan Penjualan Interaktif:** Menampilkan log penjualan lengkap. Dilengkapi dengan **fitur klik nomor Invoice untuk menampilkan modal struk digital dan resep kacamata OD/OS pelanggan** secara instan.
* ⚖️ **Laporan Keuangan & Cetak Laba Rugi (Income Statement):** 
  * Dilengkapi fitur cetak (`Ctrl + P`) pintar yang secara otomatis menyembunyikan tabel mentah berantakan dan mengubahnya menjadi **Laporan Laba Rugi Akuntansi Resmi (Income Statement)**.
  * Menghitung **Pendapatan**, **Harga Pokok Penjualan (HPP)** berdasarkan harga beli asli dari database, **Laba Kotor (Gross Profit)**, **Beban Operasional**, hingga **Laba Bersih (Net Profit)** secara matematis akurat.
* 📈 **Dashboard Statistik:** Ringkasan pendapatan, transaksi hari ini, total stok barang, jumlah karyawan aktif, dan peringatan dini stok menipis (dibawah 5 unit).

### 6. Proteksi Akses Halaman & Pencegahan Glitch Visual (FOUC)
Untuk menjamin keamanan hak akses antar-role dan memberikan pengalaman pengguna yang mulus tanpa kebocoran data sensitif sebelum autentikasi selesai:
* **Default-Hidden Sidebar & Menus:** Elemen navigasi khusus manajer (`.js-manager-only` dan `.js-manager-menus`) disembunyikan secara bawaan di CSS (`display: none`). Menu hanya akan ditampilkan via JavaScript setelah peran pengguna tervalidasi sebagai `manager`.
* **Proteksi Halaman Utama Manajer:** Halaman sensitif seperti `input-kacamata.html` diatur dengan `display: none` pada kontainer utama `.dashboard-wrapper`. Halaman hanya akan dirender jika peran pengguna telah terverifikasi oleh server.
* **Redirection Instan Tingkat Klien:** Skrip halaman khusus manajer secara instan memblokir pemanggilan API dan mengalihkan pengguna non-manajer (kasir) ke `dashboard-kasir.html` sebelum data sempat dimuat.

---

## 🛠️ Arsitektur & Teknologi

Aplikasi ini dibangun menggunakan arsitektur **Client-Server Berbasis API** terpisah secara modular:

* **Front-End:** HTML5, CSS3 (Modern Glassmorphism & Custom Responsive Design), Vanilla JavaScript (AJAX menggunakan Fetch API).
* **Back-End:** PHP (Native API, penanganan Session, autentikasi aman dengan `password_hash`).
* **Database:** MySQL / MariaDB dengan relasi inter-tabel terstruktur (*Foreign Key Constraints* dengan mode `CASCADE` dan `SET NULL`).

### Struktur Database (`optik_lucky_prastica`)
* `pengguna`: Menyimpan data akun login manager dan kasir.
* `kacamata`: Menyimpan data master inventaris produk kacamata dan lensa.
* `pelanggan`: Menyimpan data profil pelanggan/pasien optik.
* `transaksi`: Menyimpan data utama penjualan, nominal DP, resep lensa (OD/OS), dan metode pembayaran.
* `detail_transaksi`: Menyimpan detail item kacamata yang dibeli dalam satu transaksi (Relasi *Many-to-Many*).
* `pengeluaran`: Menyimpan catatan pengeluaran kas operasional toko.
* `pengaturan`: Menyimpan konfigurasi profil toko dan teks pada struk belanja.

---

## 💻 Panduan Instalasi & Konfigurasi (Setup)

Bagi Dosen Penguji / Developer yang ingin menjalankan aplikasi ini di localhost:

### 1. Prasyarat Sistem
* XAMPP (Direkomendasikan PHP Versi 7.4 ke atas atau Versi 8.x).
* Web Browser modern (Chrome, Edge, Firefox, Safari).

### 2. Langkah-Langkah Instalasi
1. Ekstrak atau salin folder proyek ini ke dalam direktori XAMPP Anda:
   ```bash
   C:\xampp\htdocs\Optik
   ```
2. Jalankan **XAMPP Control Panel** lalu aktifkan modul **Apache** dan **MySQL**.
3. Buka browser dan akses **phpMyAdmin**:
   ```
   http://localhost/phpmyadmin/
   ```
4. Buat database baru bernama **`optik_lucky_prastica`**.
5. Klik menu **Import**, pilih berkas database SQL yang terletak di:
   ```
   C:\xampp\htdocs\Optik\database\optik_lucky_prastica.sql
   ```
   Lalu klik **Go** / **Kirim** untuk mengimpor seluruh tabel beserta data bawaan.
6. Buka browser Anda dan akses aplikasi melalui URL berikut:
   ```
   http://localhost/Optik/
   ```

---

## 🔑 Akun Login Bawaan (Default Credentials)

Berikut adalah daftar akun uji coba yang sudah siap digunakan setelah mengimpor database:

| No | Peran (Role) | Username | Password | Hak Akses |
|:--:|:---|:---|:---|:---|
| 1 | **Branch Manager** | `manager` | `manager112233` | Akses penuh seluruh sistem & Laba Rugi |
| 2 | **Kasir Karyawan** | `kasir1` | `kasir123` | Kasir POS, Resep, Data Pelanggan, & Cek Stok |
