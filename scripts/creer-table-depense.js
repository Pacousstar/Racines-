/**
 * Crée la table Depense dans prisma/gesticom.db quand Prisma dit "already in sync"
 * mais que la table est absente (désynchronisation).
 * À lancer depuis le dossier gesticom : node scripts/creer-table-depense.js
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const dbPath = path.join(projectRoot, 'prisma', 'gesticom.db')

if (!fs.existsSync(dbPath)) {
  console.error('Erreur: prisma/gesticom.db introuvable.')
  process.exit(1)
}

let db
try {
  db = require('better-sqlite3')(dbPath)
} catch (e) {
  console.error('Erreur: better-sqlite3 requis. Lancez: npm install')
  process.exit(1)
}

const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Depense'").get()
if (tableExists) {
  console.log('La table Depense existe déjà.')
  db.close()
  process.exit(0)
}

console.log('Création de la table Depense dans prisma/gesticom.db...')

// Schéma équivalent au model Depense (Prisma/SQLite)
db.exec(`
CREATE TABLE "Depense" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "magasinId" INTEGER,
  "entiteId" INTEGER NOT NULL,
  "utilisateurId" INTEGER NOT NULL,
  "categorie" TEXT NOT NULL,
  "libelle" TEXT NOT NULL,
  "montant" REAL NOT NULL,
  "modePaiement" TEXT NOT NULL,
  "beneficiaire" TEXT,
  "pieceJustificative" TEXT,
  "observation" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id"),
  FOREIGN KEY ("entiteId") REFERENCES "Entite"("id"),
  FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id")
);
CREATE INDEX "Depense_date_idx" ON "Depense"("date");
CREATE INDEX "Depense_categorie_idx" ON "Depense"("categorie");
CREATE INDEX "Depense_magasinId_idx" ON "Depense"("magasinId");
`)

db.close()
console.log('OK. Table Depense créée.')
console.log('Ensuite : npm run portable:copy-db')
console.log('')
