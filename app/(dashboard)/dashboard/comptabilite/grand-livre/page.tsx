'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Loader2, Filter, Download, FileSpreadsheet } from 'lucide-react'
import ComptabiliteNav from '../ComptabiliteNav'

type GrandLivreEntry = {
  compte: { numero: string; libelle: string; type: string }
  ecritures: Array<{
    id: number
    numero: string
    date: string
    journal: { code: string; libelle: string }
    piece: string | null
    libelle: string
    debit: number
    credit: number
    utilisateur: { nom: string }
  }>
  soldeDebit: number
  soldeCredit: number
  solde: number
}

type PlanCompte = { id: number; numero: string; libelle: string }

export default function GrandLivrePage() {
  const [data, setData] = useState<GrandLivreEntry[]>([])
  const [comptes, setComptes] = useState<PlanCompte[]>([])
  const [loading, setLoading] = useState(true)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [filtreCompte, setFiltreCompte] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setDateDebut(firstDay.toISOString().split('T')[0])
    setDateFin(lastDay.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    fetch('/api/plan-comptes')
      .then((r) => (r.ok ? r.json() : []))
      .then(setComptes)
  }, [])

  const fetchGrandLivre = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateDebut) params.set('dateDebut', dateDebut)
    if (dateFin) params.set('dateFin', dateFin)
    if (filtreCompte) params.set('compteId', filtreCompte)
    
    fetch('/api/grand-livre?' + params.toString())
      .then((r) => (r.ok ? r.json() : []))
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (dateDebut && dateFin) {
      fetchGrandLivre()
    }
  }, [dateDebut, dateFin, filtreCompte])

  const totalDebit = data.reduce((sum, entry) => sum + entry.soldeDebit, 0)
  const totalCredit = data.reduce((sum, entry) => sum + entry.soldeCredit, 0)

  return (
    <div className="space-y-6">
      <ComptabiliteNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Grand Livre SYSCOHADA</h1>
          <p className="mt-1 text-white/90">Registre détaillé des mouvements comptables par compte</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filtres
        </button>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Compte</label>
              <select
                value={filtreCompte}
                onChange={(e) => setFiltreCompte(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous les comptes</option>
                {comptes.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.numero} - {c.libelle}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (dateDebut) params.set('dateDebut', dateDebut)
                if (dateFin) params.set('dateFin', dateFin)
                if (filtreCompte) params.set('compteId', filtreCompte)
                window.open(`/api/grand-livre/export-excel?${params.toString()}`, '_blank')
              }}
              className="rounded-lg border-2 border-green-500 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100 flex items-center gap-1.5"
              title="Exporter le grand livre en Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (dateDebut) params.set('dateDebut', dateDebut)
                if (dateFin) params.set('dateFin', dateFin)
                if (filtreCompte) params.set('compteId', filtreCompte)
                window.open(`/api/grand-livre/export-pdf?${params.toString()}`, '_blank')
              }}
              className="rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 flex items-center gap-1.5"
              title="Exporter le grand livre en PDF"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      )}

      {/* Totaux */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-red-300 bg-gradient-to-br from-red-50 to-red-100 p-4 shadow-md">
          <div className="text-sm font-medium text-red-700">Total Débit</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {totalDebit.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
        <div className="rounded-xl border border-green-300 bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-md">
          <div className="text-sm font-medium text-green-700">Total Crédit</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {totalCredit.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
        <div className={`rounded-xl border p-4 shadow-md ${
          Math.abs(totalDebit - totalCredit) === 0 
            ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-100' 
            : 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100'
        }`}>
          <div className={`text-sm font-medium ${
            Math.abs(totalDebit - totalCredit) === 0 ? 'text-green-700' : 'text-orange-700'
          }`}>
            Écart
          </div>
          <div className={`mt-1 text-2xl font-bold ${
            Math.abs(totalDebit - totalCredit) === 0 ? 'text-green-600' : 'text-orange-600'
          }`}>
            {Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')} FCFA
          </div>
          {Math.abs(totalDebit - totalCredit) === 0 && (
            <div className="mt-1 text-xs font-semibold text-green-700">Balance équilibrée ✓</div>
          )}
        </div>
      </div>

      {/* Grand Livre */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">Aucune écriture trouvée pour la période sélectionnée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((entry) => (
            <div key={entry.compte.numero} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {entry.compte.numero} - {entry.compte.libelle}
                    </h3>
                    <p className="text-xs text-gray-500">Type: {entry.compte.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Solde</div>
                    <div className={`text-lg font-bold ${
                      entry.solde >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.solde.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Journal</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Pièce</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Libellé</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Débit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entry.ecritures.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(e.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{e.journal.code}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{e.piece || '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{e.libelle}</td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-red-600">
                          {e.debit > 0 ? e.debit.toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-green-600">
                          {e.credit > 0 ? e.credit.toLocaleString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-4 py-2 text-sm text-gray-900 text-right">Total</td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">
                        {entry.soldeDebit.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-green-600">
                        {entry.soldeCredit.toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
