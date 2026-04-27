<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $kode_barang = mysqli_real_escape_string($conn, $data->id);
    
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
