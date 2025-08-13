const bcrypt = require('bcryptjs');
const { User } = require('../dist/models');

async function createClientUser() {
  try {
    console.log('Checking for client user...');
    let user = await User.findOne({ where: { email: 'client@celyspets.com' } });
    
    if (!user) {
      console.log('Client user not found, creating one...');
      const hashedPassword = await bcrypt.hash('client123', 12);
      user = await User.create({
        email: 'client@celyspets.com',
        password: hashedPassword,
        name: 'Test Client',
        role: 'client'
      });
      console.log('Created client user with ID:', user.id);
    } else {
      console.log('Found existing client user with ID:', user.id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createClientUser();
