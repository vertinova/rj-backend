-- Drop old table if exists
DROP TABLE IF EXISTS `peserta_lakaraja`;

-- Create table for Lakaraja Users (Account)
CREATE TABLE IF NOT EXISTS `users_lakaraja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `no_telepon` varchar(20) NOT NULL,
  `role` enum('peserta','panitia') NOT NULL DEFAULT 'peserta',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for Lakaraja Competition Registration
CREATE TABLE IF NOT EXISTS `pendaftaran_lakaraja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nama_sekolah` varchar(255) NOT NULL,
  `nama_satuan` varchar(255) NOT NULL,
  `kategori` enum('tim','individu') NOT NULL DEFAULT 'tim',
  `logo_satuan` varchar(255) DEFAULT NULL,
  `bukti_payment` varchar(255) DEFAULT NULL,
  `status_pendaftaran` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `catatan_panitia` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status_pendaftaran`),
  FOREIGN KEY (`user_id`) REFERENCES `users_lakaraja` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default panitia account (password: panitia123)
INSERT INTO `users_lakaraja` (`email`, `password`, `nama_lengkap`, `no_telepon`, `role`) 
VALUES ('panitia@lakaraja.com', '$2a$10$XQq8QJZxVXxFJ6qGx6EHG.TLI5gm9vKGx7o5YLZKxFKz4BPVQGq4W', 'Panitia Lakaraja', '081234567890', 'panitia');
