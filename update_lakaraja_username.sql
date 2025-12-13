-- Update users_lakaraja table to use username instead of email as primary identifier

-- Add username column
ALTER TABLE users_lakaraja 
ADD COLUMN username VARCHAR(100) AFTER id;

-- Make username unique
ALTER TABLE users_lakaraja
ADD UNIQUE KEY unique_username (username);

-- Update email: make it nullable and remove unique constraint
ALTER TABLE users_lakaraja
MODIFY COLUMN email VARCHAR(255) NULL;

-- Drop unique constraint on email if exists
ALTER TABLE users_lakaraja
DROP INDEX email;

-- Make nama_lengkap nullable
ALTER TABLE users_lakaraja
MODIFY COLUMN nama_lengkap VARCHAR(255) NULL;
