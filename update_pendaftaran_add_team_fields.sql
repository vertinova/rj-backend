-- Add team data fields to pendaftaran_lakaraja table
ALTER TABLE `pendaftaran_lakaraja`
ADD COLUMN `jumlah_pasukan` int DEFAULT NULL AFTER `bukti_payment`,
ADD COLUMN `surat_keterangan` varchar(255) DEFAULT NULL AFTER `jumlah_pasukan`,
ADD COLUMN `foto_team` varchar(255) DEFAULT NULL AFTER `surat_keterangan`,
ADD COLUMN `data_anggota` TEXT DEFAULT NULL COMMENT 'JSON array of member data with nama and foto' AFTER `foto_team`,
ADD COLUMN `is_team_complete` BOOLEAN DEFAULT FALSE COMMENT 'Flag if team data is complete' AFTER `data_anggota`;

-- Update kategori enum to use SD/SMP/SMA instead of tim/individu
ALTER TABLE `pendaftaran_lakaraja` 
MODIFY COLUMN `kategori` enum('SD','SMP','SMA') NOT NULL;
