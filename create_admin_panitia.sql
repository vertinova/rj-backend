-- Create Admin Panitia Account for Production
-- Password: admin123 (hashed with bcrypt)

USE rajawali;

-- Insert admin panitia account
-- Username: admin
-- Password: admin123
-- Email: admin@paskibmansabo.com
INSERT INTO users (username, email, password, role)
VALUES (
    'admin',
    'admin@paskibmansabo.com',
    '$2b$10$rZ5QhJxKX4vZ6K8YL9X8Ue7jYlF0oK3tN2pQ1wR4sV5uT6xW7yZ8a',
    'admin'
);

-- Verify the account
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = 'admin';
