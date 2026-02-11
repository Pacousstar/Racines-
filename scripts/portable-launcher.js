/**
 * Lanceur GestiCom portable — UNE SEULE LOGIQUE pour tous les PC.
 * Sous Windows : TOUJOURS utiliser %LOCALAPPDATA%\GestiComPortable\gesticom.db.
 * Ainsi le même dossier portable fonctionne partout (dev, prod, Bureau, C:\, clé USB) et
 * tous les enregistrements (ventes, achats, clients, etc.) sont bien sauvegardés.
 */

const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')

const base = __dirname
const dataDir = path.join(base, 'data')
const dbPath = path.join(dataDir, 'gesticom.db')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(dbPath)) {
  console.error('Erreur: data/gesticom.db manquant. Lancez npm run build:portable depuis le projet.')
  process.exit(1)
}

/** URL file: pour SQLite. Encode les espaces en %20. */
function toFileUrl(p) {
  const s = path.resolve(p).replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '$1:')
  return 'file:' + encodeURI(s).replace(/^file%3A/, 'file:')
}

function getPortableDataDir() {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || os.homedir(), 'AppData', 'Local')
    return path.join(localAppData, 'GestiComPortable')
  }
  return path.join(os.homedir(), '.gesticom_portable')
}

// Windows : TOUJOURS utiliser LOCALAPPDATA (un seul chemin, aucun souci d'espaces ni de droits).
let dbUrl = toFileUrl(dbPath)
let dbToUse = dbPath
let useFallback = false

if (process.platform === 'win32') {
  const portableDataDir = getPortableDataDir()
  const fallback = path.join(portableDataDir, 'gesticom.db')
  const fallbackDir = path.dirname(fallback)
  try {
    if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true })
    const fallbackExists = fs.existsSync(fallback)
    const dataStat = fs.statSync(dbPath)
    const dataNewer = fallbackExists ? (dataStat.mtime.getTime() > fs.statSync(fallback).mtime.getTime()) : true
    const dataLarger = fallbackExists ? (dataStat.size > fs.statSync(fallback).size) : true
    if (!fallbackExists || dataNewer || dataLarger) {
      fs.copyFileSync(dbPath, fallback)
      dbUrl = toFileUrl(fallback)
      dbToUse = fallback
      useFallback = true
      const sizeKo = Math.round(fs.statSync(fallback).size / 1024)
      console.log('Base data/gesticom.db (' + sizeKo + ' Ko) copiee vers ' + portableDataDir + '.')
    } else {
      dbUrl = toFileUrl(fallback)
      dbToUse = fallback
      useFallback = true
      const sizeKo = Math.round(fs.statSync(fallback).size / 1024)
      console.log('Base ' + fallback + ' (' + sizeKo + ' Ko) utilisee.')
    }
  } catch (e) {
    console.warn('Impossible d\'utiliser ' + portableDataDir + ':', e.message)
  }
}

console.log('')
console.log('=== GestiCom Portable ===')
console.log('DONNEES ENREGISTREES DANS :')
console.log('  ' + dbToUse)
console.log('(ventes, achats, stock, clients, fournisseurs, caisse, depenses, charges)')
console.log('')

process.env.NODE_ENV = 'production'
process.env.PORT = process.env.PORT || '3000'
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0'
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'GestiCom-Portable-ChangeMe-InProduction-32c'
process.env.DATABASE_URL = dbUrl

// Source unique d'URL : LOCALAPPDATA (le serveur lira ce fichier, pas le .env du portable).
const portableDataDir = getPortableDataDir()
if (process.platform === 'win32') {
  try {
    if (!fs.existsSync(portableDataDir)) fs.mkdirSync(portableDataDir, { recursive: true })
    fs.writeFileSync(path.join(portableDataDir, 'database_url.txt'), dbUrl, 'utf8')
  } catch (e) {
    console.warn('Impossible d\'écrire database_url.txt:', e.message)
  }
}
fs.writeFileSync(path.join(base, '.database_url'), dbUrl, 'utf8')

