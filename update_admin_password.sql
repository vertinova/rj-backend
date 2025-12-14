-- Update Admin Password with Correct Hash
-- Password: admin123

USE rajawali;

-- Update admin password
UPDATE users 
SET password = '$2a$10$84iL5a/QhWjIEYN3p2KpOebiKFWKUBWq3kZGKPb64hGjbsPTeGkhy'
WHERE username = 'admin';

-- Verify the update
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = 'admin';
