import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'ID invalide.' }, { status: 400 })
  }

  const vente = await prisma.vente.findUnique({
    where: { id },
    include: {
      magasin: { select: { id: true, code: true, nom: true, localisation: true } },
      client: { select: { id: true, nom: true, telephone: true, type: true } },
      lignes: {
        include: { produit: { select: { id: true, code: true, designation: true } } },
      },
    },
  })

  if (!vente) return NextResponse.json({ error: 'Vente introuvable.' }, { status: 404 })
  return NextResponse.json(vente)
}
