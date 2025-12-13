-- Create table for Peserta Lakaraja
CREATE TABLE IF NOT EXISTS `peserta_lakaraja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_tim` varchar(255) NOT NULL,
  `nama_ketua` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `no_telepon` varchar(20) NOT NULL,
  `asal_sekolah` varchar(255) NOT NULL,
  `alamat_sekolah` text,
  `kategori` enum('tim','individu') NOT NULL DEFAULT 'tim',
  `jumlah_anggota` int DEFAULT 1,
  `status_pendaftaran` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_kategori` (`kategori`),
  KEY `idx_status` (`status_pendaftaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
