'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Scale, Loader2, Filter, FileSpreadsheet, Download } from 'lucide-react'
import ComptabiliteNav from '../ComptabiliteNav'

type BalanceEntry = {
  compte: { id: number; numero: string; libelle: string; classe: string; type: string }
  soldeDebit: number
  soldeCredit: number
  solde: number
}

type BalanceData = {
  balance: BalanceEntry[]
  totauxParClasse: Record<string, { debit: number; credit: number }>
  totalDebit: number
  totalCredit: number
}

export default function BalancePage() {
  const [data, setData] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setDateDebut(firstDay.toISOString().split('T')[0])
    setDateFin(lastDay.toISOString().split('T')[0])
  }, [])

  const fetchBalance = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateDebut) params.set('dateDebut', dateDebut)
    if (dateFin) params.set('dateFin', dateFin)
    
    fetch('/api/balance?' + params.toString())
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (dateDebut && dateFin) {
      fetchBalance()
    }
  }, [dateDebut, dateFin])

  const classes = data ? Object.keys(data.totauxParClasse).sort() : []

  return (
    <div className="space-y-6">
      <ComptabiliteNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Balance des Comptes SYSCOHADA</h1>
          <p className="mt-1 text-white/90">Balance générale des comptes selon le système comptable OHADA</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filtres
        </button>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Date début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Date fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (dateDebut) params.set('dateDebut', dateDebut)
                if (dateFin) params.set('dateFin', dateFin)
                window.open(`/api/balance/export-excel?${params.toString()}`, '_blank')
              }}
              className="rounded-lg border-2 border-green-500 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100 flex items-center gap-1.5"
              title="Exporter la balance en Excel"
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
                window.open(`/api/balance/export-pdf?${params.toString()}`, '_blank')
              }}
              className="rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 flex items-center gap-1.5"
              title="Exporter la balance en PDF"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      )}

      {/* Totaux généraux */}
      {data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-red-300 bg-gradient-to-br from-red-50 to-red-100 p-4 shadow-md">
            <div className="text-sm font-medium text-red-700">Total Débit</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {data.totalDebit.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <div className="rounded-xl border border-green-300 bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-md">
            <div className="text-sm font-medium text-green-700">Total Crédit</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {data.totalCredit.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <div className={`rounded-xl border p-4 shadow-md ${
            Math.abs(data.totalDebit - data.totalCredit) === 0 
              ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-100' 
              : 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100'
          }`}>
            <div className={`text-sm font-medium ${
              Math.abs(data.totalDebit - data.totalCredit) === 0 ? 'text-green-700' : 'text-orange-700'
            }`}>
              Écart
            </div>
            <div className={`mt-1 text-2xl font-bold ${
              Math.abs(data.totalDebit - data.totalCredit) === 0 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {Math.abs(data.totalDebit - data.totalCredit).toLocaleString('fr-FR')} FCFA
            </div>
            {Math.abs(data.totalDebit - data.totalCredit) === 0 && (
              <div className="mt-1 text-xs font-semibold text-green-700">Balance équilibrée ✓</div>
            )}
          </div>
        </div>
      )}

      {/* Balance */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : !data || data.balance.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <Scale className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">Aucune écriture trouvée pour la période sélectionnée</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Classe</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Numéro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Libellé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Débit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Crédit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  const rows: React.ReactNode[] = []
                  const classesAffichees = new Set<string>()
                  
                  data.balance.forEach((entry, index) => {
                    const isNewClasse = index === 0 || data.balance[index - 1].compte.classe !== entry.compte.classe
                    const isLastClasse = index === data.balance.length - 1 || data.balance[index + 1]?.compte.classe !== entry.compte.classe
                    const classeTotal = data.totauxParClasse[entry.compte.classe]
                    
                    if (isNewClasse) {
                      rows.push(
                        <tr key={`classe-${entry.compte.classe}`} className="bg-blue-50">
                          <td colSpan={7} className="px-4 py-2 text-sm font-semibold text-blue-900">
                            CLASSE {entry.compte.classe}
                          </td>
                        </tr>
                      )
                    }
                    
                    rows.push(
                      <tr key={entry.compte.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.compte.classe}</td>
                        <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{entry.compte.numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.compte.libelle}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            entry.compte.type === 'ACTIF' ? 'bg-blue-100 text-blue-800' :
                            entry.compte.type === 'PASSIF' ? 'bg-purple-100 text-purple-800' :
                            entry.compte.type === 'CHARGES' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {entry.compte.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                          {entry.soldeDebit > 0 ? entry.soldeDebit.toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                          {entry.soldeCredit > 0 ? entry.soldeCredit.toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${
                          entry.solde >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.solde.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    )
                    
                    if (isLastClasse && classeTotal && !classesAffichees.has(entry.compte.classe)) {
                      classesAffichees.add(entry.compte.classe)
                      rows.push(
                        <tr key={`total-${entry.compte.classe}`} className="bg-gray-100 font-semibold">
                          <td colSpan={4} className="px-4 py-2 text-sm text-gray-900 text-right">
                            Total Classe {entry.compte.classe}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-red-600">
                            {classeTotal.debit.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-green-600">
                            {classeTotal.credit.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-2"></td>
                        </tr>
                      )
                    }
                  })
                  
                  return rows
                })()}
                <tr className="bg-orange-50 font-bold">
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 text-right">
                    TOTAL GÉNÉRAL
                  </td>
                  <td className="px-4 py-3 text-right text-lg text-red-600">
                    {data.totalDebit.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right text-lg text-green-600">
                    {data.totalCredit.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
