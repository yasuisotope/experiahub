
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('experiences')
        .select('id, title, base_rate, currency, pricing_rows, raw_data')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent Experiences:');
    data.forEach(row => {
        let raw;
        try { raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data; } catch(e) { raw = {}; }
        console.log(`- ID: ${row.id}`);
        console.log(`  Title: ${row.title}`);
        console.log(`  Base Rate (Col): ${row.base_rate}`);
        console.log(`  Currency (Col): ${row.currency}`);
        console.log(`  Pricing Rows (Col):`, row.pricing_rows);
        console.log(`  Pricing Rows (Raw):`, raw?.pricingRows || raw?.pricing_rows);
        console.log('-------------------');
    });
}

check();
