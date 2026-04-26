<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $username = mysqli_real_escape_string($conn, $data->id);
    
    // Karena menggunakan ON DELETE CASCADE (Opsional), bisa langsung di hapus
    // Jika ada error foreign key, ini akan gagal gracefully.
    $query = "DELETE FROM pengguna WHERE username = '$username'";
    if(mysqli_query($conn, $query)) {
        echo json_encode(array("status" => "success", "message" => "Karyawan berhasil dihapus"));
    } else {
        echo json_encode(array("status" => "error", "message" => "Gagal menghapus. Kemungkinan karyawan ini sudah pernah melayani transaksi."));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "ID tidak valid"));
}
?>
