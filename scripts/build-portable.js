/**
 * Construit GestiCom-Portable (dossier à copier sur clé USB).
 * À lancer depuis la racine : npm run build:portable
 *
 * Fait : build Next, db push, copie standalone + static + public + BD dans data/
 * L'utilisateur ajoute node.exe dans GestiCom-Portable, puis lance Lancer.bat.
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const outDir = path.join(projectRoot, 'GestiCom-Portable')
const standaloneSrc = path.join(projectRoot, '.next', 'standalone')
const staticSrc = path.join(projectRoot, '.next', 'static')
const publicSrc = path.join(projectRoot, 'public')
const dbSrc = path.join(projectRoot, 'prisma', 'gesticom.db')

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
  if (fs.existsSync(cDriveDb)) {
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
    const backupC = path.join(projectRoot, 'backup-portable-C-drive-' + stamp + '.db')
    fs.mkdirSync(path.dirname(backupC), { recursive: true })
    fs.copyFileSync(cDriveDb, backupC)
    console.log('Sauvegarde de C:\\gesticom_portable_data : ' + path.basename(backupC))
  }
}

// Ne garder que les N plus récentes sauvegardes de chaque type pour éviter l'accumulation
cleanupOldBackups('backup-portable-data-')
cleanupOldBackups('backup-portable-C-drive-')

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
  if (e === 'GestiCom-Portable') continue
  cpRecursive(path.join(standaloneSrc, e), path.join(outDir, e))
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
  fs.copyFileSync(dbSrc, path.join(dataDir, 'gesticom.db'))
  console.log('Copie prisma/gesticom.db -> data/gesticom.db')
} else {
  console.warn('prisma/gesticom.db absent. Lancez npx prisma db push et npm run db:seed.')
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
   La base est dans data/gesticom.db (ou C:\\gesticom_portable_data si chemin avec espaces).
   Compte par defaut : admin / Admin@123
   Au premier lancement, le schéma de la base est mis à jour automatiquement si besoin
   (colonnes montantPaye, table Depense, etc.). Vous pouvez vous déconnecter, éteindre le PC,
   relancer plus tard : la même base est conservée.

4) Chemin avec espaces (ex. "GSN EXPETISES GROUP")
   Le launcher utilise C:\\gesticom_portable_data\\gesticom.db. Au premier lancement il copie data/ vers C:\\. Aux lancements suivants il n'ecrase plus C:\\ : vos enregistrements sont conserves. A l'arret (fermez Lancer.bat), C:\\ est recopie vers data/. Fermez toujours Lancer.bat proprement (ne tuez pas le processus).

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
} else {
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
