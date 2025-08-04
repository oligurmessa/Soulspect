#!/usr/bin/env node

/**
 * Test script to verify Firestore authentication fixes
 * Run with: node src/scripts/test-firestore-auth.js
 */

const testUserId = 'aWYBYUVk8dSW6qldAHlhIzEOyOv2';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'POST', data = null) {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));

    return { status: response.status, data: result, success: response.ok };
  } catch (error) {
    console.error(`   ❌ Error testing ${endpoint}:`, error.message);
    return { status: 0, error: error.message, success: false };
  }
}

async function runTests() {
  console.log('🔧 Testing Firestore Authentication Fixes');
  console.log('==========================================');
  console.log(`Target User ID: ${testUserId}`);
  console.log(`Base URL: ${baseUrl}`);

  const tests = [
    {
      name: 'Test Auth Endpoint (POST)',
      endpoint: '/api/test-auth',
      method: 'POST',
      data: { userId: testUserId }
    },
    {
      name: 'Test Auth Endpoint (GET)',
      endpoint: `/api/test-auth?userId=${testUserId}`,
      method: 'GET'
    },
    {
      name: 'AI Index User Data',
      endpoint: '/api/ai/index-user-data',
      method: 'POST',
      data: { userId: testUserId }
    },
    {
      name: 'AI Enhanced Chat',
      endpoint: '/api/ai/enhanced-chat',
      method: 'POST',
      data: { 
        userId: testUserId, 
        query: 'How am I feeling today?',
        mode: 'normal'
      }
    },
    {
      name: 'Get Moments',
      endpoint: `/api/moments?userId=${testUserId}&limit=5`,
      method: 'GET'
    },
    {
      name: 'Create Moment',
      endpoint: '/api/moments',
      method: 'POST',
      data: {
        momentData: {
          userId: testUserId,
          type: 'journal',
          title: 'Test Entry',
          content: 'This is a test journal entry to verify authentication works.',
          timestamp: new Date(),
          mood: 4,
          emotions: ['hopeful', 'focused']
        },
        indexForSearch: false
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.method, test.data);
    results.push({ ...test, ...result });
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Test Results Summary');
  console.log('=======================');

  let passed = 0;
  let failed = 0;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name} (${result.status})`);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
      if (result.data?.error) {
        console.log(`     Error: ${result.data.error}`);
        if (result.data.details) {
          console.log(`     Details: ${result.data.details}`);
        }
      }
    }
  });

  console.log(`\n📈 Overall Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Firestore authentication is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the detailed output above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint };