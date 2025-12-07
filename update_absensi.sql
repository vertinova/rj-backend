USE rajawali;

-- Add username column
ALTER TABLE absensi ADD COLUMN username VARCHAR(100) AFTER user_id;

-- Add kampus column  
ALTER TABLE absensi ADD COLUMN kampus VARCHAR(100) AFTER username;

-- Add status_absensi column
ALTER TABLE absensi ADD COLUMN status_absensi ENUM('hadir', 'izin', 'sakit') DEFAULT 'hadir' AFTER kampus;

-- Add waktu_absensi column
ALTER TABLE absensi ADD COLUMN waktu_absensi TIME AFTER tanggal_absensi;

-- Modify foto_absensi to allow NULL
ALTER TABLE absensi MODIFY COLUMN foto_absensi VARCHAR(255) NULL;

SELECT 'Absensi table updated successfully!' as message;
