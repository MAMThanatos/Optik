<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->username) && isset($data->password)) {
    $username = mysqli_real_escape_string($conn, $data->username);
    $password_input = $data->password;

    $query = "SELECT id_pengguna, nama_lengkap, username, role, password FROM pengguna WHERE username = '$username' LIMIT 1";
    $result = mysqli_query($conn, $query);

    if(mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        
        if(password_verify($password_input, $row['password'])) {
            echo json_encode(array(
                "status" => "success",
                "message" => "Login berhasil",
                "data" => array(
                    "id" => $row['id_pengguna'],
                    "nama" => $row['nama_lengkap'],
                    "username" => $row['username'],
                    "role" => $row['role']
                )
            ));
        } else {
            echo json_encode(array(
                "status" => "error",
                "message" => "Username atau password salah"
            ));
        }
    } else {
        echo json_encode(array(
            "status" => "error",
            "message" => "Username atau password salah"
        ));
    }
} else {
    echo json_encode(array(
        "status" => "error",
        "message" => "Data tidak lengkap"
    ));
}
?>