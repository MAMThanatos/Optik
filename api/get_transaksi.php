<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$qTx = "
    SELECT 
        t.id_transaksi as id, 
        t.tanggal_waktu as tanggal, 
        p.nama_lengkap as kasirNama,
        t.id_pengguna as kasirId,
        t.nama_pelanggan as pelanggan,
        t.od_spheris as od_sph, t.od_cylinder as od_cyl, t.od_axis,
        t.os_spheris as os_sph, t.os_cylinder as os_cyl, t.os_axis,
        t.pd, t.addisi,
        t.status_pesanan as statusPesanan,
        t.uang_muka as uangMuka,
        (t.total_belanja - t.uang_muka) as sisaTagihan,
        t.subtotal, t.diskon as diskonNominal, t.total_belanja as total,
        t.metode_pembayaran as metodePembayaran,
        t.uang_diterima as uangDiterima, t.kembalian
    FROM transaksi t
    LEFT JOIN pengguna p ON t.id_pengguna = p.id_pengguna
    ORDER BY t.tanggal_waktu DESC
";

$resTx = mysqli_query($conn, $qTx);
$transactions = [];

if($resTx) {
    while($row = mysqli_fetch_assoc($resTx)) {
        // Prepare formatting
        $row['total'] = (float)$row['total'];
        $row['subtotal'] = (float)$row['subtotal'];
        $row['diskonNominal'] = (float)$row['diskonNominal'];
        $row['uangMuka'] = (float)$row['uangMuka'];
        $row['sisaTagihan'] = (float)$row['sisaTagihan'];
        $row['uangDiterima'] = (float)$row['uangDiterima'];
        $row['kembalian'] = (float)$row['kembalian'];
        
        // Fetch items for this transaction
        $id_tx = $row['id'];
        $qDet = "
            SELECT 
                k.kode_barang as id, 
                k.nama_produk as nama, 
                d.jumlah_beli as qty, 
                d.harga_satuan as harga,
                k.harga_beli
            FROM detail_transaksi d
            LEFT JOIN kacamata k ON d.id_kacamata = k.id_kacamata
            WHERE d.id_transaksi = '$id_tx'
        ";
        $resDet = mysqli_query($conn, $qDet);
        $items = [];
        if($resDet) {
            while($d = mysqli_fetch_assoc($resDet)) {
                $d['qty'] = (int)$d['qty'];
                $d['harga'] = (float)$d['harga'];
                $d['harga_beli'] = isset($d['harga_beli']) ? (float)$d['harga_beli'] : ($d['harga'] * 0.6);
                $items[] = $d;
            }
        }
        
        $row['items'] = $items;
        $transactions[] = $row;
    }
}

echo json_encode(["status" => "success", "data" => $transactions]);
?>
