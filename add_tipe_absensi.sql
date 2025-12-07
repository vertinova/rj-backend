-- Add tipe_absensi column to absensi table
-- Run this SQL to update your database

USE rajawali;

-- Add tipe_absensi column after status_absensi
ALTER TABLE absensi 
ADD COLUMN tipe_absensi ENUM('datang', 'pulang') DEFAULT 'datang' AFTER status_absensi;

-- Add index for better query performance
CREATE INDEX idx_tipe_absensi ON absensi(tipe_absensi);

-- Update existing records to have default value
UPDATE absensi 
SET tipe_absensi = 'datang' 
WHERE tipe_absensi IS NULL;

SELECT 'Tipe absensi column added successfully!' as message;
SELECT 'Total records updated:' as info, COUNT(*) as count FROM absensi;
