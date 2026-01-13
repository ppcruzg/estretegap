import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('items').select('*').limit(1);
    if (error) {
        console.error('Error fetching items:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns in items table:', Object.keys(data[0]));
    } else {
        console.log('No items found to check columns.');
    }
}

checkColumns();
