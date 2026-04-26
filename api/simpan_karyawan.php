<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->nama) && isset($data->password)) {
    $username = mysqli_real_escape_string($conn, $data->id);
    $nama = mysqli_real_escape_string($conn, $data->nama);
    $password = mysqli_real_escape_string($conn, $data->password);
    $role = isset($data->role) ? mysqli_real_escape_string($conn, $data->role) : 'karyawan';
    $mode = isset($data->mode) ? $data->mode : 'add';
    $original_id = isset($data->original_id) ? mysqli_real_escape_string($conn, $data->original_id) : '';

    if($mode === 'add') {
        $cek = mysqli_query($conn, "SELECT username FROM pengguna WHERE username = '$username'");
        if(mysqli_num_rows($cek) > 0) {
            echo json_encode(array("status" => "error", "message" => "ID Karyawan / Username sudah dipakai! Gunakan ID lain."));
            exit;
        }

        $query = "INSERT INTO pengguna (nama_lengkap, username, password, role) VALUES ('$nama', '$username', '$password', '$role')";
        if(mysqli_query($conn, $query)) {
            echo json_encode(array("status" => "success", "message" => "Karyawan berhasil ditambahkan"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Gagal menambahkan ke database"));
        }
    } else if($mode === 'edit') {
        $query = "UPDATE pengguna SET nama_lengkap = '$nama', password = '$password' WHERE username = '$original_id'";
        if(mysqli_query($conn, $query)) {
            echo json_encode(array("status" => "success", "message" => "Data karyawan berhasil diperbarui"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Gagal memperbarui database"));
        }
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Data tidak lengkap"));
}
?>