// Ne PAS mettre DATABASE_URL dans .env : évite qu'un .env copié d'un autre PC écrase l'URL sur ce PC.
const envContent = [
  'NODE_ENV=production',
  'PORT=' + process.env.PORT,
  'SESSION_SECRET="' + (process.env.SESSION_SECRET || '').replace(/"/g, '\\"') + '"',
].join('\n')
fs.writeFileSync(path.join(base, '.env'), envContent, 'utf8')

// Résoudre l'emplacement de server.js (racine du portable ou .next/standalone)
let serverJsPath = path.join(base, 'server.js')
if (!fs.existsSync(serverJsPath)) {
  const alt = path.join(base, '.next', 'standalone', 'server.js')
  if (fs.existsSync(alt)) serverJsPath = alt
}
if (!fs.existsSync(serverJsPath)) {
  console.error('Erreur: server.js introuvable. Lancez npm run build:portable.')
  process.exit(1)
}
const serverJsRequirePath = path.relative(base, serverJsPath).replace(/\\/g, '/').replace(/\.js$/, '') || 'server'
const runStandalone = `'use strict';
var path = require('path');
var fs = require('fs');
var url = null;
if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
  var fixed = path.join(process.env.LOCALAPPDATA, 'GestiComPortable', 'database_url.txt');
  if (fs.existsSync(fixed)) url = fs.readFileSync(fixed, 'utf8').trim();
}
if (!url) {
  var f = path.join(__dirname, '.database_url');
  if (fs.existsSync(f)) url = fs.readFileSync(f, 'utf8').trim();
}
if (url) process.env.DATABASE_URL = url;
require(path.join(__dirname, '${serverJsRequirePath}.js'));
`
fs.writeFileSync(path.join(base, 'run-standalone.js'), runStandalone, 'utf8')
if (!fs.existsSync(path.join(base, '.next', 'static'))) {
  console.error('Erreur: .next/static manquant. Lancez npm run build:portable.')
  process.exit(1)
}

const lockFile = path.join(base, '.gesticom-portable.lock')
if (fs.existsSync(lockFile)) {
  try {
    const pid = parseInt(fs.readFileSync(lockFile, 'utf8').trim(), 10)
    if (pid) {
      let alreadyRunning = false
      try {
        process.kill(pid, 0)
        alreadyRunning = true
      } catch (e) {
        if (e.code === 'EPERM') alreadyRunning = true
      }
      if (alreadyRunning) {
        console.error('GestiCom est déjà lancé (PID ' + pid + '). Fermez l\'autre fenêtre ou arrêtez le processus.')
        process.exit(1)
      }
    }
  } catch (_) {}
}
try {
  fs.writeFileSync(lockFile, String(process.pid), 'utf8')
} catch (_) {}

function removeLock() {
  try {
    if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile)
  } catch (_) {}
}

// Mise à jour du schéma BD si besoin (colonnes montantPaye, table Depense, etc.)
// execFileSync évite le shell : chemins avec espaces (ex. "GSN EXPETISES  GROUP") OK
const ensureSchemaPath = path.join(base, 'ensure-schema.js')
if (fs.existsSync(ensureSchemaPath)) {
  try {
    const { execFileSync } = require('child_process')
    execFileSync(process.execPath, [ensureSchemaPath], {
      cwd: base,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'pipe',
    })
  } catch (e) {
    console.warn('Mise à jour schéma BD:', e.message || e)
  }
}

const child = spawn(process.execPath, ['run-standalone.js'], {
  cwd: base,
  env: { 
    ...process.env, 
    DATABASE_URL: dbUrl,
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0',  // Écouter sur toutes les interfaces pour le réseau local
    PORT: process.env.PORT || '3000',
  },
  stdio: 'inherit',
})

child.on('error', (err) => {
  console.error('Erreur:', err.message)
  process.exit(1)
})

child.on('exit', (code) => {
  removeLock()
  if (useFallback && fs.existsSync(dbToUse) && fs.existsSync(path.dirname(dbPath))) {
    try {
      fs.copyFileSync(dbToUse, dbPath)
      console.log('Base resynchronisee vers data/gesticom.db')
    } catch (e) {
      console.warn('Sync base vers data/:', e.message)
    }
  }
  process.exit(code || 0)
})

const port = process.env.PORT || '3000'
const http = require('http')
let attempts = 0
let browserOpened = false
const t = setInterval(() => {
  attempts++
  const req = http.get('http://localhost:' + port, (res) => {
    res.resume() // consommer le corps pour fermer proprement la connexion
      if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 401) {
      if (!browserOpened) {
        browserOpened = true
        clearInterval(t)
        console.log('Serveur demarre sur http://localhost:' + port)
        console.log('Donnees (ventes, achats, clients, etc.) : ' + dbToUse)
        if (process.platform === 'win32') {
          require('child_process').exec('start http://localhost:' + port)
        } else if (process.platform === 'darwin') {
          require('child_process').exec('open http://localhost:' + port)
        } else {
          require('child_process').exec('xdg-open http://localhost:' + port)
        }
      }
    }
  })
  req.on('error', () => {})
  req.end()
  if (attempts >= 40) {
    clearInterval(t)
    if (!browserOpened) console.log('Ouvrez http://localhost:' + port)
  }
}, 500)
