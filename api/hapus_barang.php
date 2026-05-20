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

if(isset($data->id)) {
    $kode_barang = mysqli_real_escape_string($conn, $data->id);
    
    // Hapus gambar jika ada
    $oldRes = mysqli_query($conn, "SELECT gambar FROM kacamata WHERE kode_barang = '$kode_barang'");
    if ($oldRes && mysqli_num_rows($oldRes) > 0) {
        $oldRow = mysqli_fetch_assoc($oldRes);
        if (!empty($oldRow['gambar'])) {
            $oldFilePath = "../" . $oldRow['gambar'];
            if (file_exists($oldFilePath)) {
                unlink($oldFilePath);
            }
        }
    }
    
    $query = "DELETE FROM kacamata WHERE kode_barang = '$kode_barang'";
    if(mysqli_query($conn, $query)) {
        echo json_encode(array("status" => "success", "message" => "Barang berhasil dihapus"));
    } else {
        echo json_encode(array("status" => "error", "message" => "Gagal menghapus. Kemungkinan barang ini sudah tercatat di transaksi penjualan."));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "ID tidak valid"));
}
?>
