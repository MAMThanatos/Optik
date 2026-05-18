<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/koneksi.php';

$qExp = "
    SELECT 
        e.id_pengeluaran as id, 
        e.tanggal, 
        e.kategori, 
        e.keterangan, 
        e.nominal,
        p.nama_lengkap as kasirNama,
        e.id_pengguna as kasirId
    FROM pengeluaran e
    LEFT JOIN pengguna p ON e.id_pengguna = p.id_pengguna
    ORDER BY e.tanggal DESC
";

$resExp = mysqli_query($conn, $qExp);
$expenses = [];

if($resExp) {
    while($row = mysqli_fetch_assoc($resExp)) {
        $row['nominal'] = (float)$row['nominal'];
        $expenses[] = $row;
    }
}

echo json_encode(["status" => "success", "data" => $expenses]);
?>
