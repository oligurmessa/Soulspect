#!/usr/bin/env node

/**
 * Simple Vector Test - Test just the basic indexing
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-simple';

// Very simple test moment
const simpleTestMoment = {
  id: 'simple-test-' + Date.now(),
  userId: TEST_USER_ID,
  type: 'journal',
  title: 'Simple Test',
  content: 'This is a simple test moment for debugging vector indexing.',
  // Use a plain number timestamp to avoid Firebase Timestamp issues
  timestamp: Date.now(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  mood: 5,
  emotions: ['happy'],
  triggers: ['testing'],
  tags: ['debug'],
};

async function simpleTest() {
  console.log('🧪 Simple Vector Test...\n');
  
  try {
    console.log('📊 Testing basic indexing...');
    const indexResponse = await fetch(`${BASE_URL}/api/vector-system/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moment: simpleTestMoment, force: true }),
    });
    
    const indexData = await indexResponse.json();
    
    if (indexData.success) {
      console.log('✅ Simple indexing successful!');
      console.log('📊 Result:', indexData);
      
      // Now test search
      console.log('\n🔍 Testing search...');
      const searchResponse = await fetch(`${BASE_URL}/api/vector-system/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          query: 'simple test moment',
          options: { topK: 3 },
        }),
      });
      
      const searchData = await searchResponse.json();
      console.log('🔍 Search result:', searchData);
      
    } else {
      console.log('❌ Simple indexing failed:', indexData.error);
      console.log('📊 Full response:', indexData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest().catch(console.error);