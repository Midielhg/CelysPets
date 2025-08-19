const jwt = require('jsonwebtoken');

// Generate development tokens
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

// Admin token (userId: '1')
const adminToken = jwt.sign({ userId: '1' }, jwtSecret);
console.log('Admin token (for development):');
console.log(adminToken);
console.log('');

// Client token (userId: '2') 
const clientToken = jwt.sign({ userId: '2' }, jwtSecret);
console.log('Client token (for development):');
console.log(clientToken);
console.log('');

console.log('Usage:');
console.log('localStorage.setItem("auth_token", "' + adminToken + '");');
