import React, { useState, useEffect } from 'react'
import {
  Settings, Mail, MessageSquare, Clock, Save, Loader2, CheckCircle2,
  Wifi, Timer
} from 'lucide-react'
import {
  getNotificationSettings, updateNotificationSettings,
  getSchedulerJobs, setFetchInterval
} from '../utils/api'

const SMS_GATEWAYS = [
  { label: 'Select carrier...', value: '' },
  { label: 'T-Mobile (US)', value: '@tmomail.net' },
  { label: 'AT&T (US)', value: '@txt.att.net' },
  { label: 'Verizon (US)', value: '@vtext.com' },
  { label: 'Sprint (US)', value: '@messaging.sprintpcs.com' },
  { label: 'Vodafone (UK)', value: '@vodafone.net' },
  { label: 'O2 (UK)', value: '@o2.co.uk' },
  { label: 'Rogers (CA)', value: '@pcs.rogers.com' },
  { label: 'Bell (CA)', value: '@txt.bellmobility.ca' },
  { label: 'Telus (CA)', value: '@msg.telus.com' },
]

const INTERVALS = [
  { label: 'Every 5 minutes', value: 5 },
  { label: 'Every 15 minutes', value: 15 },
  { label: 'Every 30 minutes', value: 30 },
  { label: 'Every hour', value: 60 },
  { label: 'Every 4 hours', value: 240 },
  { label: 'Every 12 hours', value: 720 },
  { label: 'Once daily', value: 1440 },
  { label: 'Once weekly', value: 10080 },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [interval, setInterval] = useState(60)
  const [savingInterval, setSavingInterval] = useState(false)

  // SMS form
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsGateway, setSmsGateway] = useState('')

  useEffect(() => {
    Promise.all([getNotificationSettings(), getSchedulerJobs()])
      .then(([nsData, jobsData]) => {
        setSettings(nsData.settings || {})
        setJobs(jobsData.jobs || [])

        // Parse SMS gateway email
        const gw = nsData.settings?.sms_gateway_email || ''
        if (gw.includes('@')) {
          setPhoneNumber(gw.split('@')[0])
          setSmsGateway('@' + gw.split('@')[1])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const smsGatewayEmail = phoneNumber && smsGateway ? `${phoneNumber}${smsGateway}` : ''
      await updateNotificationSettings({
        ...settings,
        sms_gateway_email: smsGatewayEmail,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleIntervalSave = async () => {
    setSavingInterval(true)
    try {
      await setFetchInterval(interval)
      const jobsData = await getSchedulerJobs()
      setJobs(jobsData.jobs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSavingInterval(false)
    }
  }

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure notifications, fetch schedule, and preferences
        </p>
      </div>

      {/* Fetch Schedule */}
      <div className="card-gold p-5 sm:p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-5 h-5 text-gold-500" />
          <h2 className="font-semibold text-brand-900 dark:text-white">Fetch Schedule</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              How often to check prices
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value))}
              className="input-field"
            >
              {INTERVALS.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>

          <button onClick={handleIntervalSave} disabled={savingInterval} className="btn-primary flex items-center gap-2">
            {savingInterval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            Update Schedule
          </button>

          {/* Active jobs */}
          {jobs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-brand-800/50">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Active Jobs
              </p>
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-green-500 animate-pulse-soft" />
                    <span className="text-gray-700 dark:text-gray-300">{job.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Next: {job.next_run ? new Date(job.next_run).toLocaleString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="card p-5 sm:p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-brand-500" />
          <h2 className="font-semibold text-brand-900 dark:text-white">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer
              ${settings?.email_enabled ? 'bg-gold-500' : 'bg-gray-300 dark:bg-brand-700'}`}
              onClick={() => updateField('email_enabled', !settings?.email_enabled)}
            >
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
                style={{ transform: settings?.email_enabled ? 'translateX(22px)' : 'translateX(0)' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable email alerts</span>
          </label>

          {settings?.email_enabled && (
            <div className="space-y-3 animate-slide-up">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={settings?.email_address || ''}
                  onChange={(e) => updateField('email_address', e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings?.smtp_host || ''}
                    onChange={(e) => updateField('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings?.smtp_port || 587}
                    onChange={(e) => updateField('smtp_port', parseInt(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={settings?.smtp_user || ''}
                    onChange={(e) => updateField('smtp_user', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={settings?.smtp_password || ''}
                    onChange={(e) => updateField('smtp_password', e.target.value)}
                    placeholder="App password"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Digest options */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.daily_digest || false}
                    onChange={(e) => updateField('daily_digest', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Daily digest</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.weekly_digest || false}
                    onChange={(e) => updateField('weekly_digest', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Weekly digest</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="card p-5 sm:p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          <h2 className="font-semibold text-brand-900 dark:text-white">SMS Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer
              ${settings?.sms_enabled ? 'bg-gold-500' : 'bg-gray-300 dark:bg-brand-700'}`}
              onClick={() => updateField('sms_enabled', !settings?.sms_enabled)}
            >
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
                style={{ transform: settings?.sms_enabled ? 'translateX(22px)' : 'translateX(0)' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable SMS alerts (free via email gateway)</span>
          </label>

          {settings?.sms_enabled && (
            <div className="space-y-3 animate-slide-up">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                SMS alerts use your carrier's email-to-SMS gateway — completely free, no Twilio needed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234567890"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Carrier
                  </label>
                  <select
                    value={smsGateway}
                    onChange={(e) => setSmsGateway(e.target.value)}
                    className="input-field"
                  >
                    {SMS_GATEWAYS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="sticky bottom-20 md:bottom-6 z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold
                      shadow-xl transition-all duration-300
                      ${saved
                        ? 'bg-green-500 text-white shadow-green-500/25'
                        : 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5'
                      }`}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> :
           saved ? <CheckCircle2 className="w-5 h-5" /> :
           <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
