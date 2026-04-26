CREATE DATABASE IF NOT EXISTS optik_lucky_prastica;
USE optik_lucky_prastica;

-- 1. Tabel Pengguna (Manager & Karyawan)
CREATE TABLE pengguna (
    id_pengguna INT AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('manager', 'karyawan') NOT NULL
);

-- 2. Tabel Kacamata (Stok Barang)
CREATE TABLE kacamata (
    id_kacamata INT AUTO_INCREMENT PRIMARY KEY,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    merek VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    harga_beli DECIMAL(10,2) NOT NULL,
    harga_jual DECIMAL(10,2) NOT NULL,
    stok_tersedia INT NOT NULL DEFAULT 0
);

-- 3. Tabel Transaksi (Header/Nota)
CREATE TABLE transaksi (
    id_transaksi VARCHAR(50) PRIMARY KEY, -- Contoh: INV-20231024-001
    tanggal_waktu DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_pengguna INT NOT NULL,
    nama_pelanggan VARCHAR(100),
    total_belanja DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna)
);

-- 4. Tabel Detail Transaksi (Rincian Barang per Nota)
CREATE TABLE detail_transaksi (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_transaksi VARCHAR(50) NOT NULL,
    id_kacamata INT NOT NULL,
    jumlah_beli INT NOT NULL,
    harga_satuan DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
    FOREIGN KEY (id_kacamata) REFERENCES kacamata(id_kacamata)
);

-- --- Data Awal (Dummy) ---
-- Password disimpan dalam bentuk plain text DULU untuk testing. 
-- Nanti di PHP akan kita amankan menggunakan password_hash()
INSERT INTO pengguna (nama_lengkap, username, password, role) VALUES 
('Manager Lucky', 'manager', 'manager123', 'manager'),
('Kasir Satu', 'kasir1', 'kasir123', 'karyawan'),
('Kasir Dua', 'kasir2', 'kasir123', 'karyawan');
