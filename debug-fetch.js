require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl);
  console.log('Key length:', supabaseKey ? supabaseKey.length : 0);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- checking experiences count ---');
  const { count, error: countError } = await supabase.from('experiences').select('*', { count: 'exact', head: true });
  if (countError) console.error('Count error:', countError);
  else console.log('Total rows:', count);

  console.log('\n--- checking status distribution ---');
  // .rpc is better for aggregations but raw sql via js sdk is tricky without a function. 
  // We'll just fetch some distinct statuses if possible or just first 100 rows to eyeball.
  const { data: rows, error: rowsError } = await supabase
    .from('experiences')
    .select('id, title, status, pin_count, last_pinned_at, images')
    .limit(20);

  if (rowsError) {
    console.error('Fetch error:', rowsError);
  } else {
    console.log(`Fetched ${rows.length} rows sample:`);
    rows.forEach(r => {
      console.log(`[${r.status}] PinCount:${r.pin_count} LastPinned:${r.last_pinned_at} ImgCount:${r.images ? r.images.length : 0} ID:${r.id}`);
    });
  }
}

inspect();
