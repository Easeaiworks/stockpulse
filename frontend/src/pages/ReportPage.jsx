import React, { useState, useEffect } from 'react'
import {
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2,
  Download, TrendingUp, TrendingDown
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getReport, triggerFetchNow } from '../utils/api'

export default function ReportPage() {
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReport = async () => {
    try {
      const data = await getReport()
      setReport(data.report || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerFetchNow()
      setTimeout(fetchReport, 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setRefreshing(false), 3000)
    }
  }

  const gainers = report.filter(r => (r.change_pct || 0) > 0)
  const losers = report.filter(r => (r.change_pct || 0) < 0)

  // Chart data
  const chartData = report
    .filter(r => r.change_pct != null)
    .sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0))
    .slice(0, 20)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 dark:text-white">Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Portfolio performance summary
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary flex items-center gap-2">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : report.length > 0 ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-brand-900 dark:text-white mt-1">{report.length}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Gainers</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{gainers.length}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Losers</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{losers.length}</p>
            </div>
          </div>

          {/* Change chart */}
          {chartData.length > 0 && (
            <div className="card-gold p-4 sm:p-6 animate-slide-up">
              <h3 className="text-sm font-semibold text-brand-900 dark:text-white mb-4">Daily Change (%)</h3>
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v.toFixed(1)}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="symbol"
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        padding: '10px 14px',
                      }}
                      formatter={(value) => [`${value.toFixed(2)}%`, 'Change']}
                    />
                    <Bar dataKey="change_pct" radius={[0, 6, 6, 0]} animationDuration={800}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.symbol}
                          fill={(entry.change_pct || 0) >= 0 ? '#16a34a' : '#dc2626'}
                          opacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Gainers + Losers side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Gainers */}
            {gainers.length > 0 && (
              <div className="card overflow-hidden animate-slide-up">
                <div className="px-4 sm:px-5 py-3 border-b border-gray-50 dark:border-brand-800/50
                                flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h3 className="font-semibold text-brand-900 dark:text-white text-sm">Top Gainers</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-brand-800/50">
                  {gainers.slice(0, 10).map(item => (
                    <div key={item.symbol} className="px-4 sm:px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-brand-900 dark:text-white">{item.symbol}</span>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-brand-900 dark:text-white">
                          ${item.price?.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 text-sm font-semibold justify-end">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          {Math.abs(item.change_pct || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Losers */}
            {losers.length > 0 && (
              <div className="card overflow-hidden animate-slide-up">
                <div className="px-4 sm:px-5 py-3 border-b border-gray-50 dark:border-brand-800/50
                                flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-brand-900 dark:text-white text-sm">Top Losers</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-brand-800/50">
                  {losers.slice(0, 10).map(item => (
                    <div key={item.symbol} className="px-4 sm:px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-brand-900 dark:text-white">{item.symbol}</span>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-brand-900 dark:text-white">
                          ${item.price?.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400 text-sm font-semibold justify-end">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {Math.abs(item.change_pct || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full table */}
          <div className="card overflow-hidden animate-slide-up">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-brand-700/50">
              <h3 className="font-semibold text-brand-900 dark:text-white">Full Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 sm:px-6 py-3">Symbol</th>
                    <th className="px-4 sm:px-6 py-3">Name</th>
                    <th className="px-4 sm:px-6 py-3">Price</th>
                    <th className="px-4 sm:px-6 py-3">Change</th>
                    <th className="px-4 sm:px-6 py-3 hidden sm:table-cell">Volume</th>
                    <th className="px-4 sm:px-6 py-3 hidden sm:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-brand-800/50">
                  {report.map(item => {
                    const pct = item.change_pct || 0
                    const isUp = pct >= 0
                    return (
                      <tr key={item.symbol} className="hover:bg-gray-50/50 dark:hover:bg-brand-800/30 transition-colors">
                        <td className="px-4 sm:px-6 py-3 font-bold text-brand-900 dark:text-white">{item.symbol}</td>
                        <td className="px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{item.name}</td>
                        <td className="px-4 sm:px-6 py-3 font-semibold">${item.price?.toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`inline-flex items-center gap-0.5 font-semibold
                            ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(pct).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-500 hidden sm:table-cell">
                          {item.volume ? item.volume.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 hidden sm:table-cell">
                          <span className="badge-blue text-[10px] uppercase">{item.security_type}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center">
          <BarChart3 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No data to report yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add securities to your watchlist and wait for data to be fetched.</p>
        </div>
      )}
    </div>
  )
}
