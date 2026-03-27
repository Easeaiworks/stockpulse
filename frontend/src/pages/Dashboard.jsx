import React, { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, RefreshCw, Loader2, Eye, ChevronRight,
  ArrowUpRight, ArrowDownRight, Zap, Clock
} from 'lucide-react'
import { getWatchlist, triggerFetchNow, getAlerts } from '../utils/api'
import PriceChart from '../components/PriceChart'

export default function Dashboard({ onNavigate }) {
  const [items, setItems] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(null)

  const fetchData = async () => {
    try {
      const [watchRes, alertRes] = await Promise.all([getWatchlist(), getAlerts()])
      setItems((watchRes.items || []).filter(i => i.is_active))
      setAlerts(alertRes.alerts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerFetchNow()
      setTimeout(fetchData, 3000) // Wait for fetch to complete
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setRefreshing(false), 3000)
    }
  }

  const gainers = items.filter(i => (i.last_change_pct || 0) > 0).sort((a, b) => b.last_change_pct - a.last_change_pct)
  const losers = items.filter(i => (i.last_change_pct || 0) < 0).sort((a, b) => a.last_change_pct - b.last_change_pct)
  const triggeredAlerts = alerts.filter(a => a.is_triggered)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {items.length > 0
              ? `Tracking ${items.length} securit${items.length === 1 ? 'y' : 'ies'}`
              : 'Add securities to start tracking'
            }
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-gold flex items-center gap-2 self-start"
        >
          {refreshing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          Refresh All
        </button>
      </div>

      {/* Stats cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Tracking"
            value={items.length}
            icon={Eye}
            color="brand"
          />
          <StatCard
            label="Gainers"
            value={gainers.length}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Losers"
            value={losers.length}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            label="Active Alerts"
            value={alerts.filter(a => a.is_active).length}
            icon={Zap}
            color="gold"
          />
        </div>
      )}

      {/* Recently triggered alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="card-gold p-4 sm:p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-gold-500" />
            <h2 className="font-semibold text-brand-900 dark:text-white">Recent Alerts</h2>
          </div>
          <div className="space-y-2">
            {triggeredAlerts.slice(0, 3).map(alert => (
              <div key={alert.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gold-50/50 dark:bg-gold-900/10
                           border border-gold-200/40 dark:border-gold-700/20">
                <div>
                  <span className="font-bold text-brand-900 dark:text-white">{alert.symbol}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist table */}
      {items.length > 0 ? (
        <div className="card overflow-hidden animate-slide-up">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-brand-700/50">
            <h2 className="font-semibold text-brand-900 dark:text-white">Your Watchlist</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Symbol</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Change</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-brand-800/50">
                {items.map((item, i) => {
                  const pct = item.last_change_pct || 0
                  const isUp = pct >= 0
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-brand-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedSymbol(selectedSymbol === item.symbol ? null : item.symbol)}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-900 dark:text-white">{item.symbol}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{item.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-brand-900 dark:text-white">
                          {item.last_price != null ? `$${item.last_price.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.last_price != null ? (
                          <span className={`inline-flex items-center gap-1 font-semibold
                            ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {Math.abs(pct).toFixed(2)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.last_volume ? item.last_volume.toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge-blue uppercase text-[10px]">{item.security_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200
                          ${selectedSymbol === item.symbol ? 'rotate-90' : ''}`} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-50 dark:divide-brand-800/50">
            {items.map((item) => {
              const pct = item.last_change_pct || 0
              const isUp = pct >= 0
              return (
                <div
                  key={item.id}
                  className="px-4 py-3.5 active:bg-gray-50 dark:active:bg-brand-800/30 transition-colors"
                  onClick={() => setSelectedSymbol(selectedSymbol === item.symbol ? null : item.symbol)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-900 dark:text-white">{item.symbol}</span>
                        <span className="badge-blue text-[10px] uppercase">{item.security_type}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[180px]">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand-900 dark:text-white">
                        {item.last_price != null ? `$${item.last_price.toFixed(2)}` : '—'}
                      </div>
                      {item.last_price != null && (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold
                          ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(pct).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState onNavigate={onNavigate} />
      )}

      {/* Selected symbol chart */}
      {selectedSymbol && <PriceChart symbol={selectedSymbol} />}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    brand: 'from-brand-600 to-brand-700 shadow-brand-600/20',
    green: 'from-green-500 to-green-600 shadow-green-500/20',
    red: 'from-red-500 to-red-600 shadow-red-500/20',
    gold: 'from-gold-500 to-gold-600 shadow-gold-500/20',
  }

  return (
    <div className="card p-4 sm:p-5 animate-slide-up hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-brand-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]}
                         flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNavigate }) {
  return (
    <div className="card-gold p-8 sm:p-12 text-center animate-slide-up">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-600 to-brand-800
                      rounded-2xl flex items-center justify-center shadow-xl shadow-brand-600/20 mb-4">
        <TrendingUp className="w-8 h-8 text-gold-400" />
      </div>
      <h3 className="text-xl font-bold text-brand-900 dark:text-white">Welcome to StockPulse</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
        Start by adding stocks, ETFs, or funds to your watchlist. You'll see live prices,
        charts, and can set up smart alerts.
      </p>
      <button
        onClick={() => onNavigate('watchlist')}
        className="btn-gold mt-6 inline-flex items-center gap-2"
      >
        <TrendingUp className="w-4 h-4" />
        Add Your First Security
      </button>
    </div>
  )
}
