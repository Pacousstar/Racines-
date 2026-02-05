/**
 * Supprime les anciennes sauvegardes portable (backup-portable-data-*.db et backup-portable-C-drive-*.db)
 * en ne gardant que les N plus récentes. À lancer depuis le dossier gesticom : node scripts/cleanup-backups.js
 * Ou : npm run portable:clean-backups
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const MAX_BACKUPS_TO_KEEP = 2

function cleanupOldBackups(pattern) {
  let files = []
  try {
    files = fs.readdirSync(projectRoot).filter((f) => f.startsWith(pattern) && f.endsWith('.db'))
  } catch (_) {
    return 0
  }
  if (files.length <= MAX_BACKUPS_TO_KEEP) return 0
  const withStats = files.map((f) => ({
    name: f,
    path: path.join(projectRoot, f),
    mtime: fs.statSync(path.join(projectRoot, f)).mtime.getTime(),
  }))
  withStats.sort((a, b) => b.mtime - a.mtime)
  const toRemove = withStats.slice(MAX_BACKUPS_TO_KEEP)
  let removed = 0
  for (const f of toRemove) {
    try {
      fs.unlinkSync(f.path)
      console.log('  Supprimé : ' + f.name)
      removed++
    } catch (e) {
      console.warn('  Impossible de supprimer ' + f.name + ':', e.message)
    }
  }
  return removed
}

console.log('Nettoyage des anciennes sauvegardes (conservation des ' + MAX_BACKUPS_TO_KEEP + ' plus récentes par type)...')
const r1 = cleanupOldBackups('backup-portable-data-')
const r2 = cleanupOldBackups('backup-portable-C-drive-')
const total = r1 + r2
if (total === 0) {
  console.log('Aucune ancienne sauvegarde à supprimer.')
} else {
  console.log('Total : ' + total + ' fichier(s) supprimé(s).')
}
