'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, Plus, Loader2, Filter, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { formatApiError } from '@/lib/validation-helpers'
import { MESSAGES } from '@/lib/messages'

type Magasin = { id: number; code: string; nom: string }
type Produit = { id: number; code: string; designation: string; prixAchat?: number | null }
type TransfertLigne = { id: number; produitId: number; designation: string; quantite: number; produit: { code: string; designation: string } }
type Transfert = {
  id: number
  numero: string
  date: string
  observation: string | null
  magasinOrigine: { id: number; code: string; nom: string }
  magasinDest: { id: number; code: string; nom: string }
  utilisateur: { nom: string }
  lignes: TransfertLigne[]
}

export default function TransfertsPage() {
  const [magasins, setMagasins] = useState<Magasin[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [list, setList] = useState<Transfert[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    magasinOrigineId: '',
    magasinDestId: '',
    observation: '',
    lignes: [] as Array<{ produitId: number; designation: string; quantite: number }>,
  })
  const [ligneProduitId, setLigneProduitId] = useState('')
  const [ligneQuantite, setLigneQuantite] = useState('1')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const { success: showSuccess, error: showError } = useToast()
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [filtreMagasin, setFiltreMagasin] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [stockInsuffisantModal, setStockInsuffisantModal] = useState<{
    designation: string
    produitId: number
    quantiteDispo: number
    quantiteDemandee: number
  } | null>(null)
  const [stockAjoutQuantite, setStockAjoutQuantite] = useState('')
  const [stockAjoutSaving, setStockAjoutSaving] = useState(false)

  const fetchTransferts = (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (dateDebut) params.set('dateDebut', dateDebut)
    if (dateFin) params.set('dateFin', dateFin)
    if (filtreMagasin) params.set('magasinId', filtreMagasin)
    fetch('/api/transferts?' + params.toString())
      .then((r) => (r.ok ? r.json() : { data: [], pagination: null }))
      .then((res) => {
        setList(res.data || [])
        setPagination(res.pagination || null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/magasins').then((r) => (r.ok ? r.json() : [])).then(setMagasins)
    fetch('/api/produits?complet=1').then((r) => (r.ok ? r.json() : [])).then((res) => setProduits(Array.isArray(res) ? res : []))
  }, [])

  useEffect(() => {
    fetchTransferts(currentPage)
  }, [dateDebut, dateFin, filtreMagasin, currentPage])

  const openForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      magasinOrigineId: '',
      magasinDestId: '',
      observation: '',
      lignes: [],
    })
    setLigneProduitId('')
    setLigneQuantite('1')
    setErr('')
    setFormOpen(true)
  }

  const addLigne = () => {
    const pid = Number(ligneProduitId)
    const qte = Math.max(1, Math.floor(Number(ligneQuantite) || 0))
    if (!pid) return
    const p = produits.find((x) => x.id === pid)
    if (!p) return
    if (formData.lignes.some((l) => l.produitId === pid)) {
      setErr('Ce produit est déjà dans la liste.')
      return
    }
    setFormData((prev) => ({
      ...prev,
      lignes: [...prev.lignes, { produitId: p.id, designation: p.designation, quantite: qte }],
    }))
    setLigneProduitId('')
    setLigneQuantite('1')
    setErr('')
  }

  const removeLigne = (index: number) => {
    setFormData((prev) => ({ ...prev, lignes: prev.lignes.filter((_, i) => i !== index) }))
  }

  const payloadTransfert = () => {
    const payload = {
      date: formData.date,
      magasinOrigineId: Number(formData.magasinOrigineId),
      magasinDestId: Number(formData.magasinDestId),
      observation: formData.observation.trim() || null,
      lignes: formData.lignes.map((l) => ({ produitId: l.produitId, quantite: l.quantite })),
    }
    console.log('📦 Payload transfert:', payload)
    return payload
  }

  const postTransfert = async (): Promise<{ ok: boolean; data: { error?: string } }> => {
    try {
      const payload = payloadTransfert()
      console.log('🚀 Envoi requête POST /api/transferts')
      const res = await fetch('/api/transferts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log('📥 Réponse reçue:', res.status, res.statusText)
      const data = await res.json().catch(() => ({}))
      console.log('📄 Données:', data)
      return { ok: res.ok, data }
    } catch (error) {
      console.error('❌ Erreur dans postTransfert:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 handleSubmit déclenché')
    setErr('')
    
    // Validations
    if (!formData.magasinOrigineId || !formData.magasinDestId) {
      const msg = 'Sélectionnez magasin origine et destination.'
      console.log('❌ Validation échouée:', msg)
      setErr(msg)
      showError(msg)
      return
    }
    if (formData.magasinOrigineId === formData.magasinDestId) {
      const msg = 'Origine et destination doivent être différents.'
      console.log('❌ Validation échouée:', msg)
      setErr(msg)
      showError(msg)
      return
    }
    if (!formData.lignes.length) {
      const msg = 'Ajoutez au moins une ligne (produit + quantité).'
      console.log('❌ Validation échouée:', msg)
      setErr(msg)
      showError(msg)
      return
    }
    
    console.log('✅ Validations passées, envoi du transfert...')
    setSaving(true)
    
    try {
      const { ok, data } = await postTransfert()
      console.log('📥 Réponse reçue - ok:', ok, 'data:', data)
      
      if (ok) {
        console.log('✅ Transfert enregistré avec succès!')
        setFormOpen(false)
        setStockInsuffisantModal(null)
        fetchTransferts(1)
        setCurrentPage(1)
        showSuccess(MESSAGES.TRANSFERT_ENREGISTRE)
      } else {
        console.log('❌ Erreur API:', data.error)
        const errStr = String(data.error || '')
        const match = errStr.match(/Stock insuffisant pour (.+?) \(dispo: (\d+)\)/)
        if (match) {
          const designation = match[1].trim()
          const quantiteDispo = parseInt(match[2], 10) || 0
          const ligne = formData.lignes.find((l) => l.designation === designation)
          if (ligne) {
            console.log('⚠️ Stock insuffisant détecté, ouverture du modal')
            setStockInsuffisantModal({
              designation: ligne.designation,
              produitId: ligne.produitId,
              quantiteDispo,
              quantiteDemandee: ligne.quantite,
            })
            setStockAjoutQuantite(String(Math.max(1, ligne.quantite - quantiteDispo)))
            setErr('')
            return
          }
        }
        const errorMsg = formatApiError(data.error || 'Erreur lors de l\'enregistrement.')
        setErr(errorMsg)
        showError(errorMsg)
      }
    } catch (e) {
      console.error('❌ Exception dans handleSubmit:', e)
      const errorMsg = formatApiError(e)
      setErr(errorMsg)
      showError(errorMsg)
    } finally {
      setSaving(false)
      console.log('🏁 handleSubmit terminé')
    }
  }

  const handleStockAjoutEtReessayer = async () => {
    if (!stockInsuffisantModal || !formData.magasinOrigineId) return
    const qte = Math.max(1, Math.floor(Number(stockAjoutQuantite) || 0))
    setStockAjoutSaving(true)
    try {
      const resEntree = await fetch('/api/stock/entree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magasinId: Number(formData.magasinOrigineId),
          produitId: stockInsuffisantModal.produitId,
          quantite: qte,
          date: formData.date,
          observation: 'Ajout pour transfert',
        }),
      })
      if (!resEntree.ok) {
        const d = await resEntree.json().catch(() => ({}))
        showError(d.error || 'Erreur ajout stock.')
        return
      }
      setStockInsuffisantModal(null)
      setStockAjoutQuantite('')
      setErr('')
      const { ok, data } = await postTransfert()
      if (ok) {
        setFormOpen(false)
        fetchTransferts(1)
        setCurrentPage(1)
        showSuccess(MESSAGES.TRANSFERT_ENREGISTRE)
      } else {
        const errStr = String(data.error || '')
        const match = errStr.match(/Stock insuffisant pour (.+?) \(dispo: (\d+)\)/)
        if (match) {
          const designation = match[1].trim()
          const quantiteDispo = parseInt(match[2], 10) || 0
          const ligne = formData.lignes.find((l) => l.designation === designation)
          if (ligne) {
            setStockInsuffisantModal({
              designation: ligne.designation,
              produitId: ligne.produitId,
              quantiteDispo,
              quantiteDemandee: ligne.quantite,
            })
            setStockAjoutQuantite(String(Math.max(1, ligne.quantite - quantiteDispo)))
          }
        } else {
          setErr(formatApiError(data.error || ''))
          showError(data.error || 'Erreur transfert.')
        }
      }
    } catch (e) {
      showError(formatApiError(e))
    } finally {
      setStockAjoutSaving(false)
    }
  }

  const filteredList = searchTerm
    ? list.filter((t: Transfert) =>
        t.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.magasinOrigine.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.magasinDest.nom.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : list

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8 text-orange-600" />
            Transferts entre points de vente
          </h1>
          <p className="mt-1 text-gray-700">Transférer des produits d&apos;un magasin à un autre (stock et traçabilité)</p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nouveau transfert
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Magasin</label>
              <select value={filtreMagasin} onChange={(e) => setFiltreMagasin(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Tous</option>
                {magasins.map((m) => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
          <Filter className="h-4 w-4" /> Filtres
        </button>
        <div className="flex-1 flex justify-end">
          <input
            type="text"
            placeholder="Rechercher (n°, magasin)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredList.length === 0 ? (
          <p className="text-center py-12 text-gray-500">Aucun transfert enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Depuis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Lignes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Par</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{t.magasinOrigine.nom} ({t.magasinOrigine.code})</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{t.magasinDest.nom} ({t.magasinDest.code})</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.lignes.length} ligne(s)</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.utilisateur?.nom || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-gray-200">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="py-1 text-sm text-gray-600">
              Page {currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau transfert</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Magasin d&apos;origine</label>
                  <select
                    value={formData.magasinOrigineId}
                    onChange={(e) => setFormData((p) => ({ ...p, magasinOrigineId: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Choisir</option>
                    {magasins.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Magasin de destination</label>
                  <select
                    value={formData.magasinDestId}
                    onChange={(e) => setFormData((p) => ({ ...p, magasinDestId: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Choisir</option>
                    {magasins.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Observation (optionnel)</label>
                <input type="text" value={formData.observation} onChange={(e) => setFormData((p) => ({ ...p, observation: e.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Ex: Réapprovisionnement DANANE" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lignes (produit + quantité)</label>
                <div className="flex gap-2 mt-1">
                  <select value={ligneProduitId} onChange={(e) => setLigneProduitId(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Choisir un produit</option>
                    {produits.filter((p) => !formData.lignes.some((l) => l.produitId === p.id)).map((p) => (
                      <option key={p.id} value={p.id}>{p.code} - {p.designation}</option>
                    ))}
                  </select>
                  <input type="number" min={1} value={ligneQuantite} onChange={(e) => setLigneQuantite(e.target.value)} className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <button type="button" onClick={addLigne} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Ajouter</button>
                </div>
                {formData.lignes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formData.lignes.map((l, i) => (
                      <li key={i} className="flex items-center justify-between text-sm bg-blue-50 border border-blue-200 px-3 py-2 rounded">
                        <span className="font-medium text-gray-900">{l.designation} × {l.quantite}</span>
                        <button type="button" onClick={() => removeLigne(i)} className="text-red-600 font-medium hover:underline">Retirer</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border-2 border-gray-400 bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Enregistrement...' : 'Enregistrer le transfert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
