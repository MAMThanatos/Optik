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

if (isset($data->nama) && !empty(trim($data->nama))) {
    $nama = mysqli_real_escape_string($conn, trim($data->nama));
    $no_hp = isset($data->no_hp) ? mysqli_real_escape_string($conn, trim($data->no_hp)) : '';
    $alamat = isset($data->alamat) ? mysqli_real_escape_string($conn, trim($data->alamat)) : '';
    $mode = isset($data->mode) ? $data->mode : 'add';

    if ($mode === 'add') {
        $query = "INSERT INTO pelanggan (nama_pelanggan, no_hp, alamat, tanggal_daftar) VALUES ('$nama', '$no_hp', '$alamat', NOW())";
        if (mysqli_query($conn, $query)) {
            echo json_encode(["status" => "success", "message" => "Pelanggan berhasil ditambahkan"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan pelanggan: " . mysqli_error($conn)]);
        }
    } else if ($mode === 'edit') {
        if (isset($data->id) && (int)$data->id > 0) {
            $id = (int)$data->id;
            $query = "UPDATE pelanggan SET nama_pelanggan = '$nama', no_hp = '$no_hp', alamat = '$alamat' WHERE id_pelanggan = $id";
            if (mysqli_query($conn, $query)) {
                echo json_encode(["status" => "success", "message" => "Data pelanggan berhasil diperbarui"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui data pelanggan: " . mysqli_error($conn)]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "ID pelanggan tidak valid untuk pengeditan"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Mode tidak dikenal"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Nama pelanggan wajib diisi"]);
}
?>
