require('dotenv').config({ path: '.env.production.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- Suppliers Table ---');
  const { data: s, error: se } = await supabase.from('suppliers').select('*').limit(1);
  if (se) console.error(se);
  else if (s.length) console.log(Object.keys(s[0]));
  else console.log('No rows in suppliers');

  console.log('\n--- Experiences Table ---');
  const { data: e, error: ee } = await supabase.from('experiences').select('*').limit(1);
  if (ee) console.error(ee);
  else if (e.length) console.log(Object.keys(e[0]));
  else console.log('No rows in experiences');
}

inspect();
