-- Update kategori enum to support SD, SMP, SMA
ALTER TABLE `pendaftaran_lakaraja` 
MODIFY COLUMN `kategori` enum('SD','SMP','SMA') NOT NULL DEFAULT 'SMA';

-- Also make sure users_lakaraja has username field if using username login
ALTER TABLE `users_lakaraja` 
ADD COLUMN IF NOT EXISTS `username` varchar(100) UNIQUE AFTER `id`;

-- Update users_lakaraja to allow NULL email if username is primary
ALTER TABLE `users_lakaraja`
MODIFY COLUMN `email` varchar(255) DEFAULT NULL;

ALTER TABLE `users_lakaraja`
MODIFY COLUMN `nama_lengkap` varchar(255) DEFAULT NULL;
