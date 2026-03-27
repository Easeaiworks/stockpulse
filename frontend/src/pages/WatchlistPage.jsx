import React, { useState, useEffect } from 'react'
import {
  Trash2, RefreshCw, Loader2, Power, PowerOff,
  ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react'
import TickerSearch from '../components/TickerSearch'
import PriceChart from '../components/PriceChart'
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  toggleWatchlistItem, refreshItem
} from '../utils/api'

export default function WatchlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshingId, setRefreshingId] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchItems = async () => {
    try {
      const data = await getWatchlist()
      setItems(data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async (item) => {
    try {
      await addToWatchlist({
        symbol: item.symbol,
        name: item.name,
        security_type: item.security_type,
        exchange: item.exchange,
        currency: item.currency,
      })
      showToast(`${item.symbol} added to watchlist`)
      fetchItems()
    } catch (err) {
      showToast(err.message, 'error')
      throw err
    }
  }

  const handleRemove = async (id, symbol) => {
    if (!confirm(`Remove ${symbol} from your watchlist?`)) return
    try {
      await removeFromWatchlist(id)
      setItems(items.filter(i => i.id !== id))
      if (selectedSymbol === symbol) setSelectedSymbol(null)
      showToast(`${symbol} removed`)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleToggle = async (id, currentActive) => {
    try {
      await toggleWatchlistItem(id, !currentActive)
      fetchItems()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleRefresh = async (id) => {
    setRefreshingId(id)
    try {
      await refreshItem(id)
      fetchItems()
    } catch (err) {
      showToast('Failed to refresh', 'error')
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 dark:text-white">Watchlist</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Search and add securities to track
        </p>
      </div>

      {/* Search */}
      <TickerSearch onAdd={handleAdd} />

      {/* Chart */}
      {selectedSymbol && <PriceChart symbol={selectedSymbol} />}

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => {
            const pct = item.last_change_pct || 0
            const isUp = pct >= 0
            return (
              <div
                key={item.id}
                className={`card p-4 transition-all duration-300 animate-slide-up
                  ${!item.is_active ? 'opacity-50' : ''}
                  ${selectedSymbol === item.symbol ? 'ring-2 ring-gold-400 shadow-glow-gold' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {/* Symbol + info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedSymbol(selectedSymbol === item.symbol ? null : item.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-900 dark:text-white text-lg">{item.symbol}</span>
                      <span className="badge-blue text-[10px] uppercase">{item.security_type}</span>
                      {item.exchange && (
                        <span className="hidden sm:inline badge-gold text-[10px]">{item.exchange}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.name}</p>
                  </div>

                  {/* Price + change */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg text-brand-900 dark:text-white">
                      {item.last_price != null ? `$${item.last_price.toFixed(2)}` : '—'}
                    </div>
                    {item.last_price != null && (
                      <span className={`inline-flex items-center gap-0.5 text-sm font-semibold
                        ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(pct).toFixed(2)}%
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => setSelectedSymbol(selectedSymbol === item.symbol ? null : item.symbol)}
                      className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50
                                 dark:hover:bg-brand-800 transition-all duration-200"
                      title="View chart"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRefresh(item.id)}
                      disabled={refreshingId === item.id}
                      className="p-2 rounded-xl text-gray-400 hover:text-gold-500 hover:bg-gold-50
                                 dark:hover:bg-gold-900/20 transition-all duration-200"
                      title="Refresh price"
                    >
                      {refreshingId === item.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => handleToggle(item.id, item.is_active)}
                      className={`p-2 rounded-xl transition-all duration-200
                        ${item.is_active
                          ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-800'
                        }`}
                      title={item.is_active ? 'Pause tracking' : 'Resume tracking'}
                    >
                      {item.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id, item.symbol)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50
                                 dark:hover:bg-red-900/20 transition-all duration-200"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Volume bar (desktop) */}
                {item.last_volume && item.avg_volume && (
                  <div className="hidden sm:flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-brand-800/50">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Volume</span>
                    <div className="flex-1 bg-gray-100 dark:bg-brand-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          item.last_volume > item.avg_volume
                            ? 'bg-gold-500'
                            : 'bg-brand-400'
                        }`}
                        style={{ width: `${Math.min((item.last_volume / item.avg_volume) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(item.last_volume / 1e6).toFixed(1)}M
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Your watchlist is empty. Search above to add securities.
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50
                         px-5 py-3 rounded-xl shadow-2xl font-medium text-sm animate-slide-up
                         ${toast.type === 'error'
                           ? 'bg-red-600 text-white'
                           : 'bg-brand-800 text-white'
                         }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
