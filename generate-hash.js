const bcrypt = require('bcryptjs');

// Generate hash for password 'admin123'
bcrypt.hash('admin123', 10)
  .then(hash => {
    console.log('Password: admin123');
    console.log('Hash:', hash);
  })
  .catch(err => console.error('Error:', err));
