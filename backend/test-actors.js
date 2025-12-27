/**
 * Test script to compare Apify actors
 * Run with: node test-actors.js
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config();

const client = new ApifyClient({
  token: process.env.APIFY_API_KEY,
});

async function testActor(actorId, query, location) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Actor: ${actorId}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Prepare input - try different parameter combinations
    const inputOptions = [
      { keyword: query, maxItems: 2 },
      { searchQuery: query, maxItems: 2 },
      { query: query, maxItems: 2 },
    ];

    if (location) {
      inputOptions.forEach(opt => {
        opt.location = location;
        opt.city = location;
      });
    }

    let success = false;
    let result = null;

    for (const input of inputOptions) {
      try {
        console.log(`Trying input:`, JSON.stringify(input, null, 2));
        
        const run = await client.actor(actorId).call(input);
        console.log(`Run started: ${run.id}, status: ${run.status}`);

        // Wait for completion
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
          success = true;
          result = items;
          console.log(`✅ Success! Got ${items.length} results`);
          break;
        }
      } catch (error) {
        console.log(`❌ Failed with this input:`, error.message);
        continue;
      }
    }

    if (!success) {
      console.log(`❌ All input variations failed for ${actorId}`);
      return null;
    }

    // Analyze the first result
    const sample = result[0];
    console.log(`\n📊 Sample Result Structure:`);
    console.log(`Keys: ${Object.keys(sample).join(', ')}`);
    console.log(`\n📋 Sample Data:`);
    console.log(JSON.stringify(sample, null, 2));

    // Check for important fields
    const checks = {
      'company_name': sample.company_name || sample.companyName,
      'company_id': sample.company_id || sample.companyId,
      'company_url': sample.company_url || sample.companyUrl,
      'location': sample.location || sample.address || sample.city || sample.province,
      'phone': sample.phone || sample.contactPhone || sample.tel,
      'email': sample.email || sample.contactEmail || sample.mail,
      'address': sample.address || sample.companyAddress,
      'product_name': sample.product_name || sample.productName || sample.title,
      'price': sample.min_price || sample.price || sample.minPrice,
      'moq': sample.min_order || sample.moq || sample.minOrder,
    };

    console.log(`\n✅ Field Availability:`);
    Object.entries(checks).forEach(([field, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${field}: ${value || 'MISSING'}`);
    });

    return {
      actorId,
      success: true,
      resultCount: result.length,
      sample,
      fields: checks,
      allKeys: Object.keys(sample),
    };

  } catch (error) {
    console.log(`\n❌ Error testing ${actorId}:`, error.message);
    if (error.stack) {
      console.log(error.stack);
    }
    return {
      actorId,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  const query = 'LED';
  const location = 'Shenzhen';

  console.log(`\n🔍 Testing Apify Actors`);
  console.log(`Query: ${query}`);
  console.log(`Location: ${location}\n`);

  const actors = [
    'agenscrape/made-in-china-com-product-scraper',
    'parseforge/made-in-china-scraper',
  ];

  const results = [];

  for (const actorId of actors) {
    const result = await testActor(actorId, query, location);
    results.push(result);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Comparison
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 COMPARISON SUMMARY`);
  console.log(`${'='.repeat(60)}\n`);

  results.forEach(result => {
    if (result.success) {
      console.log(`\n${result.actorId}:`);
      console.log(`  Results: ${result.resultCount}`);
      console.log(`  Available Fields: ${result.allKeys.length}`);
      console.log(`  Has Location: ${result.fields.location ? '✅' : '❌'}`);
      console.log(`  Has Phone: ${result.fields.phone ? '✅' : '❌'}`);
      console.log(`  Has Email: ${result.fields.email ? '✅' : '❌'}`);
      console.log(`  Has Address: ${result.fields.address ? '✅' : '❌'}`);
    } else {
      console.log(`\n${result.actorId}: ❌ Failed - ${result.error}`);
    }
  });
}

main().catch(console.error);

