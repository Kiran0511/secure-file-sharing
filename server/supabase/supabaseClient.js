require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to test Supabase connection
const testConnection = async () => {
  try {
    // Try to fetch from a table to test connection
    const { data, error } = await supabase
      .from('file_shares')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log("✅ Supabase connection established successfully.");
    return true;
  } catch (err) {
    console.error("❌ Supabase connection failed:", err.message);
    return false;
  }
};

module.exports = supabase;
module.exports.testConnection = testConnection;
