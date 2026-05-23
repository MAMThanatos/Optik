<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$query = "SELECT id_pelanggan, nama_pelanggan, no_hp, alamat, tanggal_daftar FROM pelanggan ORDER BY tanggal_daftar DESC";
$result = mysqli_query($conn, $query);

$customers = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $customers[] = [
            "id" => (int)$row['id_pelanggan'],
            "nama" => $row['nama_pelanggan'],
            "no_hp" => $row['no_hp'] ? $row['no_hp'] : "-",
            "alamat" => $row['alamat'] ? $row['alamat'] : "-",
            "tanggal_daftar" => $row['tanggal_daftar']
        ];
    }
    echo json_encode(["status" => "success", "data" => $customers]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal mengambil data pelanggan: " . mysqli_error($conn)]);
}
?>
