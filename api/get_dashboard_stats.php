<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = [
    "penjualan_hari_ini" => 0,
    "transaksi_hari_ini" => 0,
    "stok_kacamata" => 0,
    "karyawan_aktif" => 0,
    "stok_menipis" => 0,
    "transaksi_terbaru" => []
];

$today = date("Y-m-d");

// 1. Penjualan & Transaksi Hari Ini
$qTxToday = "SELECT COUNT(id_transaksi) as jml_trx, SUM(total_belanja) as pendapatan FROM transaksi WHERE DATE(tanggal_waktu) = '$today'";
$resTxToday = mysqli_query($conn, $qTxToday);
if($resTxToday && $row = mysqli_fetch_assoc($resTxToday)) {
    $data["transaksi_hari_ini"] = (int)$row['jml_trx'];
    $data["penjualan_hari_ini"] = (float)$row['pendapatan'];
}

// 2. Stok Kacamata Total & Stok Menipis (< 5)
$qStok = "SELECT SUM(stok_tersedia) as total_stok, COUNT(*) as barang_menipis FROM kacamata WHERE stok_tersedia <= 5";
$resStok = mysqli_query($conn, $qStok);
if($resStok && $row = mysqli_fetch_assoc($resStok)) {
    $data["stok_menipis"] = (int)$row['barang_menipis'];
}

$qTotalStok = "SELECT SUM(stok_tersedia) as total_stok FROM kacamata";
$resTotalStok = mysqli_query($conn, $qTotalStok);
if($resTotalStok && $row = mysqli_fetch_assoc($resTotalStok)) {
    $data["stok_kacamata"] = (int)$row['total_stok'];
}

// 3. Karyawan Aktif (Selain Manager)
$qKaryawan = "SELECT COUNT(id_pengguna) as jml_karyawan FROM pengguna WHERE role = 'karyawan'";
$resKaryawan = mysqli_query($conn, $qKaryawan);
if($resKaryawan && $row = mysqli_fetch_assoc($resKaryawan)) {
    $data["karyawan_aktif"] = (int)$row['jml_karyawan'];
}

// 4. 5 Transaksi Terbaru
$qRecent = "
    SELECT 
        t.id_transaksi as id, 
        t.nama_pelanggan as pelanggan, 
        t.total_belanja as total,
        t.status_pesanan as status,
        p.nama_lengkap as kasirNama,
        (SELECT k.nama_produk FROM detail_transaksi d JOIN kacamata k ON d.id_kacamata = k.id_kacamata WHERE d.id_transaksi = t.id_transaksi LIMIT 1) as produk_contoh
    FROM transaksi t
    LEFT JOIN pengguna p ON t.id_pengguna = p.id_pengguna
    ORDER BY t.tanggal_waktu DESC LIMIT 5
";
$resRecent = mysqli_query($conn, $qRecent);
if($resRecent) {
    while($row = mysqli_fetch_assoc($resRecent)) {
        $data["transaksi_terbaru"][] = $row;
    }
}

echo json_encode(["status" => "success", "data" => $data]);
?>
