// Crée une archive ZIP de GestiCom-Portable
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const portableDir = path.join(projectRoot, 'GestiCom-Portable')

function ts() {
  const d = new Date()
  const pad = (n)=> String(n).padStart(2,'0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`
}

;(function main(){
  if (!fs.existsSync(portableDir)) {
    console.error('✗ Dossier GestiCom-Portable introuvable. Lancez d\'abord: npm run build:portable')
    process.exit(1)
  }
  const outName = `GestiCom-Portable_${ts()}.zip`
  const outPath = path.join(projectRoot, outName)
  try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath) } catch {}

  console.log('Packaging GestiCom-Portable →', outName)

  try {
    if (process.platform === 'win32') {
      // PowerShell Compress-Archive avec échappement correct pour les espaces
      const sourcePath = `${portableDir}/*`.replace(/\\/g, '\\\\')
      const destPath = outPath.replace(/\\/g, '\\\\')
      const cmd = `powershell -NoProfile -Command "& {Compress-Archive -Path '${portableDir}/*' -DestinationPath '${outPath}' -Force}"`
      execSync(cmd, { stdio: 'inherit' })
    } else if (process.platform === 'darwin' || process.platform === 'linux') {
      // zip -r
      const cmd = `zip -r -q \\"${outPath}\\" \\"GestiCom-Portable\\"`
      execSync(cmd, { stdio: 'inherit', cwd: projectRoot })
    } else {
      throw new Error('Plateforme non supportée automatiquement, créez le zip manuellement.')
    }
  } catch (e) {
    console.error('✗ Échec de la création du ZIP:', e.message)
    process.exit(1)
  }

  const size = fs.statSync(outPath).size
  console.log(`✓ ZIP créé: ${outName} (${Math.round(size/1024/1024)} MB)`) 
  console.log('Vous pouvez maintenant transférer ce fichier sur un autre PC.')
})()
