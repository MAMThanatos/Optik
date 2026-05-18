<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->nama) && isset($data->alamat)) {
    $nama = mysqli_real_escape_string($conn, $data->nama);
    $alamat = mysqli_real_escape_string($conn, $data->alamat);
    $telepon = mysqli_real_escape_string($conn, $data->telepon);
    $pesan_struk = mysqli_real_escape_string($conn, $data->pesan_struk);
    
    $query = "UPDATE pengaturan SET nama_toko = '$nama', alamat = '$alamat', telepon = '$telepon', pesan_struk = '$pesan_struk' WHERE id_pengaturan = 1";
    
    if(mysqli_query($conn, $query)) {
        echo json_encode(array("status" => "success", "message" => "Pengaturan berhasil diperbarui"));
    } else {
        echo json_encode(array("status" => "error", "message" => "Gagal memperbarui pengaturan"));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Data tidak lengkap"));
}
?>
