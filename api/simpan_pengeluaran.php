<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"), true);

if(!$data) {
    echo json_encode(["status" => "error", "message" => "Tidak ada data yang diterima"]);
    exit;
}

$id_pengeluaran = mysqli_real_escape_string($conn, $data['id']);
$tanggal = date("Y-m-d H:i:s", strtotime($data['tanggal']));
$kategori = mysqli_real_escape_string($conn, $data['kategori']);
$keterangan = mysqli_real_escape_string($conn, $data['keterangan']);
$nominal = (float)$data['nominal'];
$id_pengguna = (int)$data['kasirId'];

$query = "INSERT INTO pengeluaran (id_pengeluaran, tanggal, kategori, keterangan, nominal, id_pengguna) 
          VALUES ('$id_pengeluaran', '$tanggal', '$kategori', '$keterangan', $nominal, $id_pengguna)";

if(mysqli_query($conn, $query)) {
    echo json_encode(["status" => "success", "message" => "Pengeluaran berhasil disimpan"]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal menyimpan pengeluaran: " . mysqli_error($conn)]);
}
?>
