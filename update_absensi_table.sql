-- Update absensi table to match PHP version structure
-- Run this SQL in your MySQL database

USE rajawali;

-- Add new columns if they don't exist
ALTER TABLE absensi 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) AFTER user_id,
ADD COLUMN IF NOT EXISTS kampus VARCHAR(100) AFTER username,
ADD COLUMN IF NOT EXISTS status_absensi ENUM('hadir', 'izin', 'sakit') DEFAULT 'hadir' AFTER kampus,
ADD COLUMN IF NOT EXISTS waktu_absensi TIME AFTER tanggal_absensi;

-- Modify foto_absensi to allow NULL (for izin/sakit)
ALTER TABLE absensi 
MODIFY COLUMN foto_absensi VARCHAR(255) NULL;

-- Update existing records with default values
UPDATE absensi 
SET status_absensi = 'hadir' 
WHERE status_absensi IS NULL;

UPDATE absensi 
SET waktu_absensi = '08:00:00' 
WHERE waktu_absensi IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_status_absensi ON absensi(status_absensi);
CREATE INDEX IF NOT EXISTS idx_kampus ON absensi(kampus);

SELECT 'Absensi table updated successfully!' as message;
