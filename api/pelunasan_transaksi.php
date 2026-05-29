<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['id_transaksi'])) {
    echo json_encode(["status" => "error", "message" => "ID Transaksi tidak valid"]);
    exit;
}

$id_transaksi = mysqli_real_escape_string($conn, $data['id_transaksi']);

// Ambil data transaksi terlebih dahulu
$qSelect = "SELECT total_belanja, uang_muka, status_pesanan FROM transaksi WHERE id_transaksi = '$id_transaksi' LIMIT 1";
$resSelect = mysqli_query($conn, $qSelect);

if ($resSelect && mysqli_num_rows($resSelect) > 0) {
    $row = mysqli_fetch_assoc($resSelect);
    
    if ($row['status_pesanan'] === 'Sudah Diambil') {
        echo json_encode(["status" => "error", "message" => "Transaksi sudah lunas"]);
        exit;
    }

    $total = (float)$row['total_belanja'];
    
    // Ambil data pembayaran pelunasan dari input JSON jika tersedia
    $metode = isset($data['metode_pembayaran']) ? mysqli_real_escape_string($conn, $data['metode_pembayaran']) : '';
    $uang_diterima = isset($data['uang_diterima']) ? (float)$data['uang_diterima'] : $total;
    $kembalian = isset($data['kembalian']) ? (float)$data['kembalian'] : 0.00;

    $old_method = $row['metode_pembayaran'] ?? '-';
    if (!empty($metode) && $metode !== '-') {
        $new_method = "$old_method / $metode (Lunas)";
    } else {
        $new_method = "$old_method (Lunas)";
    }

    // Update status transaksi menjadi 'Sudah Diambil', nominal_dp diisi dengan uang_muka yang lama, uang_muka disamakan dengan total, dan tanggal_pelunasan diisi NOW()
    $qUpdate = "UPDATE transaksi SET 
                status_pesanan = 'Sudah Diambil', 
                nominal_dp = uang_muka,
                uang_muka = $total,
                tanggal_pelunasan = NOW(),
                metode_pembayaran = '$new_method',
                uang_diterima = $uang_diterima,
                kembalian = $kembalian
                WHERE id_transaksi = '$id_transaksi'";
                
    if (mysqli_query($conn, $qUpdate)) {
        echo json_encode(["status" => "success", "message" => "Transaksi berhasil dilunasi"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal melakukan pelunasan: " . mysqli_error($conn)]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Transaksi tidak ditemukan"]);
}
?>
