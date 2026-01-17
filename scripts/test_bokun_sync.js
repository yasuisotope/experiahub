
const fetch = require('node-fetch');

// CONFIG
const API_URL = 'http://localhost:3000/api/n8n/supplier/bookings/sync'; // Change to Prod URL if testing remote
const TOKEN = 'YOUR_BEARER_TOKEN'; // Optional if bypassing, but route might require it for appId check? 
// Wait, route.ts extracts appId from payload.

const payload = {
    applicationId: 'ADD_YOUR_APP_ID_HERE',
    bookings: [
        {
            id: 'BOKUN-TEST-001',
            productTitle: 'Test Experience Sync',
            customerName: 'Bokun Tester',
            date: new Date().toISOString(),
            pax: 2,
            price: 150,
            currency: 'USD',
            status: 'Confirmed'
        }
    ]
};

async function testSync() {
    try {
        console.log('Sending Sync Request...');
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testSync();
