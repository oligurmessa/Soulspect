#!/usr/bin/env node

/**
 * Vector API Test Script
 * 
 * Tests the vector system API routes
 * Make sure the dev server is running: npm run dev
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123';

// Create Firebase-like Timestamp mock
const createTimestamp = () => ({
  toDate: () => new Date(),
  toMillis: () => Date.now(),
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0
});

// Test moment data
const testMoment = {
  id: 'test-moment-' + Date.now(),
  userId: TEST_USER_ID,
  type: 'journal',
  title: 'Test Journal Entry',
  content: 'This is a test journal entry for vector indexing. It contains some emotions like happiness and gratitude. I feel really good today and want to remember this moment.',
  timestamp: createTimestamp(),
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
  mood: 5,
  emotions: ['happiness', 'gratitude'],
  triggers: ['good weather', 'success at work'],
  tags: ['personal', 'mood tracking'],
};

async function testAPI() {
  console.log('🚀 Testing Vector System API...\n');
  
  try {
    // Test 1: Check system status
    console.log('1️⃣ Testing System Status...');
    const statusResponse = await fetch(`${BASE_URL}/api/vector-system/status?userId=${TEST_USER_ID}`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('✅ Status API works');
      console.log('📊 Status:', statusData.status);
    } else {
      console.log('❌ Status API failed:', statusData.error);
    }
    console.log();

    // Test 2: Index a moment
    console.log('2️⃣ Testing Moment Indexing...');
    const indexResponse = await fetch(`${BASE_URL}/api/vector-system/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moment: testMoment, force: true }),
    });
    const indexData = await indexResponse.json();
    
    if (indexData.success) {
      console.log('✅ Indexing API works');
      console.log('📊 Result:', { vectorId: indexData.vectorId, skipped: indexData.skipped });
    } else {
      console.log('❌ Indexing API failed:', indexData.error);
    }
    console.log();

    // Test 3: Search moments
    console.log('3️⃣ Testing Vector Search...');
    const searchResponse = await fetch(`${BASE_URL}/api/vector-system/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        query: 'happiness and gratitude',
        options: { topK: 5 },
      }),
    });
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Search API works');
      console.log('📊 Results:', {
        total: searchData.total,
        method: searchData.searchMethod,
        results: searchData.results?.length || 0,
      });
      
      if (searchData.results?.length > 0) {
        console.log('🔍 Top result:', {
          momentId: searchData.results[0].momentId,
          score: searchData.results[0].score,
          preview: searchData.results[0].preview?.substring(0, 100) + '...',
        });
      }
    } else {
      console.log('❌ Search API failed:', searchData.error);
    }
    console.log();

    // Test 4: Search with filters
    console.log('4️⃣ Testing Filtered Search...');
    const filteredSearchResponse = await fetch(`${BASE_URL}/api/vector-system/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        query: 'good day',
        options: {
          topK: 3,
          type: 'journal',
          moodRange: { min: 4, max: 6 },
        },
      }),
    });
    const filteredSearchData = await filteredSearchResponse.json();
    
    if (filteredSearchData.success) {
      console.log('✅ Filtered search API works');
      console.log('📊 Results:', {
        total: filteredSearchData.total,
        method: filteredSearchData.searchMethod,
      });
    } else {
      console.log('❌ Filtered search API failed:', filteredSearchData.error);
    }
    console.log();

    // Test 5: Check status after indexing
    console.log('5️⃣ Checking Status After Indexing...');
    const finalStatusResponse = await fetch(`${BASE_URL}/api/vector-system/status?userId=${TEST_USER_ID}`);
    const finalStatusData = await finalStatusResponse.json();
    
    if (finalStatusData.success) {
      console.log('✅ Final status check successful');
      console.log('📊 Final Status:', {
        indexed: finalStatusData.status.indexed,
        health: finalStatusData.status.health,
        provider: finalStatusData.status.provider,
      });
    } else {
      console.log('❌ Final status check failed:', finalStatusData.error);
    }

    console.log('\n🎉 Vector API Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAPI().catch(console.error);