const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB Atlas connection
async function testConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    console.log('Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ test: 'Connection successful!' });
    await testDoc.save();
    console.log('✅ Test document created successfully!');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up!');
    
    await mongoose.disconnect();
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Possible fixes:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Make sure the database user exists in MongoDB Atlas');
      console.log('3. Verify the user has read/write permissions');
    }
    
    if (error.message.includes('network')) {
      console.log('\n💡 Possible fixes:');
      console.log('1. Check your internet connection');
      console.log('2. Verify Network Access settings in MongoDB Atlas');
      console.log('3. Make sure your IP address is whitelisted');
    }
    
    process.exit(1);
  }
}

testConnection();
