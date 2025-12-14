-- Table structure for table `users_lakaraja`
DROP TABLE IF EXISTS `users_lakaraja`;
CREATE TABLE `users_lakaraja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_telepon` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('peserta','panitia') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'peserta',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `pendaftaran_lakaraja`
DROP TABLE IF EXISTS `pendaftaran_lakaraja`;
CREATE TABLE `pendaftaran_lakaraja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nama_sekolah` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_satuan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori` enum('SD','SMP','SMA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_satuan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bukti_payment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jumlah_pasukan` int DEFAULT NULL,
  `surat_keterangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_team` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_anggota` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of member data with nama and foto',
  `is_team_complete` tinyint(1) DEFAULT '0' COMMENT 'Flag if team data is complete',
  `status_pendaftaran` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `catatan_panitia` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_registration` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status_pendaftaran`),
  KEY `idx_kategori` (`kategori`),
  CONSTRAINT `pendaftaran_lakaraja_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_lakaraja` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
