/**
 * Construit GestiCom-Portable (dossier à copier sur clé USB).
 * À lancer depuis la racine : npm run build:portable
 *
 * RÈGLE IMPORTANTE : Le portable utilise TOUJOURS la base à jour :
 * - Sous Windows : C:\gesticom\gesticom.db (base de production) si elle existe,
 *   sinon prisma/gesticom.db. Pensez à mettre à jour C:\gesticom\gesticom.db
 *   avant chaque build:portable pour que le portable parte avec les bons produits/stocks.
 * - Fait : build Next, db push, copie standalone + static + public + BD dans data/
 * - L'utilisateur ajoute node.exe dans GestiCom-Portable, puis lance Lancer.bat.
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const outDir = path.join(projectRoot, 'GestiCom-Portable')
const standaloneSrc = path.join(projectRoot, '.next', 'standalone')
const staticSrc = path.join(projectRoot, '.next', 'static')
const publicSrc = path.join(projectRoot, 'public')

/** Toujours utiliser la base de production à jour pour le portable (C:\gesticom\gesticom.db sous Windows). */
const dbProd = process.platform === 'win32' ? path.join('C:', 'gesticom', 'gesticom.db') : path.join(projectRoot, 'prisma', 'gesticom.db')
const dbSrc = (process.platform === 'win32' && fs.existsSync(dbProd)) ? dbProd : path.join(projectRoot, 'prisma', 'gesticom.db')

/** Nombre max de sauvegardes à conserver par type (les plus récentes). Les anciennes sont supprimées. */
const MAX_BACKUPS_TO_KEEP = 2

/**
 * Supprime les anciennes sauvegardes dans projectRoot, ne garde que les MAX_BACKUPS_TO_KEEP plus récentes.
 * @param {string} pattern - Préfixe des fichiers (ex. 'backup-portable-data-', 'backup-portable-C-drive-')
 */
function cleanupOldBackups(pattern) {
  let files = []
  try {
    files = fs.readdirSync(projectRoot).filter((f) => f.startsWith(pattern) && f.endsWith('.db'))
  } catch (_) {
    return
  }
  if (files.length <= MAX_BACKUPS_TO_KEEP) return
  const withStats = files.map((f) => ({
    name: f,
    path: path.join(projectRoot, f),
    mtime: fs.statSync(path.join(projectRoot, f)).mtime.getTime(),
  }))
  withStats.sort((a, b) => b.mtime - a.mtime)
  const toRemove = withStats.slice(MAX_BACKUPS_TO_KEEP)
  for (const f of toRemove) {
    try {
      fs.unlinkSync(f.path)
      console.log('  Ancienne sauvegarde supprimée : ' + f.name)
    } catch (e) {
      console.warn('  Impossible de supprimer ' + f.name + ':', e.message)
    }
  }
}

// Supprimer un éventuel lock Next.js pour éviter "Unable to acquire lock" (build précédent interrompu)
const nextLock = path.join(projectRoot, '.next', 'lock')
if (fs.existsSync(nextLock)) {
  try {
    fs.unlinkSync(nextLock)
    console.log('Lock .next/lock supprime (build precedent interrompu).')
  } catch (_) {}
}

// Supprimer .next/standalone avant le build pour éviter ENOTEMPTY (Next tente un rmdir sur un dossier non vide sous Windows)
const standaloneDir = path.join(projectRoot, '.next', 'standalone')
if (fs.existsSync(standaloneDir)) {
  try {
    fs.rmSync(standaloneDir, { recursive: true, force: true, maxRetries: 3 })
    console.log('Dossier .next/standalone supprime (rebuild propre pour eviter ENOTEMPTY).')
  } catch (e) {
    console.warn('Impossible de supprimer .next/standalone:', e.message)
    console.warn('Fermez Cursor/IDE et tout processus utilisant ce dossier, puis relancez npm run build:portable.')
  }
}

console.log('Build GestiCom (prisma + next)...')
execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })

