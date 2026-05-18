<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $id = mysqli_real_escape_string($conn, $data->id);
    
    $query = "DELETE FROM pengeluaran WHERE id_pengeluaran = '$id'";
    
    if(mysqli_query($conn, $query)) {
        echo json_encode(array("status" => "success", "message" => "Pengeluaran berhasil dihapus"));
    } else {
        echo json_encode(array("status" => "error", "message" => "Gagal menghapus pengeluaran"));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Data tidak lengkap"));
}
?>
