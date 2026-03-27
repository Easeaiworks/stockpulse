import React, { useState, useEffect } from 'react'
import {
  Bell, Plus, Trash2, Power, PowerOff, Loader2,
  ArrowUp, ArrowDown, Percent, BarChart3, Zap
} from 'lucide-react'
import {
  getAlerts, createAlert, updateAlert, deleteAlert, getWatchlist
} from '../utils/api'

const ALERT_TYPES = [
  { value: 'price_above', label: 'Price Above', icon: ArrowUp, description: 'Alert when price rises above' },
  { value: 'price_below', label: 'Price Below', icon: ArrowDown, description: 'Alert when price drops below' },
  { value: 'pct_change_up', label: '% Gain', icon: Percent, description: 'Alert on daily % increase' },
  { value: 'pct_change_down', label: '% Drop', icon: Percent, description: 'Alert on daily % decrease' },
  { value: 'volume_spike', label: 'Volume Spike', icon: BarChart3, description: 'Alert when volume is X times average' },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [watchlistItems, setWatchlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState(null)

  // Form state
  const [formItemId, setFormItemId] = useState('')
  const [formType, setFormType] = useState('price_above')
  const [formThreshold, setFormThreshold] = useState('')
  const [formRecurring, setFormRecurring] = useState(false)
  const [formNote, setFormNote] = useState('')

  const fetchData = async () => {
    try {
      const [alertRes, watchRes] = await Promise.all([getAlerts(), getWatchlist()])
      setAlerts(alertRes.alerts || [])
      setWatchlistItems((watchRes.items || []).filter(i => i.is_active))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formItemId || !formThreshold) return

    setCreating(true)
    try {
      await createAlert({
        watchlist_item_id: parseInt(formItemId),
        alert_type: formType,
        threshold_value: parseFloat(formThreshold),
        recurring: formRecurring,
        note: formNote || undefined,
      })
      showToastMsg('Alert created')
      setShowForm(false)
      setFormItemId('')
      setFormThreshold('')
      setFormNote('')
      fetchData()
    } catch (err) {
      showToastMsg(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id, currentActive) => {
    try {
      await updateAlert(id, { is_active: !currentActive })
      fetchData()
    } catch (err) {
      showToastMsg(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this alert?')) return
    try {
      await deleteAlert(id)
      setAlerts(alerts.filter(a => a.id !== id))
      showToastMsg('Alert deleted')
    } catch (err) {
      showToastMsg(err.message, 'error')
    }
  }

  const selectedItem = watchlistItems.find(i => i.id === parseInt(formItemId))
  const selectedType = ALERT_TYPES.find(t => t.value === formType)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 dark:text-white">Alerts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set price and volume alerts for your watchlist
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-gold flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card-gold p-5 sm:p-6 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-brand-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold-500" />
            Create New Alert
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Security select */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Security</label>
              <select
                value={formItemId}
                onChange={(e) => setFormItemId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a security...</option>
                {watchlistItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.symbol} — {item.name} {item.last_price ? `($${item.last_price.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Alert type */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Alert Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="input-field"
              >
                {ALERT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label} — {t.description}</option>
                ))}
              </select>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {formType.includes('pct') ? 'Percentage (%)' :
                 formType === 'volume_spike' ? 'Multiplier (e.g., 2 = 2x average)' :
                 `Price (${selectedItem?.currency || 'USD'})`}
              </label>
              <input
                type="number"
                step="any"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
                placeholder={
                  formType.includes('pct') ? 'e.g., 5' :
                  formType === 'volume_spike' ? 'e.g., 2' :
                  selectedItem?.last_price ? `Current: $${selectedItem.last_price.toFixed(2)}` : 'e.g., 150.00'
                }
                className="input-field"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Note (optional)</label>
              <input
                type="text"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="e.g., Buy signal, Take profit..."
                className="input-field"
              />
            </div>
          </div>

          {/* Recurring toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative
              ${formRecurring ? 'bg-gold-500' : 'bg-gray-300 dark:bg-brand-700'}`}
              onClick={() => setFormRecurring(!formRecurring)}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200
                ${formRecurring ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
                style={{ transform: formRecurring ? 'translateX(22px)' : 'translateX(0)' }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Recurring — re-activate after triggering
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Create Alert
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const typeInfo = ALERT_TYPES.find(t => t.value === alert.alert_type)
            const Icon = typeInfo?.icon || Bell
            return (
              <div
                key={alert.id}
                className={`card p-4 transition-all duration-300 animate-slide-up
                  ${!alert.is_active ? 'opacity-50' : ''}
                  ${alert.is_triggered ? 'ring-1 ring-gold-400/50' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${alert.is_triggered
                      ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400'
                      : alert.is_active
                        ? 'bg-brand-50 dark:bg-brand-800/40 text-brand-600 dark:text-brand-400'
                        : 'bg-gray-100 dark:bg-brand-800/30 text-gray-400'
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-brand-900 dark:text-white">{alert.symbol}</span>
                      <span className="badge-blue text-[10px]">{typeInfo?.label || alert.alert_type}</span>
                      {alert.is_triggered && <span className="badge-gold text-[10px]">Triggered</span>}
                      {alert.recurring && <span className="badge-green text-[10px]">Recurring</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typeInfo?.description} <span className="font-semibold">{alert.threshold_value}</span>
                      {alert.current_price && (
                        <span className="ml-2 text-xs">(now: ${alert.current_price.toFixed(2)})</span>
                      )}
                    </p>
                    {alert.note && (
                      <p className="text-xs text-gold-600 dark:text-gold-400 mt-0.5">{alert.note}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(alert.id, alert.is_active)}
                      className={`p-2 rounded-xl transition-all duration-200
                        ${alert.is_active
                          ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-800'
                        }`}
                    >
                      {alert.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50
                                 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No alerts configured yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {watchlistItems.length > 0
              ? 'Click "New Alert" to set up your first alert.'
              : 'Add securities to your watchlist first, then set alerts.'}
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50
                         px-5 py-3 rounded-xl shadow-2xl font-medium text-sm animate-slide-up
                         ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-800 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
