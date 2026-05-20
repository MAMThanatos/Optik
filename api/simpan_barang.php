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

if(isset($data->id) && isset($data->nama) && isset($data->kategori)) {
    $kode_barang = mysqli_real_escape_string($conn, $data->id);
    $nama_produk = mysqli_real_escape_string($conn, $data->nama);
    $merek = mysqli_real_escape_string($conn, $data->merek);
    $kategori = mysqli_real_escape_string($conn, $data->kategori);
    $ukuran_lensa = isset($data->ukuranLensa) ? mysqli_real_escape_string($conn, $data->ukuranLensa) : '-';
    $deskripsi = isset($data->deskripsi) ? mysqli_real_escape_string($conn, $data->deskripsi) : '';
    $harga_jual = isset($data->harga) ? (int)$data->harga : 0;
    $harga_beli = isset($data->harga_beli) ? (int)$data->harga_beli : 0;
    $stok_tersedia = isset($data->stok) ? (int)$data->stok : 0;
    
    $mode = isset($data->mode) ? $data->mode : 'add';
    
    // Proses upload gambar Base64 jika disediakan
    $gambarPath = null;
    if (isset($data->gambar) && !empty($data->gambar)) {
        $imgData = $data->gambar;
        if (preg_match('/^data:image\/(\w+);base64,/', $imgData, $type)) {
            $imgData = substr($imgData, strpos($imgData, ',') + 1);
            $type = strtolower($type[1]);
            if (in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $imgData = base64_decode($imgData);
                if ($imgData !== false) {
                    $fileName = "glasses_" . time() . "_" . uniqid() . "." . $type;
                    $uploadDir = "../uploads/products/";
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    if (file_put_contents($uploadDir . $fileName, $imgData)) {
                        $gambarPath = "uploads/products/" . $fileName;
                    }
                }
            }
        }
    }

    if($mode === 'add') {
        $cek = mysqli_query($conn, "SELECT kode_barang FROM kacamata WHERE kode_barang = '$kode_barang'");
        if(mysqli_num_rows($cek) > 0) {
            echo json_encode(array("status" => "error", "message" => "Kode barang sudah ada!"));
            exit;
        }

        $gambarVal = $gambarPath ? "'".mysqli_real_escape_string($conn, $gambarPath)."'" : "NULL";

        $query = "INSERT INTO kacamata (kode_barang, nama_produk, merek, ukuran_lensa, kategori, deskripsi, harga_beli, harga_jual, stok_tersedia, gambar) 
                  VALUES ('$kode_barang', '$nama_produk', '$merek', '$ukuran_lensa', '$kategori', '$deskripsi', $harga_beli, $harga_jual, $stok_tersedia, $gambarVal)";
                  
        if(mysqli_query($conn, $query)) {
            echo json_encode(array("status" => "success", "message" => "Barang berhasil ditambahkan"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Gagal menambahkan: " . mysqli_error($conn)));
        }
    } else if($mode === 'edit') {
        $updateGambarSql = "";
        if ($gambarPath !== null) {
            // Hapus gambar lama jika ada
            $oldRes = mysqli_query($conn, "SELECT gambar FROM kacamata WHERE kode_barang = '$kode_barang'");
            if ($oldRes && mysqli_num_rows($oldRes) > 0) {
                $oldRow = mysqli_fetch_assoc($oldRes);
                if (!empty($oldRow['gambar'])) {
                    $oldFilePath = "../" . $oldRow['gambar'];
                    if (file_exists($oldFilePath)) {
                        unlink($oldFilePath);
                    }
                }
            }
            $updateGambarSql = ", gambar = '".mysqli_real_escape_string($conn, $gambarPath)."'";
        }

        $query = "UPDATE kacamata SET 
                    nama_produk = '$nama_produk', 
                    merek = '$merek', 
                    ukuran_lensa = '$ukuran_lensa', 
                    kategori = '$kategori', 
                    deskripsi = '$deskripsi', 
                    harga_jual = $harga_jual, 
                    stok_tersedia = $stok_tersedia 
                    $updateGambarSql
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
