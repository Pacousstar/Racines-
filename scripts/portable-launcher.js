/**
 * Lanceur GestiCom portable. À lancer depuis GestiCom-Portable : node portable-launcher.js
 * Définit DATABASE_URL (data/gesticom.db ; si chemin avec espaces, copie vers C:\gesticom_portable_data)
 * puis lance server.js.
 */

const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const base = __dirname
const dataDir = path.join(base, 'data')
const dbPath = path.join(dataDir, 'gesticom.db')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(dbPath)) {
  console.error('Erreur: data/gesticom.db manquant. Lancez npm run build:portable depuis le projet.')
  process.exit(1)
}

function toFileUrl(p) {
  const s = path.resolve(p).replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '$1:')
  return 'file:' + s
}

let dbUrl = toFileUrl(dbPath)
let dbToUse = dbPath
let useFallback = false

if (process.platform === 'win32' && dbPath.includes(' ')) {
  const fallback = path.join('C:', 'gesticom_portable_data', 'gesticom.db')
  const fallbackDir = path.dirname(fallback)
  try {
    if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true })
    const fallbackExists = fs.existsSync(fallback)
    // Ne jamais écraser C:\ avec data/ si C:\ existe déjà : ainsi les enregistrements
    // faits lors de la dernière session (écrits dans C:\) sont conservés au redémarrage.
    // Copier data/ vers C:\ uniquement au premier lancement (C:\ absent) ou si data/ est plus récente et plus grosse (cas rare).
    if (!fallbackExists) {
      fs.copyFileSync(dbPath, fallback)
      dbUrl = toFileUrl(fallback)
      dbToUse = fallback
      useFallback = true
      const sizeKo = Math.round(fs.statSync(dbPath).size / 1024)
      console.log('Base data/gesticom.db (' + sizeKo + ' Ko) copiee vers C:\\gesticom_portable_data.')
    } else {
      dbUrl = toFileUrl(fallback)
      dbToUse = fallback
      useFallback = true
      const fallbackSize = fs.statSync(fallback).size
      const sizeKo = Math.round(fallbackSize / 1024)
      console.log('Base C:\\gesticom_portable_data\\gesticom.db (' + sizeKo + ' Ko) utilisee (enregistrements conserves).')
    }
  } catch (e) {
    console.warn('Impossible d\'utiliser C:\\gesticom_portable_data:', e.message)
  }
}

process.env.NODE_ENV = 'production'
process.env.PORT = process.env.PORT || '3000'
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'GestiCom-Portable-ChangeMe-InProduction-32c'
process.env.DATABASE_URL = dbUrl

fs.writeFileSync(path.join(base, '.database_url'), dbUrl, 'utf8')
const envContent = [
  'DATABASE_URL="' + dbUrl.replace(/"/g, '\\"') + '"',
  'NODE_ENV=production',
  'PORT=' + process.env.PORT,
  'SESSION_SECRET="' + (process.env.SESSION_SECRET || '').replace(/"/g, '\\"') + '"',
].join('\n')
fs.writeFileSync(path.join(base, '.env'), envContent, 'utf8')

const runStandalone = `'use strict';
var f = require('path').join(__dirname, '.database_url');
if (require('fs').existsSync(f)) process.env.DATABASE_URL = require('fs').readFileSync(f, 'utf8').trim();
require('./server.js');
`
fs.writeFileSync(path.join(base, 'run-standalone.js'), runStandalone, 'utf8')

if (!fs.existsSync(path.join(base, 'server.js'))) {
  console.error('Erreur: server.js introuvable. Lancez npm run build:portable.')
  process.exit(1)
}
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
  env: { ...process.env, DATABASE_URL: dbUrl },
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
