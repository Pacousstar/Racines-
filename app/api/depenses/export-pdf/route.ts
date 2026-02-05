import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { jsPDF } = require('jspdf')

function formatMontant(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const dateDebut = request.nextUrl.searchParams.get('dateDebut')?.trim()
    const dateFin = request.nextUrl.searchParams.get('dateFin')?.trim()
    const categorie = request.nextUrl.searchParams.get('categorie')?.trim()
    const magasinId = request.nextUrl.searchParams.get('magasinId')?.trim()

    const where: any = {}
    
    if (session.role !== 'SUPER_ADMIN' && session.entiteId) {
      where.entiteId = session.entiteId
    }

    if (dateDebut && dateFin) {
      where.date = {
        gte: new Date(dateDebut + 'T00:00:00'),
        lte: new Date(dateFin + 'T23:59:59'),
      }
    }

    if (categorie) {
      where.categorie = categorie
    }

    if (magasinId) {
      const magId = Number(magasinId)
      if (Number.isInteger(magId) && magId > 0) {
        where.magasinId = magId
      }
    }

    const depenses = await prisma.depense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        magasin: { select: { code: true, nom: true } },
      },
    })

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Dépenses', 15, 20)

    if (dateDebut && dateFin) {
      doc.setFontSize(10)
      doc.text(`Période: ${new Date(dateDebut).toLocaleDateString('fr-FR')} - ${new Date(dateFin).toLocaleDateString('fr-FR')}`, 15, 30)
    }

    if (depenses.length === 0) {
      doc.setFontSize(12)
      doc.text('Aucune dépense sur la période sélectionnée.', 15, 50)
      const buffer = Buffer.from(doc.output('arraybuffer'))
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="depenses-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    let y = 45
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.text('Date', 15, y)
    doc.text('Catégorie', 40, y)
    doc.text('Libellé', 80, y)
    doc.text('Montant', 140, y)

    y += 5
    doc.line(15, y, 195, y)

    doc.setFont(undefined, 'normal')
    let total = 0

    for (const d of depenses) {
      if (y > 270) {
        doc.addPage()
        y = 20
        doc.setFont(undefined, 'bold')
        doc.text('Date', 15, y)
        doc.text('Catégorie', 40, y)
        doc.text('Libellé', 80, y)
        doc.text('Montant', 140, y)
        y += 5
        doc.line(15, y, 195, y)
        y += 5
        doc.setFont(undefined, 'normal')
      }

      total += d.montant
      doc.text(new Date(d.date).toLocaleDateString('fr-FR'), 15, y)
      const categorie = d.categorie.length > 12 ? d.categorie.substring(0, 9) + '...' : d.categorie
      doc.text(categorie, 40, y)
      const libelle = d.libelle.length > 20 ? d.libelle.substring(0, 17) + '...' : d.libelle
      doc.text(libelle, 80, y)
      doc.text(`${formatMontant(d.montant)} F`, 140, y)

      y += 7
    }

    y += 5
    doc.line(15, y, 195, y)
    y += 5
    doc.setFont(undefined, 'bold')
    doc.text('Total:', 15, y)
    doc.text(`${formatMontant(total)} F`, 140, y)

    const buffer = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="depenses-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('GET /api/depenses/export-pdf:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'export PDF' }, { status: 500 })
  }
}
