const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');

try {
  console.log("1. Opening Database...");
  const db = new Database(':memory:');
  
  console.log("2. Loading Vector Extension...");
  sqliteVec.load(db);
  
  console.log("3. Verifying Version...");
  const version = db.prepare('select vec_version()').pluck().get();
  console.log(`✅ SUCCESS: Brain is active. sqlite-vec version: ${version}`);
  
} catch (e) {
  console.error("❌ FAILURE:", e);
  console.log("HINT: If this failed with 'module not found' or 'DLL load failed', the Rebuild step failed.");
}
