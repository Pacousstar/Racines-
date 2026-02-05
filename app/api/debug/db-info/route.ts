import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    // Liste des tables SQLite (pratique pour vérifier si Depense existe vraiment)
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `
    const tableNames = tables.map((t) => t.name)
    const hasDepense = tableNames.includes('Depense')

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL,
      hasDepense,
      tables: tableNames,
    })
  } catch (e) {
    // Log local
    try {
      const logPath = path.join(process.cwd(), 'gesticom-error.log')
      const msg = e instanceof Error ? (e.stack || e.message) : String(e)
      fs.appendFileSync(logPath, new Date().toISOString() + ' [db-info] ' + msg + '\n', 'utf8')
    } catch (_) {
      // ignore
    }
    return NextResponse.json(
      {
        error: 'Erreur serveur.',
        hint: 'Ouvrez gesticom-error.log pour le détail.',
      },
      { status: 500 }
    )
  }
}

