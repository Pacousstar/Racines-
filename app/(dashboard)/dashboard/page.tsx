'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  ClipboardList,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 60000
  if (diff < 1) return 'À l\'instant'
  if (diff < 60) return `Il y a ${Math.floor(diff)} min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)} h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

type Widget = {
  id: string
  name: string
  visible: boolean
  order: number
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    transactionsJour: number
    produitsEnStock: number
    totalProduitsCatalogue?: number
    mouvementsJour: number
    clientsActifs: number
    lowStock: Array<{ name: string; stock: number; min: number; category: string }>
    recentSales: Array<{ id: string; client: string; time: string }>
    repartition: Array<{ name: string; percent: number }>
  } | null>(null)
  const [statsGraphiques, setStatsGraphiques] = useState<{
    caParPeriode: Array<{ date: string; ca: number; achats: number }>
    evolutionStock: Array<{ date: string; entrees: number; sorties: number }>
    topProduits: Array<{ produitId: number; code: string; designation: string; quantite: number; montant: number }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingGraphiques, setLoadingGraphiques] = useState(true)
  const [periodeGraphique, setPeriodeGraphique] = useState<'7' | '30' | '90' | 'mois'>('30')
  const [err, setErr] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loadingPreferences, setLoadingPreferences] = useState(true)

  // Charger les préférences utilisateur
  useEffect(() => {
    setLoadingPreferences(true)
    fetch('/api/dashboard/preferences')
      .then((r) => (r.ok ? r.json() : { widgets: null, periode: '30' }))
      .then((prefs) => {
        if (prefs.widgets && Array.isArray(prefs.widgets)) {
          setWidgets(prefs.widgets)
        }
        if (prefs.periode) {
          setPeriodeGraphique(prefs.periode as '7' | '30' | '90' | 'mois')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPreferences(false))
  }, [])

  useEffect(() => {
    setErr(null)
    const timeoutMs = 20000 // 20 secondes (base peut être lente ou verrouillée)
    const timeout = setTimeout(() => {
      if (loading) {
        setErr('Chargement trop long. Fermez le portable (Lancer.bat) si ouvert, puis réessayez. Vérifiez aussi la connexion à la base.')
        setLoading(false)
      }
    }, timeoutMs)

    fetch('/api/dashboard')
      .then(async (r) => {
        clearTimeout(timeout)
        const d = await r.json().catch(() => ({}))
        if (r.ok) {
          setData(d)
          if (d._timeout) {
            setErr('Réponse partielle (timeout). Fermez le portable puis rechargez la page.')
          } else {
            setErr(null)
          }
        } else {
          setData(null)
          setErr(d?.error || 'Erreur serveur')
        }
      })
      .catch((e) => {
        clearTimeout(timeout)
        setData(null)
        setErr('Erreur de connexion: ' + (e.message || 'Erreur serveur'))
      })
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    return () => clearTimeout(timeout)
  }, [])

  // Charger les données graphiques (utilise la période des préférences)
  useEffect(() => {
    if (loadingPreferences) return // Attendre que les préférences soient chargées
    setLoadingGraphiques(true)
    fetch(`/api/rapports/stats?periode=${periodeGraphique}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (r.ok) {
          setStatsGraphiques(d)
        } else {
          setStatsGraphiques(null)
        }
      })
      .catch(() => {
        setStatsGraphiques(null)
      })
      .finally(() => {
        setLoadingGraphiques(false)
      })
  }, [periodeGraphique, loadingPreferences])

  // Fonction pour vérifier si un widget est visible
  const isWidgetVisible = (widgetId: string): boolean => {
    if (widgets.length === 0) return true // Par défaut, tous visibles
    const widget = widgets.find((w) => w.id === widgetId)
    return widget ? widget.visible : true
  }

  // Fonction pour obtenir l'ordre d'un widget
  const getWidgetOrder = (widgetId: string): number => {
    if (widgets.length === 0) return 999 // Par défaut, ordre élevé
    const widget = widgets.find((w) => w.id === widgetId)
    return widget ? widget.order : 999
  }

  const handlePeriodeChange = (periode: '7' | '30' | '90' | 'mois') => {
    setPeriodeGraphique(periode)
    // Sauvegarder la préférence
    fetch('/api/dashboard/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgets: widgets.length > 0 ? widgets : null,
        periode,
      }),
    }).catch(() => {})
  }

  const stats = data
    ? [
        { title: 'Produits (catalogue)', value: String(data.totalProduitsCatalogue ?? data.produitsEnStock), change: 0, icon: Package, color: 'from-indigo-500 to-purple-600' as const },
        { title: 'Transactions du jour', value: String(data.transactionsJour), change: 0, icon: ClipboardList, color: 'from-yellow-400 to-yellow-500' as const },
        { title: 'Produits en stock (qté > 0)', value: String(data.produitsEnStock), change: 0, icon: ShoppingBag, color: 'from-emerald-500 to-teal-600' as const },
        { title: 'Mouvements du jour', value: String(data.mouvementsJour), change: 0, icon: LayoutGrid, color: 'from-pink-500 to-rose-600' as const },
        { title: 'Clients actifs', value: String(data.clientsActifs), change: 0, icon: Users, color: 'from-cyan-500 to-emerald-600' as const },
      ]
    : [
        { title: 'Produits (catalogue)', value: '0', change: 0, icon: Package, color: 'from-indigo-500 to-purple-600' as const },
        { title: 'Transactions du jour', value: '0', change: 0, icon: ClipboardList, color: 'from-yellow-400 to-yellow-500' as const },
        { title: 'Produits en stock (qté > 0)', value: '0', change: 0, icon: ShoppingBag, color: 'from-emerald-500 to-teal-600' as const },
        { title: 'Mouvements du jour', value: '0', change: 0, icon: LayoutGrid, color: 'from-pink-500 to-rose-600' as const },
        { title: 'Clients actifs', value: '0', change: 0, icon: Users, color: 'from-cyan-500 to-emerald-600' as const },
      ]

  const lowStock = data?.lowStock ?? []
  const recentSales = data?.recentSales ?? []
  const repartition = data?.repartition?.length ? data.repartition : [
    { name: '—', percent: 100 },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
          {err}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-white/90">Vue d&apos;ensemble opérationnelle — stocks, alertes, activité</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {stats
          .map((stat, i) => {
            let widgetId = ''
            if (stat.title === 'Transactions du jour') widgetId = 'transactions'
            else if (stat.title === 'Produits (catalogue)' || stat.title === 'Produits en stock (qté > 0)') widgetId = 'produits'
            else if (stat.title === 'Mouvements du jour') widgetId = 'mouvements'
            else if (stat.title === 'Clients actifs') widgetId = 'clients'
            return { ...stat, widgetId, originalIndex: i }
          })
          .filter((stat) => isWidgetVisible(stat.widgetId))
          .sort((a, b) => getWidgetOrder(a.widgetId) - getWidgetOrder(b.widgetId))
          .map((stat) => {
            const Icon = stat.icon
            const isPositive = stat.change > 0
            const isNeutral = stat.change === 0
            return (
              <div key={stat.originalIndex} className={`overflow-hidden rounded-xl bg-gradient-to-br ${stat.color} p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/90">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                  {!isNeutral && (
                    <div className="mt-2 flex items-center gap-1">
                      {isPositive ? <ArrowUp className="h-4 w-4 text-white/90" /> : <ArrowDown className="h-4 w-4 text-white/90" />}
                      <span className="text-sm font-medium text-white/90">
                        {Math.abs(stat.change)}%
                      </span>
                      <span className="text-sm text-white/70">vs hier</span>
                    </div>
                  )}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-orange-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Ventes récentes</h2>
            <Link href="/dashboard/ventes" className="text-sm font-medium text-orange-600 hover:text-orange-700">
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune vente récente.</p>
            ) : (
              recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900">{s.client}</p>
                    <p className="text-sm text-gray-500">{s.id} · {formatTime(s.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg border border-orange-100">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Stock faible</h2>
            </div>
            {lowStock.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                {lowStock.length} produit(s)
              </span>
            )}
          </div>
          <div className="space-y-4">
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune alerte.</p>
            ) : (
              lowStock.map((p, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{p.stock} / {p.min}</p>
                    <p className="text-xs text-gray-500">unités</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/dashboard/stock" className="mt-4 block w-full rounded-lg bg-orange-500 py-2 text-center text-sm font-medium text-white hover:bg-orange-600">
            Voir le stock
          </Link>
        </div>
      </div>

      {/* Graphiques */}
      {(isWidgetVisible('ca') || isWidgetVisible('stock')) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Évolution CA */}
          {isWidgetVisible('ca') && (
            <div className="rounded-xl bg-white p-6 shadow-lg border border-orange-100" style={{ order: getWidgetOrder('ca') }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">Évolution CA et Achats</h2>
                </div>
            <select
              value={periodeGraphique}
              onChange={(e) => handlePeriodeChange(e.target.value as '7' | '30' | '90' | 'mois')}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="mois">12 mois</option>
            </select>
          </div>
          {loadingGraphiques ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : statsGraphiques?.caParPeriode && statsGraphiques.caParPeriode.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statsGraphiques.caParPeriode}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (periodeGraphique === 'mois') {
                      return value
                    }
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number | undefined) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ca"
                  name="Chiffre d'affaires"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="achats"
                  name="Achats"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">
              <p>Aucune donnée disponible pour cette période.</p>
            </div>
          )}
            </div>
          )}

          {/* Mouvements de stock */}
          {isWidgetVisible('stock') && (
            <div className="rounded-xl bg-white p-6 shadow-lg border border-orange-100" style={{ order: getWidgetOrder('stock') }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">Mouvements de stock</h2>
                </div>
              </div>
          {loadingGraphiques ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : statsGraphiques?.evolutionStock && statsGraphiques.evolutionStock.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsGraphiques.evolutionStock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (periodeGraphique === 'mois') {
                      return value
                    }
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="entrees" name="Entrées" fill="#10b981" />
                <Bar dataKey="sorties" name="Sorties" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">
              <p>Aucune donnée disponible pour cette période.</p>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {(isWidgetVisible('repartition') || isWidgetVisible('actions') || isWidgetVisible('topProduits')) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Répartition par catégorie */}
          {isWidgetVisible('repartition') && (
            <div className="rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden" style={{ order: getWidgetOrder('repartition') }}>
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-4">
                <h2 className="text-xl font-bold text-white">Répartition par catégorie</h2>
              </div>
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {repartition.map((c, i) => {
                const colors = [
                  'from-blue-500 to-cyan-600',
                  'from-purple-500 to-pink-600',
                  'from-emerald-500 to-green-600',
                  'from-orange-500 to-amber-600',
                  'from-indigo-500 to-blue-600',
                  'from-rose-500 to-pink-600',
                  'from-violet-500 to-purple-600',
                  'from-teal-500 to-emerald-600',
                ]
                const colorClass = colors[i % colors.length]
                return (
                  <div key={i}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold text-gray-800">{c.name}</span>
                      <span className="font-bold text-gray-600">{c.percent} %</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
                      <div className={`h-full rounded-full bg-gradient-to-r ${colorClass} shadow-sm transition-all duration-500`} style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
            </div>
          )}

          {/* Top produits */}
          {isWidgetVisible('topProduits') && (
            <div className="rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden" style={{ order: getWidgetOrder('topProduits') }}>
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-white" />
                    <h2 className="text-xl font-bold text-white">Top produits</h2>
                  </div>
                  <Link href="/dashboard/rapports" className="text-xs font-medium text-white/90 hover:text-white underline">
                    Voir tout
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {loadingGraphiques ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                ) : statsGraphiques?.topProduits && statsGraphiques.topProduits.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {statsGraphiques.topProduits.map((p, i) => (
                      <div key={p.produitId} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-sm font-bold text-white">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{p.designation}</p>
                            <p className="text-xs text-gray-500">{p.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{p.quantite} unités</p>
                          <p className="text-xs text-gray-500">{Number(p.montant).toLocaleString('fr-FR')} F</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Aucune vente enregistrée.</p>
                )}
              </div>
            </div>
          )}

          {/* Actions rapides */}
          {isWidgetVisible('actions') && (
            <div className="rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden" style={{ order: getWidgetOrder('actions') }}>
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4">
                <h2 className="text-xl font-bold text-white">Actions rapides</h2>
              </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link href="/dashboard/produits" className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 p-4 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Nouveau produit</p>
                  <p className="text-xs text-white/80">Ajouter au catalogue</p>
                </div>
              </Link>
              <Link href="/dashboard/ventes" className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Nouvelle vente</p>
                  <p className="text-xs text-white/80">Ouvrir la caisse</p>
                </div>
              </Link>
              <Link href="/dashboard/clients" className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 p-4 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Nouveau client</p>
                  <p className="text-xs text-white/80">Créer un compte</p>
                </div>
              </Link>
              <Link href="/dashboard/achats" className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 p-4 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Nouvel achat</p>
                  <p className="text-xs text-white/80">Approvisionnement</p>
                </div>
              </Link>
            </div>
          </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
