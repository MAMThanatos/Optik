<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->nama) && isset($data->kategori)) {
    $kode_barang = mysqli_real_escape_string($conn, $data->id);
    $nama_produk = mysqli_real_escape_string($conn, $data->nama);
    $merek = mysqli_real_escape_string($conn, $data->merek);
    $kategori = mysqli_real_escape_string($conn, $data->kategori);
    $ukuran_lensa = isset($data->ukuranLensa) ? mysqli_real_escape_string($conn, $data->ukuranLensa) : '-';
    $deskripsi = isset($data->deskripsi) ? mysqli_real_escape_string($conn, $data->deskripsi) : '';
    $harga_jual = isset($data->harga) ? (int)$data->harga : 0;
    $harga_beli = isset($data->harga_beli) ? (int)$data->harga_beli : 0; // Default jika tidak diset frontend
    $stok_tersedia = isset($data->stok) ? (int)$data->stok : 0;
    
    $mode = isset($data->mode) ? $data->mode : 'add';

    if($mode === 'add') {
        $cek = mysqli_query($conn, "SELECT kode_barang FROM kacamata WHERE kode_barang = '$kode_barang'");
        if(mysqli_num_rows($cek) > 0) {
            echo json_encode(array("status" => "error", "message" => "Kode barang sudah ada!"));
            exit;
        }

        $query = "INSERT INTO kacamata (kode_barang, nama_produk, merek, ukuran_lensa, kategori, deskripsi, harga_beli, harga_jual, stok_tersedia) 
                  VALUES ('$kode_barang', '$nama_produk', '$merek', '$ukuran_lensa', '$kategori', '$deskripsi', $harga_beli, $harga_jual, $stok_tersedia)";
                  
        if(mysqli_query($conn, $query)) {
            echo json_encode(array("status" => "success", "message" => "Barang berhasil ditambahkan"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Gagal menambahkan: " . mysqli_error($conn)));
        }
    } else if($mode === 'edit') {
        $query = "UPDATE kacamata SET 
                    nama_produk = '$nama_produk', 
                    merek = '$merek', 
                    ukuran_lensa = '$ukuran_lensa', 
                    kategori = '$kategori', 
                    deskripsi = '$deskripsi', 
                    harga_jual = $harga_jual, 
                    stok_tersedia = $stok_tersedia 
                  WHERE kode_barang = '$kode_barang'";
                  
        if(mysqli_query($conn, $query)) {
            echo json_encode(array("status" => "success", "message" => "Data barang berhasil diperbarui"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Gagal memperbarui database: " . mysqli_error($conn)));
        }
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Data tidak lengkap"));
}
?>
