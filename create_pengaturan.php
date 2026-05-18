<?php
include_once 'config/koneksi.php';

$queries = [
    "CREATE TABLE IF NOT EXISTS `pengaturan` (
      `id_pengaturan` int(11) NOT NULL AUTO_INCREMENT,
      `nama_toko` varchar(100) NOT NULL,
      `alamat` text DEFAULT NULL,
      `telepon` varchar(20) DEFAULT NULL,
      `pesan_struk` text DEFAULT NULL,
      PRIMARY KEY (`id_pengaturan`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
    "INSERT INTO `pengaturan` (`id_pengaturan`, `nama_toko`, `alamat`, `telepon`, `pesan_struk`) 
     SELECT 1, 'OPTIK LUCKY PRASTICA', 'Jl. Merdeka No. 123, Jakarta', '(021) 1234-5678', 'Terima kasih atas kunjungan Anda.\\nBarang yang sudah dibeli tidak dapat dikembalikan.\\nGaransi frame 1 tahun.'
     WHERE NOT EXISTS (SELECT * FROM `pengaturan` WHERE `id_pengaturan` = 1);"
];

foreach ($queries as $q) {
    if(mysqli_query($conn, $q)) {
        echo "Success: $q <br>";
    } else {
        echo "Error: " . mysqli_error($conn) . " on $q <br>";
    }
}
?>
