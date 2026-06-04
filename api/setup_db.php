<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$queries = [
    "ALTER TABLE `kacamata` ADD COLUMN `nama_produk` VARCHAR(255) NOT NULL AFTER `kode_barang`;",
    "ALTER TABLE `kacamata` ADD COLUMN `ukuran_lensa` VARCHAR(100) NULL AFTER `merek`;",
    "ALTER TABLE `kacamata` ADD COLUMN `deskripsi` TEXT NULL AFTER `kategori`;",
    "ALTER TABLE `kacamata` ADD COLUMN `gambar` VARCHAR(255) NULL AFTER `deskripsi`;",
    "ALTER TABLE `transaksi` ADD COLUMN `nominal_dp` DECIMAL(15,2) DEFAULT 0.00 AFTER `uang_muka`;",
    "ALTER TABLE `transaksi` ADD COLUMN `tanggal_pelunasan` DATETIME DEFAULT NULL AFTER `status_pesanan`;"
];

$success_count = 0;
$errors = [];

foreach ($queries as $query) {
    try {
        if (mysqli_query($conn, $query)) {
            $success_count++;
        } else {
            $errno = mysqli_errno($conn);
            if ($errno !== 1060 && $errno !== 1061) { // 1060 = Duplicate column name
                $errors[] = mysqli_error($conn) . " (Code: $errno)";
            } else {
                $success_count++;
            }
        }
    } catch (Exception $e) {
        $code = $e->getCode();
        if ($code !== 1060 && $code !== 1061 && strpos($e->getMessage(), 'Duplicate column') === false) {
            $errors[] = $e->getMessage();
        } else {
            $success_count++;
        }
    }
}

if (count($errors) > 0) {
    echo json_encode(["status" => "error", "message" => "Beberapa kolom mungkin sudah ada atau terjadi kesalahan.", "errors" => $errors]);
} else {
    echo json_encode(["status" => "success", "message" => "Database berhasil diupdate!"]);
}
?>
