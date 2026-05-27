<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'manager') {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Only managers can reset data."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || $data['confirm'] !== 'RESET') {
    echo json_encode(["status" => "error", "message" => "Konfirmasi keamanan tidak valid."]);
    exit;
}

$resetTx = isset($data['resetTransactions']) && $data['resetTransactions'] === true;
$resetCust = isset($data['resetCustomers']) && $data['resetCustomers'] === true;
$resetProd = isset($data['resetProducts']) && $data['resetProducts'] === true;

if (!$resetTx && !$resetCust && !$resetProd) {
    echo json_encode(["status" => "error", "message" => "Pilih minimal salah satu kategori data untuk dibersihkan."]);
    exit;
}

// Mulai transaksi database
mysqli_begin_transaction($conn);

try {
    // Matikan sementara foreign key checks agar proses pengosongan mulus
    mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0");

    if ($resetTx) {
        // Hapus detail transaksi, transaksi utama, dan pengeluaran beban keuangan
        mysqli_query($conn, "TRUNCATE TABLE detail_transaksi");
        mysqli_query($conn, "DELETE FROM transaksi");
        mysqli_query($conn, "DELETE FROM pengeluaran");
    }

    if ($resetCust) {
        // Hapus daftar pelanggan dan reset auto-increment
        mysqli_query($conn, "DELETE FROM pelanggan");
        mysqli_query($conn, "ALTER TABLE pelanggan AUTO_INCREMENT = 1");
    }

    if ($resetProd) {
        // Hapus daftar kacamata, reset auto-increment, dan bersihkan gambar uploads (opsional)
        mysqli_query($conn, "DELETE FROM kacamata");
        mysqli_query($conn, "ALTER TABLE kacamata AUTO_INCREMENT = 1");
    }

    // Aktifkan kembali foreign key checks
    mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 1");

    // Jika semua query berhasil, commit perubahan
    mysqli_commit($conn);
    
    echo json_encode(["status" => "success", "message" => "Data terpilih berhasil dibersihkan dari database secara permanen."]);

} catch (Exception $e) {
    // Rollback jika terjadi kesalahan
    mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 1");
    mysqli_rollback($conn);
    echo json_encode(["status" => "error", "message" => "Gagal membersihkan data: " . $e->getMessage()]);
}
?>
