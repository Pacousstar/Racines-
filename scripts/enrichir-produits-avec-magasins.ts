/**
 * Script : ajoute le champ magasins (par défaut ["MAG01"]) à chaque produit
 * du JSON qui ne l'a pas ou l'a vide.
 *
 * Usage (depuis gesticom/) :
 *   npx tsx scripts/enrichir-produits-avec-magasins.ts
 *   npx tsx scripts/enrichir-produits-avec-magasins.ts MAG01,MAG02
 *
 * Lit : data/GestiCom_Produits_Master.json
 * Écrit : data/GestiCom_Produits_Master_avec_magasins.json
 */

import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const srcPath = path.join(dataDir, 'GestiCom_Produits_Master.json')
const outPath = path.join(dataDir, 'GestiCom_Produits_Master_avec_magasins.json')

const defaultMagasins = process.argv[2] ? process.argv[2].split(',').map((c) => c.trim().toUpperCase()).filter(Boolean) : ['MAG01']

async function main() {
  const raw = await readFile(srcPath, 'utf-8')
  const data = JSON.parse(raw) as unknown[]
  if (!Array.isArray(data)) {
    console.error('Le fichier ne contient pas un tableau JSON.')
    process.exit(1)
  }

  let count = 0
  for (const row of data) {
    if (row && typeof row === 'object' && 'code' in row) {
      const r = row as Record<string, unknown>
      const magasins = r.magasins
      const need = !Array.isArray(magasins) || magasins.length === 0
      if (need) {
        r.magasins = [...defaultMagasins]
        count++
      }
    }
  }

  await writeFile(outPath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`Enrichi : ${count} produit(s) avec magasins = [${defaultMagasins.join(', ')}].`)
  console.log(`Écrit : ${outPath}`)
  console.log('Vous pouvez remplacer GestiCom_Produits_Master.json par ce fichier après contrôle.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
