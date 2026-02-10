import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// En production (standalone/portable), ne pas écraser DATABASE_URL si le launcher l'a déjà défini (spawn env).
// Sinon lire .database_url (dossier portable) ou database_url.txt (LOCALAPPDATA).
if (process.env.NODE_ENV === 'production') {
  try {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
      let url: string | null = null
      const cwdFile = path.join(process.cwd(), '.database_url')
      if (fs.existsSync(cwdFile)) url = fs.readFileSync(cwdFile, 'utf8').trim()
      if (!url && process.platform === 'win32' && process.env.LOCALAPPDATA) {
        const fixedPath = path.join(process.env.LOCALAPPDATA, 'GestiComPortable', 'database_url.txt')
        if (fs.existsSync(fixedPath)) url = fs.readFileSync(fixedPath, 'utf8').trim()
      }
      if (url) process.env.DATABASE_URL = url
    }
  } catch (_) {
    // ignorer si lecture impossible
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
