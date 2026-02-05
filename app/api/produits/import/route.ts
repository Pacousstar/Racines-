import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { processImportRows, type ImportRow } from '@/lib/importProduits'
import { resolveDataFilePath } from '@/lib/resolveDataFile'

const JSON_FILE = 'GestiCom_Produits_Master.json'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const filePath = await resolveDataFilePath(JSON_FILE)
    if (!filePath) {
      return NextResponse.json(
        { error: `Fichier ${JSON_FILE} introuvable. Placez-le dans data/ (à la racine ou au niveau parent).` },
        { status: 404 }
      )
    }
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw) as ImportRow[]

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Format JSON invalide (tableau attendu).' }, { status: 400 })
    }

    const magasinList = await prisma.magasin.findMany({
      where: { actif: true },
      select: { id: true, code: true },
    })
    const magasinByCode = new Map(magasinList.map((m) => [m.code.trim().toUpperCase(), m.id]))

    const { created, updated, stocksCreated } = await processImportRows(data, magasinByCode, prisma)

    return NextResponse.json({ created, updated, total: data.length, stocksCreated })
  } catch (e) {
    console.error('POST /api/produits/import:', e)
    const err = e as NodeJS.ErrnoException
    if (err?.code === 'ENOENT') {
      return NextResponse.json(
        { error: `Fichier ${JSON_FILE} introuvable dans data/.` },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur lors de l'import." },
      { status: 500 }
    )
  }
}
