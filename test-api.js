// Simple test file to verify API URL resolution
import { apiUrl } from './src/config/api.js';

console.log('Testing API URL resolution:');
console.log('apiUrl("/auth/login"):', apiUrl('/auth/login'));

// Test fetch to see if it works
fetch(apiUrl('/auth/login'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@celyspets.com', password: 'admin123' })
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Fetch error:', error);
});
