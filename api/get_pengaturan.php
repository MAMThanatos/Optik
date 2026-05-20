<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$query = "SELECT * FROM pengaturan WHERE id_pengaturan = 1";
$result = mysqli_query($conn, $query);

if(mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    echo json_encode(array(
        "status" => "success",
        "data" => array(
            "nama" => $row['nama_toko'],
            "alamat" => $row['alamat'],
            "telepon" => $row['telepon'],
            "pesan_struk" => $row['pesan_struk']
        )
    ));
} else {
    echo json_encode(array("status" => "error", "message" => "Pengaturan belum diset"));
}
?>
