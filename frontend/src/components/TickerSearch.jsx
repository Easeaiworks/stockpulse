import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus, Loader2, TrendingUp, BarChart, DollarSign } from 'lucide-react'
import { searchSecurities } from '../utils/api'

const TYPE_ICONS = {
  stock: TrendingUp,
  etf: BarChart,
  fund: DollarSign,
  index: BarChart,
  option: TrendingUp,
}

const TYPE_COLORS = {
  stock: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-800/40',
  etf: 'text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-900/30',
  fund: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  index: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
  option: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
}

export default function TickerSearch({ onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [adding, setAdding] = useState(null)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await searchSecurities(value)
        setResults(data.results || [])
        setIsOpen(true)
      } catch (err) {
        console.error('Search failed:', err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  const handleAdd = async (item) => {
    setAdding(item.symbol)
    try {
      await onAdd(item)
      setQuery('')
      setResults([])
      setIsOpen(false)
    } catch (err) {
      console.error('Failed to add:', err)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search stocks, ETFs, funds by name or ticker..."
          className="input-field pl-12 pr-12 text-base"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500 animate-spin" />
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-40 w-full mt-2 bg-white dark:bg-brand-800 rounded-2xl
                        shadow-2xl shadow-brand-900/10 dark:shadow-brand-950/40
                        border border-gray-100 dark:border-brand-700/50
                        max-h-[70vh] overflow-y-auto animate-slide-up">
          {results.map((item, i) => {
            const Icon = TYPE_ICONS[item.security_type] || TrendingUp
            const colorClass = TYPE_COLORS[item.security_type] || TYPE_COLORS.stock
            return (
              <div
                key={`${item.symbol}-${i}`}
                className="flex items-center justify-between px-4 py-3
                           hover:bg-gray-50 dark:hover:bg-brand-700/50
                           transition-colors duration-150 cursor-pointer
                           border-b border-gray-50 dark:border-brand-700/30 last:border-0"
                onClick={() => handleAdd(item)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-900 dark:text-white">{item.symbol}</span>
                      <span className="badge-blue text-[10px] uppercase">{item.security_type}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.name}</p>
                    {item.exchange_display && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.exchange_display}</p>
                    )}
                  </div>
                </div>

                <button
                  className="flex-shrink-0 ml-3 p-2 rounded-xl bg-brand-600 hover:bg-brand-700
                             text-white shadow-md hover:shadow-lg transition-all duration-200
                             hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                  disabled={adding === item.symbol}
                >
                  {adding === item.symbol
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Plus className="w-4 h-4" />
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}

      {isOpen && query.length > 0 && results.length === 0 && !isLoading && (
        <div className="absolute z-40 w-full mt-2 bg-white dark:bg-brand-800 rounded-2xl
                        shadow-xl border border-gray-100 dark:border-brand-700/50 p-8 text-center animate-fade-in">
          <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different ticker or company name</p>
        </div>
      )}
    </div>
  )
}