if (!fs.existsSync(standaloneSrc)) {
  console.error('Erreur: .next/standalone introuvable.')
  process.exit(1)
}

function rmDirSafe(dir) {
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  } catch (e) {
    if (e.code === 'EBUSY' || e.errno === -4082) {
      console.error('GestiCom-Portable est verrouillé. Fermez Lancer.bat et l\'Explorateur, puis relancez.')
      process.exit(1)
    }
    throw e
  }
}

// Sauvegarde de la base portable AVANT de supprimer le dossier (pour ne pas perdre les enregistrements)
let backupPortableDb = null
const oldDataDb = path.join(outDir, 'data', 'gesticom.db')
if (fs.existsSync(oldDataDb)) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
  backupPortableDb = path.join(projectRoot, 'backup-portable-data-' + stamp + '.db')
  fs.mkdirSync(path.dirname(backupPortableDb), { recursive: true })
  fs.copyFileSync(oldDataDb, backupPortableDb)
  console.log('Sauvegarde de la base portable : ' + path.basename(backupPortableDb))
}
if (process.platform === 'win32') {
  const cDriveDb = path.join('C:', 'gesticom_portable_data', 'gesticom.db')
  const localAppDataDb = path.join(process.env.LOCALAPPDATA || '', 'GestiComPortable', 'gesticom.db')
  for (const db of [cDriveDb, localAppDataDb]) {
    if (db && fs.existsSync(db)) {
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
      const name = db.includes('GestiComPortable') ? 'backup-portable-appdata-' : 'backup-portable-C-drive-'
      const backupFile = path.join(projectRoot, name + stamp + '.db')
      fs.mkdirSync(path.dirname(backupFile), { recursive: true })
      fs.copyFileSync(db, backupFile)
      console.log('Sauvegarde base portable : ' + path.basename(backupFile))
    }
  }
}

// Ne garder que les N plus récentes sauvegardes de chaque type pour éviter l'accumulation
cleanupOldBackups('backup-portable-data-')
cleanupOldBackups('backup-portable-C-drive-')
cleanupOldBackups('backup-portable-appdata-')

rmDirSafe(outDir)
fs.mkdirSync(outDir, { recursive: true })

