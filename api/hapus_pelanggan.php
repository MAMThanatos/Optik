<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->id) && (int)$data->id > 0) {
    $id = (int)$data->id;

    // Supaya data transaksi tidak error karena foreign key constraints,
    // kita set id_pelanggan di transaksi menjadi NULL sebelum menghapus pelanggan.
    // Untungnya, foreign key constraint di skema adalah ON DELETE SET NULL, 
    // jadi MySQL akan otomatis mengubah id_pelanggan di transaksi menjadi NULL.
    // Tapi kita bisa jalankan query dengan aman.
    
    $query = "DELETE FROM pelanggan WHERE id_pelanggan = $id";
    if (mysqli_query($conn, $query)) {
        echo json_encode(["status" => "success", "message" => "Data pelanggan berhasil dihapus"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal menghapus data pelanggan: " . mysqli_error($conn)]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "ID pelanggan tidak valid"]);
}
?>
