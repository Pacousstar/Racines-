// Portable Doctor: vérifie la BD du portable et l'absence des liens 'Transferts'
const fs = require('fs');
const path = require('path');
let Database;
try { Database = require('better-sqlite3'); } catch {
  console.log('⚠ better-sqlite3 non installé. Lancez: npm i -D better-sqlite3');
  process.exit(1);
}

function findPortableDb() {
  const candidates = [
    path.join(process.cwd(), 'GestiCom-Portable', 'data', 'gesticom.db'),
    path.join(process.cwd(), 'data', 'gesticom.db'),
    'C:/GestiCom-Portable/gesticom.db',
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

function checkDb(file) {
  try {
    const db = new Database(file, { readonly: true });
    const row = (sql)=>{ try { return db.prepare(sql).get()||{count:0}; } catch { return {count:0}; } };
    const ventes = row('SELECT COUNT(*) as count FROM Vente');
    const clients = row('SELECT COUNT(*) as count FROM Client');
    const produits = row('SELECT COUNT(*) as count FROM Produit');
    const achats = row('SELECT COUNT(*) as count FROM Achat');
    console.log('📦 Base détectée:', file);
    console.log('  - Ventes   :', ventes.count);
    console.log('  - Clients  :', clients.count);
    console.log('  - Produits :', produits.count);
    console.log('  - Achats   :', achats.count);
    try { db.close(); } catch {}
    return true;
  } catch (e) {
    console.error('✗ Impossible d\'ouvrir la base:', e.message);
    return false;
  }
}

function searchTransfertsRefs() {
  const roots = [path.join(process.cwd(), 'app')];
  let found = [];
  const needle = /\/dashboard\/transferts|transferts/i;
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(tsx|ts|js|jsx|md)$/.test(e.name)) continue;
      let txt='';
      try { txt = fs.readFileSync(p,'utf8'); } catch { continue; }
      if (needle.test(txt)) found.push(p.replace(process.cwd()+path.sep, ''));
    }
  }
  roots.forEach(walk);
  found = found.filter(p => !p.includes('/dashboard/transferts/page')); // page supprimée attendue
  if (found.length === 0) {
    console.log('✅ Aucune référence active à \'Transferts\' dans le code app/');
  } else {
    console.log('⚠ Références \"Transferts\" encore présentes:');
    for (const f of found) console.log('  -', f);
  }
}

console.log('=== GestiCom Portable Doctor ===');
const dbFile = findPortableDb();
if (!dbFile) {
  console.log('✗ Aucune base portable trouvée (cherché GestiCom-Portable/data/gesticom.db, data/gesticom.db, C:/GestiCom-Portable/gesticom.db)');
} else {
  checkDb(dbFile);
}
console.log('\n=== Vérification code (références Transferts) ===');
searchTransfertsRefs();
console.log('\n✓ Diagnostic terminé');
