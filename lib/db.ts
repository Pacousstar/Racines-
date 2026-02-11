import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production (portable) : une seule source d'URL = %LOCALAPPDATA%\\GestiComPortable\\database_url.txt (Windows).
// Ne jamais écraser si DATABASE_URL est déjà un file: valide (passé par le launcher).
if (process.env.NODE_ENV === 'production') {
  try {
    const hasValidUrl = process.env.DATABASE_URL?.startsWith('file:')
    if (!hasValidUrl && process.platform === 'win32' && process.env.LOCALAPPDATA) {
      const fixedPath = path.join(process.env.LOCALAPPDATA, 'GestiComPortable', 'database_url.txt')
      if (fs.existsSync(fixedPath)) {
        const url = fs.readFileSync(fixedPath, 'utf8').trim()
        if (url) process.env.DATABASE_URL = url
      }
    }
    if (!hasValidUrl && !process.env.DATABASE_URL) {
      const cwdFile = path.join(process.cwd(), '.database_url')
      if (fs.existsSync(cwdFile)) {
        const url = fs.readFileSync(cwdFile, 'utf8').trim()
        if (url) process.env.DATABASE_URL = url
      }
    }
  } catch (_) {
    // ignorer
  }
  if (!process.env.DATABASE_URL) {
    console.error('[lib/db] ERREUR: DATABASE_URL non défini en production')
  } else {
    console.log('[lib/db] DATABASE_URL=' + process.env.DATABASE_URL)
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : undefined,
  // Optimisations pour SQLite
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
