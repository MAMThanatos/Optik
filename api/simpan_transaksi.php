<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

// Membaca input JSON
$data = json_decode(file_get_contents("php://input"), true);

if(!$data) {
    echo json_encode(["status" => "error", "message" => "Tidak ada data yang diterima"]);
    exit;
}

$id_transaksi = mysqli_real_escape_string($conn, $data['id']);
$tanggal = date("Y-m-d H:i:s", strtotime($data['tanggal']));
$kasir_username = mysqli_real_escape_string($conn, $data['kasirId']);
$pelanggan = mysqli_real_escape_string($conn, $data['pelanggan']);

// Rekam Medis
$od_sph = mysqli_real_escape_string($conn, $data['od_sph']);
$od_cyl = mysqli_real_escape_string($conn, $data['od_cyl']);
$od_axis = mysqli_real_escape_string($conn, $data['od_axis']);
$os_sph = mysqli_real_escape_string($conn, $data['os_sph']);
$os_cyl = mysqli_real_escape_string($conn, $data['os_cyl']);
$os_axis = mysqli_real_escape_string($conn, $data['os_axis']);
$pd = mysqli_real_escape_string($conn, $data['pd']);
$addisi = mysqli_real_escape_string($conn, $data['addisi']);

$statusPesanan = mysqli_real_escape_string($conn, $data['statusPesanan']);
$uangMuka = isset($data['uangMuka']) ? (float)$data['uangMuka'] : 0;

$subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : 0;
$diskon = isset($data['diskonNominal']) ? (float)$data['diskonNominal'] : 0;
$total = isset($data['total']) ? (float)$data['total'] : 0;
$uangDiterima = isset($data['uangDiterima']) ? (float)$data['uangDiterima'] : 0;
$kembalian = isset($data['kembalian']) ? (float)$data['kembalian'] : 0;

$metode = mysqli_real_escape_string($conn, $data['metodePembayaran']);
if(!empty($data['bank'])) {
    $metode .= " - " . mysqli_real_escape_string($conn, $data['bank']);
}

// Mulai transaksi database untuk keamanan data
mysqli_begin_transaction($conn);

try {
    // 1. Cari ID Pengguna (Kasir)
    $id_pengguna = 0; // Default jika tidak ditemukan
    $resPengguna = mysqli_query($conn, "SELECT id_pengguna FROM pengguna WHERE username = '$kasir_username'");
    if($resPengguna && mysqli_num_rows($resPengguna) > 0) {
        $id_pengguna = mysqli_fetch_assoc($resPengguna)['id_pengguna'];
    }

    // 2. Simpan atau Cari ID Pelanggan
    $id_pelanggan = "NULL";
    if($pelanggan !== "-" && $pelanggan !== "") {
        $qPelanggan = "INSERT INTO pelanggan (nama_pelanggan, tanggal_daftar) VALUES ('$pelanggan', NOW())";
        mysqli_query($conn, $qPelanggan);
        $id_pelanggan = mysqli_insert_id($conn);
    }

    // 3. Simpan Transaksi Induk
    $qTx = "INSERT INTO transaksi (
        id_transaksi, tanggal_waktu, id_pengguna, id_pelanggan, nama_pelanggan,
        od_spheris, od_cylinder, od_axis, os_spheris, os_cylinder, os_axis, pd, addisi,
        subtotal, diskon, total_belanja, metode_pembayaran, uang_diterima, kembalian,
        status_pesanan, uang_muka
    ) VALUES (
        '$id_transaksi', '$tanggal', $id_pengguna, $id_pelanggan, '$pelanggan',
        '$od_sph', '$od_cyl', '$od_axis', '$os_sph', '$os_cyl', '$os_axis', '$pd', '$addisi',
        $subtotal, $diskon, $total, '$metode', $uangDiterima, $kembalian,
        '$statusPesanan', $uangMuka
    )";

    if(!mysqli_query($conn, $qTx)) {
        throw new Exception("Gagal menyimpan transaksi: " . mysqli_error($conn));
    }

    // 4. Simpan Detail Item (Barang) dan Kurangi Stok
    if(isset($data['items']) && is_array($data['items'])) {
        foreach($data['items'] as $item) {
            $kode_barang = mysqli_real_escape_string($conn, $item['id']);
            $qty = (int)$item['qty'];
            $harga = (float)$item['harga'];
            $sub = $qty * $harga;
            
            // Cari id_kacamata berdasarkan kode_barang
            $id_kaca = 0;
            $resKaca = mysqli_query($conn, "SELECT id_kacamata FROM kacamata WHERE kode_barang = '$kode_barang'");
            if($resKaca && mysqli_num_rows($resKaca) > 0) {
                $id_kaca = mysqli_fetch_assoc($resKaca)['id_kacamata'];
            }
            
            // Insert ke detail_transaksi
            $qDet = "INSERT INTO detail_transaksi (id_transaksi, id_kacamata, jumlah_beli, harga_satuan, subtotal) 
                     VALUES ('$id_transaksi', $id_kaca, $qty, $harga, $sub)";
            if(!mysqli_query($conn, $qDet)) {
                throw new Exception("Gagal menyimpan detail transaksi: " . mysqli_error($conn));
            }

            // Kurangi stok kacamata jika id ditemukan
            if ($id_kaca > 0) {
                $qUpdateStok = "UPDATE kacamata SET stok_tersedia = stok_tersedia - $qty WHERE id_kacamata = $id_kaca";
                if(!mysqli_query($conn, $qUpdateStok)) {
                    throw new Exception("Gagal mengupdate stok: " . mysqli_error($conn));
                }
            }
        }
    }

    // Jika semua berhasil, commit transaksi
    mysqli_commit($conn);
    echo json_encode(["status" => "success", "message" => "Data transaksi berhasil disimpan ke database"]);

} catch (Exception $e) {
    // Jika ada error, rollback semua perubahan
    mysqli_rollback($conn);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
