// Nettoyage des caches Next.js et TypeScript
// Utilise fs-extra (déjà dans dependencies)
const fs = require('fs-extra');
const path = require('path');

async function removeIfExists(p) {
  try {
    if (await fs.pathExists(p)) {
      await fs.remove(p);
      console.log(`✓ Supprimé: ${p}`);
    } else {
      console.log(`(déjà absent) ${p}`);
    }
  } catch (e) {
    console.error(`✗ Erreur suppression ${p}:`, e.message);
  }
}

(async () => {
  const targets = [
    path.join(process.cwd(), '.next'),
    path.join(process.cwd(), 'node_modules', '.cache'),
  ];
  console.log('=== Nettoyage des caches ===');
  for (const t of targets) {
    await removeIfExists(t);
  }
  console.log('=== Nettoyage terminé ===');
})();