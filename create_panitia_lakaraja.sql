-- Create Panitia Account for Lakaraja Competition
-- Table: users_lakaraja
-- Username: panitia
-- Password: panitia123

USE rajawali;

-- Insert panitia account
INSERT INTO users_lakaraja (username, email, password, nama_lengkap, no_telepon, role, is_active)
VALUES (
    'panitia',
    'panitia@paskibmansabo.com',
    '$2a$10$dBKAHX1xKf.oAqefQvYxre9nC7oo4fY9MhDyQjIoZFZt0ihomGwLy',
    'Admin Panitia Lakaraja',
    '08123456789',
    'panitia',
    1
);

-- Verify the account
SELECT id, username, email, nama_lengkap, no_telepon, role, is_active, created_at 
FROM users_lakaraja 
WHERE username = 'panitia';
