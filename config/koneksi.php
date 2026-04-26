<?php
// File: config/koneksi.php

$host = "localhost";
$username = "root";
$password = ""; // Default XAMPP biasanya kosong
$database = "optik_lucky_prastica";

// Membuat koneksi menggunakan ekstensi mysqli
$conn = mysqli_connect($host, $username, $password, $database);

// Mengecek apakah koneksi berhasil
if (!$conn) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}

// Memastikan encoding karakter menggunakan UTF-8
mysqli_set_charset($conn, "utf8");

// Catatan: Jika koneksi sukses, kita tidak perlu mencetak (echo) apa-apa,
// agar tidak mengganggu output saat file ini di-include oleh file lain.
?>
