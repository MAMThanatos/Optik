<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$query = "SELECT id_pengguna, nama_lengkap, username, role, password FROM pengguna ORDER BY role ASC, nama_lengkap ASC";
$result = mysqli_query($conn, $query);

$users = array();
if(mysqli_num_rows($result) > 0) {
    while($row = mysqli_fetch_assoc($result)) {
        $users[] = array(
            "id" => $row['username'], 
            "db_id" => $row['id_pengguna'],
            "nama" => $row['nama_lengkap'],
            "role" => $row['role'],
            "password" => $row['password']
        );
    }
}
echo json_encode(array("status" => "success", "data" => $users));
?>
