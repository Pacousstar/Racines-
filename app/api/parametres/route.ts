import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { requireRole, ROLES_ADMIN } from '@/lib/require-role'
import { parametresPatchSchema } from '@/lib/validations'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  const forbidden = requireRole(session, ROLES_ADMIN)
  if (forbidden) return forbidden

  const p = await prisma.parametre.findFirst({ orderBy: { id: 'asc' } })
  if (!p) return NextResponse.json({ error: 'Paramètres introuvables.' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  const forbidden = requireRole(session, ROLES_ADMIN)
  if (forbidden) return forbidden

  try {
    const body = await request.json().catch(() => ({}))
    const parsed = parametresPatchSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Données invalides.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = parsed.data

    let p = await prisma.parametre.findFirst({ orderBy: { id: 'asc' } })
    if (!p) {
      p = await prisma.parametre.create({
        data: {
          nomEntreprise: data.nomEntreprise ?? '',
          contact: data.contact ?? '',
          localisation: data.localisation ?? '',
          devise: data.devise ?? 'FCFA',
          tvaParDefaut: data.tvaParDefaut ?? 0,
          logo: data.logo ?? null,
        },
      })
    } else {
      const update: Record<string, string | number | null> = {}
      if (data.nomEntreprise !== undefined) update.nomEntreprise = data.nomEntreprise
      if (data.contact !== undefined) update.contact = data.contact
      if (data.localisation !== undefined) update.localisation = data.localisation
      if (data.devise !== undefined) update.devise = data.devise
      if (data.tvaParDefaut !== undefined) update.tvaParDefaut = data.tvaParDefaut
      if (data.logo !== undefined) update.logo = data.logo || null
      if (Object.keys(update).length > 0) {
        p = await prisma.parametre.update({ where: { id: p.id }, data: update })
      }
    }
    return NextResponse.json(p)
  } catch (e) {
    console.error('PATCH /api/parametres:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
