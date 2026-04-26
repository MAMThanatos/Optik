<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "optik_lucky_prastica";

$conn = mysqli_connect($host, $username, $password, $database);

if (!$conn) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}

mysqli_set_charset($conn, "utf8");

?>
