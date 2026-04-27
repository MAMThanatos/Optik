<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$queries = [
    "ALTER TABLE `kacamata` ADD COLUMN `nama_produk` VARCHAR(255) NOT NULL AFTER `kode_barang`;",
    "ALTER TABLE `kacamata` ADD COLUMN `ukuran_lensa` VARCHAR(100) NULL AFTER `merek`;",
    "ALTER TABLE `kacamata` ADD COLUMN `deskripsi` TEXT NULL AFTER `kategori`;"
];

$success_count = 0;
$errors = [];

foreach ($queries as $query) {
    if (mysqli_query($conn, $query)) {
        $success_count++;
    } else {
        $errors[] = mysqli_error($conn);
    }
}

if (count($errors) > 0) {
    echo json_encode(["status" => "error", "message" => "Beberapa kolom mungkin sudah ada atau terjadi kesalahan.", "errors" => $errors]);
} else {
    echo json_encode(["status" => "success", "message" => "Database berhasil diupdate!"]);
}
?>
