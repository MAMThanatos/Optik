-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 17, 2026 at 11:21 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `optik_lucky_prastica`
--

-- --------------------------------------------------------

--
-- Table structure for table `detail_transaksi`
--

CREATE TABLE `detail_transaksi` (
  `id_detail` int(11) NOT NULL,
  `id_transaksi` varchar(50) NOT NULL,
  `id_kacamata` int(11) NOT NULL,
  `jumlah_beli` int(11) NOT NULL,
  `harga_satuan` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kacamata`
--

CREATE TABLE `kacamata` (
  `id_kacamata` int(11) NOT NULL,
  `kode_barang` varchar(50) NOT NULL,
  `nama_produk` varchar(255) NOT NULL,
  `merek` varchar(100) NOT NULL,
  `ukuran_lensa` varchar(100) DEFAULT NULL,
  `Spheris` varchar(50) DEFAULT NULL,
  `Cylinder` varchar(50) DEFAULT NULL,
  `Axis` varchar(50) DEFAULT NULL,
  `kategori` varchar(50) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga_beli` decimal(10,2) NOT NULL,
  `harga_jual` decimal(10,2) NOT NULL,
  `stok_tersedia` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id_pelanggan` int(11) NOT NULL,
  `nama_pelanggan` varchar(100) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `tanggal_daftar` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengeluaran`
--

CREATE TABLE `pengeluaran` (
  `id_pengeluaran` varchar(50) NOT NULL,
  `tanggal` datetime DEFAULT current_timestamp(),
  `kategori` varchar(50) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `nominal` decimal(10,2) NOT NULL,
  `id_pengguna` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengguna`
--

CREATE TABLE `pengguna` (
  `id_pengguna` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('manager','karyawan') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pengguna`
--

INSERT INTO `pengguna` (`id_pengguna`, `nama_lengkap`, `username`, `password`, `role`) VALUES
(1, 'Manager Lucky', 'manager', '$2y$10$QJ44JZyfkxyd75MRGTstl.QnmtqkJxwfflqb5Q/uGTaEjl7kBZtz6', 'manager'),
(2, 'Kasir Satu', 'kasir1', '$2y$10$r4C.1MCq/vem7F942TDtdOxqzFCXlfaZkuhFpCEXheEBa9nEAFd52', 'karyawan'),
(3, 'Kasir Dua', 'kasir2', '$2y$10$3krx0/NycfUm1TYVFndAzupN/3trzpIrv8ZO6PLEDpFln33dOCD.G', 'karyawan');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `id_transaksi` varchar(50) NOT NULL,
  `tanggal_waktu` datetime DEFAULT current_timestamp(),
  `id_pengguna` int(11) NOT NULL,
  `id_pelanggan` int(11) DEFAULT NULL,
  `nama_pelanggan` varchar(100) DEFAULT NULL,
  `od_spheris` varchar(20) DEFAULT NULL,
  `od_cylinder` varchar(20) DEFAULT NULL,
  `od_axis` varchar(20) DEFAULT NULL,
  `os_spheris` varchar(20) DEFAULT NULL,
  `os_cylinder` varchar(20) DEFAULT NULL,
  `os_axis` varchar(20) DEFAULT NULL,
  `pd` varchar(20) DEFAULT NULL,
  `addisi` varchar(20) DEFAULT NULL,
  `total_belanja` decimal(10,2) NOT NULL,
  `status_pesanan` enum('Diproses','Siap Diambil','Sudah Diambil') NOT NULL DEFAULT 'Diproses',
  `uang_muka` decimal(15,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `diskon` decimal(15,2) NOT NULL DEFAULT 0.00,
  `metode_pembayaran` varchar(100) DEFAULT '-',
  `uang_diterima` decimal(15,2) NOT NULL DEFAULT 0.00,
  `kembalian` decimal(15,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_transaksi` (`id_transaksi`),
  ADD KEY `id_kacamata` (`id_kacamata`);

--
-- Indexes for table `kacamata`
--
ALTER TABLE `kacamata`
  ADD PRIMARY KEY (`id_kacamata`),
  ADD UNIQUE KEY `kode_barang` (`kode_barang`);

--
-- Indexes for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id_pelanggan`);

--
-- Indexes for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD PRIMARY KEY (`id_pengeluaran`),
  ADD KEY `id_pengguna` (`id_pengguna`);

--
-- Indexes for table `pengguna`
--
ALTER TABLE `pengguna`
  ADD PRIMARY KEY (`id_pengguna`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id_transaksi`),
  ADD KEY `id_pengguna` (`id_pengguna`),
  ADD KEY `transaksi_ibfk_pelanggan` (`id_pelanggan`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kacamata`
--
ALTER TABLE `kacamata`
  MODIFY `id_kacamata` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id_pelanggan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengguna`
--
ALTER TABLE `pengguna`
  MODIFY `id_pengguna` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD CONSTRAINT `detail_transaksi_ibfk_1` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_transaksi_ibfk_2` FOREIGN KEY (`id_kacamata`) REFERENCES `kacamata` (`id_kacamata`);

--
-- Constraints for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD CONSTRAINT `pengeluaran_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`);

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`),
  ADD CONSTRAINT `transaksi_ibfk_pelanggan` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
