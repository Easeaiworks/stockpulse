import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Loader2 } from 'lucide-react'
import { getHistory } from '../utils/api'

const PERIODS = [
  { value: '1d', label: '1D', interval: '5m' },
  { value: '5d', label: '5D', interval: '15m' },
  { value: '1mo', label: '1M', interval: '1d' },
  { value: '3mo', label: '3M', interval: '1d' },
  { value: '6mo', label: '6M', interval: '1wk' },
  { value: '1y', label: '1Y', interval: '1wk' },
  { value: '5y', label: '5Y', interval: '1mo' },
]

export default function PriceChart({ symbol }) {
  const [data, setData] = useState([])
  const [period, setPeriod] = useState('1mo')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    const p = PERIODS.find(p => p.value === period)
    setLoading(true)
    getHistory(symbol, period, p?.interval || '1d')
      .then(res => setData(res.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [symbol, period])

  if (!symbol) return null

  const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].close
  const strokeColor = isPositive ? '#16a34a' : '#dc2626'
  const fillColor = isPositive ? '#16a34a' : '#dc2626'

  return (
    <div className="card-gold p-4 sm:p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-900 dark:text-white">{symbol} Price Chart</h3>
        <div className="flex gap-1 bg-gray-100 dark:bg-brand-800/60 rounded-xl p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200
                ${period === p.value
                  ? 'bg-white dark:bg-brand-700 text-brand-700 dark:text-gold-400 shadow-sm'
                  : 'text-gray-500 hover:text-brand-600'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 sm:h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={55}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  padding: '12px',
                }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Close']}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#gradient-${symbol})`}
                dot={false}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  )
}
