<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$query = "SELECT id_kacamata, kode_barang, nama_produk, merek, ukuran_lensa, kategori, deskripsi, harga_beli, harga_jual, stok_tersedia FROM kacamata ORDER BY nama_produk ASC";
$result = mysqli_query($conn, $query);

$barang = array();
if($result && mysqli_num_rows($result) > 0) {
    while($row = mysqli_fetch_assoc($result)) {
        $barang[] = array(
            "db_id" => $row['id_kacamata'],
            "id" => $row['kode_barang'],
            "nama" => $row['nama_produk'],
            "merek" => $row['merek'],
            "ukuranLensa" => $row['ukuran_lensa'],
            "kategori" => $row['kategori'],
            "deskripsi" => $row['deskripsi'],
            "harga" => (int)$row['harga_jual'],
            "harga_beli" => (int)$row['harga_beli'],
            "stok" => (int)$row['stok_tersedia']
        );
    }
}
echo json_encode(array("status" => "success", "data" => $barang));
?>