function cpRecursive(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const e of fs.readdirSync(src)) {
      if (e === 'GestiCom-Portable') continue
      cpRecursive(path.join(src, e), path.join(dest, e))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

console.log('Copie .next/standalone...')
for (const e of fs.readdirSync(standaloneSrc)) {
  if (e === 'GestiCom-Portable' || e === 'Projets') continue
  cpRecursive(path.join(standaloneSrc, e), path.join(outDir, e))
}

// S'assurer que server.js est à la racine du portable (Next peut le mettre dans un sous-dossier en monorepo)
function findServerJs(dir) {
  const p = path.join(dir, 'server.js')
  if (fs.existsSync(p)) return p
  try {
    for (const e of fs.readdirSync(dir)) {
      const full = path.join(dir, e)
      if (fs.statSync(full).isDirectory() && e !== 'node_modules' && e !== '.next') {
        const found = findServerJs(full)
        if (found) return found
      }
    }
  } catch (_) {}
  return null
}
const serverJsDest = path.join(outDir, 'server.js')
if (!fs.existsSync(serverJsDest)) {
  const found = findServerJs(outDir)
  if (found) {
    fs.copyFileSync(found, serverJsDest)
    console.log('Copie server.js vers la racine du portable.')
  } else {
    const inStandalone = path.join(standaloneSrc, 'server.js')
    if (fs.existsSync(inStandalone)) fs.copyFileSync(inStandalone, serverJsDest)
  }
}
if (!fs.existsSync(serverJsDest)) {
  console.error('Erreur: server.js introuvable dans .next/standalone. Relancez npm run build puis npm run build:portable.')
  process.exit(1)
}

const nextDir = path.join(outDir, '.next')
if (!fs.existsSync(nextDir)) fs.mkdirSync(nextDir, { recursive: true })
if (!fs.existsSync(staticSrc)) {
  console.error('Erreur: .next/static absent.')
  process.exit(1)
}
fs.cpSync(staticSrc, path.join(nextDir, 'static'), { recursive: true })
console.log('Copie .next/static')

if (fs.existsSync(publicSrc)) {
  cpRecursive(publicSrc, path.join(outDir, 'public'))
  console.log('Copie public/')
}

const dataDir = path.join(outDir, 'data')
fs.mkdirSync(dataDir, { recursive: true })
execSync('npx prisma db push', { cwd: projectRoot, stdio: 'inherit' })
if (fs.existsSync(dbSrc)) {
  const destDb = path.join(dataDir, 'gesticom.db')
  fs.copyFileSync(dbSrc, destDb)
  const sourceLabel = (dbSrc.indexOf('C:') !== -1 && dbSrc.indexOf('gesticom') !== -1) ? 'C:\\gesticom\\gesticom.db (base de production)' : 'prisma/gesticom.db'
  console.log('Base utilisee pour le portable : ' + sourceLabel)
  console.log('  -> Copie vers GestiCom-Portable/data/gesticom.db')
  if (dbSrc === dbProd) {
    console.log('  (Rappel : le portable part toujours avec cette base a jour. Voir docs/CONVENTION_BASE_PORTABLE.md)')
  }
} else {
  console.warn('Base source absente. Utilisez C:\\gesticom\\gesticom.db ou prisma/gesticom.db (npx prisma db push, npm run db:seed).')
}
if (backupPortableDb) {
  console.log('')
  console.log('>>> Pour restaurer vos enregistrements du portable : copiez')
  console.log('    ' + path.basename(backupPortableDb) + ' vers GestiCom-Portable/data/gesticom.db')
  console.log('')
}

fs.copyFileSync(
  path.join(projectRoot, 'scripts', 'portable-launcher.js'),
  path.join(outDir, 'portable-launcher.js')
)
fs.copyFileSync(
  path.join(projectRoot, 'scripts', 'ensure-schema.js'),
  path.join(outDir, 'ensure-schema.js')
)
console.log('Copie portable-launcher.js et ensure-schema.js')

const bat = `@echo off
cd /d "%~dp0"
if not exist "%~dp0node.exe" (
  echo Ajoutez node.exe dans ce dossier. Telechargez le zip Windows depuis nodejs.org.
  pause
  exit /b 1
)
if not exist "%~dp0data\\gesticom.db" (
  echo data\\gesticom.db manquant. Relancez "npm run build:portable" depuis le projet.
  pause
  exit /b 1
)
"%~dp0node.exe" "%~dp0portable-launcher.js"
if errorlevel 1 pause
`
fs.writeFileSync(path.join(outDir, 'Lancer.bat'), bat, 'utf8')

const vbs = `Set F = CreateObject("Scripting.FileSystemObject")
Set W = CreateObject("Wscript.Shell")
d = F.GetParentFolderName(WScript.ScriptFullName)
W.Run """" & d & "\\node.exe" & """" & " " & """" & d & "\\portable-launcher.js" & """", 0, False
`
fs.writeFileSync(path.join(outDir, 'Lancer.vbs'), vbs, 'utf8')

const readme = `GestiCom — Version portable
============================

1) Ajouter node.exe dans CE dossier
   Telechargez Node.js LTS (zip Windows) : https://nodejs.org/dist/
   Extrayez node.exe dans GestiCom-Portable.

2) Lancer
   Double-clic sur Lancer.vbs (sans fenêtre) ou Lancer.bat (avec fenêtre).
   Une seule fenêtre navigateur s'ouvre sur http://localhost:3000

3) Donnees
   La base est dans data/gesticom.db.
   Compte par defaut : admin / Admin@123
   Au premier lancement, le schéma de la base est mis à jour automatiquement si besoin
   (colonnes montantPaye, table Depense, etc.). Vous pouvez vous déconnecter, éteindre le PC,
   relancer plus tard : la même base est conservée.

4) Ou enregistrer les donnees (IMPORTANT)
   Pour le MEME comportement qu'en developpement : copiez ce dossier dans un chemin SANS ESPACES.
   Exemples : C:\\GestiCom-Portable   ou   D:\\GestiCom-Portable
   Les donnees seront alors dans data/gesticom.db (comme en dev). Si le chemin contient des espaces
   (ex. Bureau "CA ENTREPRISE"), la base est copiee vers %LOCALAPPDATA%\\GestiComPortable.
   A l'arret : fermez toujours Lancer.bat proprement.

5) Mise a jour du portable
   Depuis le dossier du projet (ou se trouve package.json) : npm run build:portable
   Puis recopiez node.exe dans GestiCom-Portable si le dossier a ete recree.

6) Si erreur serveur liee a la base (colonnes manquantes, etc.)
   - Arretez le portable (fermez Lancer.bat).
   - Au prochain lancement, ensure-schema.js met à jour la base automatiquement.
   - Depuis le projet : npm run portable:ensure-schema (avec DATABASE_URL pointant vers la base),
     puis recopiez data/gesticom.db si besoin.
`
fs.writeFileSync(path.join(outDir, 'README-Portable.txt'), readme, 'utf8')

// Copier le guide d'installation si disponible
const guideInstallPath = path.join(projectRoot, 'docs', 'GUIDE_INSTALLATION_PORTABLE.md')
if (fs.existsSync(guideInstallPath)) {
  fs.copyFileSync(guideInstallPath, path.join(outDir, 'GUIDE_INSTALLATION_PORTABLE.md'))
  console.log('Copie GUIDE_INSTALLATION_PORTABLE.md')
}

// Copier le guide utilisateur si disponible
const guideUserPath = path.join(projectRoot, 'docs', 'GUIDE_UTILISATEUR.md')
if (fs.existsSync(guideUserPath)) {
  fs.copyFileSync(guideUserPath, path.join(outDir, 'GUIDE_UTILISATEUR.md'))
  console.log('Copie GUIDE_UTILISATEUR.md')
}
// Copier le guide d'utilisation pratique (navigation et menus)
const guidePratiquePath = path.join(projectRoot, 'docs', 'GUIDE_UTILISATION_PRATIQUE.md')
if (fs.existsSync(guidePratiquePath)) {
  fs.copyFileSync(guidePratiquePath, path.join(outDir, 'GUIDE_UTILISATION_PRATIQUE.md'))
  console.log('Copie GUIDE_UTILISATION_PRATIQUE.md')
}
if (!fs.existsSync(guideUserPath)) {
  // Créer un guide utilisateur basique si absent
  const guideUserBasic = `# Guide Utilisateur - GestiCom Portable

## Démarrage Rapide

1. Double-cliquez sur **Lancer.vbs** (ou **Lancer.bat**)
2. Le navigateur s'ouvre sur **http://localhost:3000**
3. Connectez-vous avec : **admin** / **Admin@123**
4. Changez le mot de passe après la première connexion

## Utilisation

- **Démarrer** : Double-clic sur Lancer.vbs
- **Arrêter** : Fermer la fenêtre Lancer.bat

## Sauvegarde

Utilisez la fonction "Sauvegarde de la base" dans l'application (menu Paramètres).

Pour plus de détails, consultez GUIDE_INSTALLATION_PORTABLE.md
`
  fs.writeFileSync(path.join(outDir, 'GUIDE_UTILISATEUR.md'), guideUserBasic, 'utf8')
  console.log('Création GUIDE_UTILISATEUR.md')
}

console.log('')
console.log('OK. Dossier créé : ' + outDir)
console.log('  - Ajoutez node.exe (zip depuis nodejs.org)')
console.log('  - Double-clic sur Lancer.vbs ou Lancer.bat')
console.log('  - Consultez GUIDE_INSTALLATION_PORTABLE.md pour les instructions complètes')
console.log('')
