#!/usr/bin/env node

/**
 * Test Server Vector Service Directly
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testServerVectorService() {
  console.log('🚀 Testing Server Vector Service...\n');
  
  try {
    // Import the service - this might fail if there are issues
    console.log('📦 Importing ServerVectorService...');
    const ServerVectorService = (await import('../src/lib/serverVectorService.js')).default;
    console.log('✅ Import successful');
    
    // Test system status
    console.log('📊 Testing getSystemStatus...');
    const status = await ServerVectorService.getSystemStatus('test-user-123');
    console.log('✅ Status check successful:', status);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testServerVectorService().catch(console.error);