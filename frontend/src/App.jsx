import React, { useState, useEffect } from 'react'
import {
  Activity, Search, Bell, Settings, BarChart3, TrendingUp,
  Moon, Sun, Menu, X
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import WatchlistPage from './pages/WatchlistPage'
import AlertsPage from './pages/AlertsPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'watchlist', label: 'Watchlist', icon: Search },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'report', label: 'Report', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />
      case 'watchlist': return <WatchlistPage />
      case 'alerts': return <AlertsPage />
      case 'report': return <ReportPage />
      case 'settings': return <SettingsPage />
      default: return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gold-50/30
                    dark:from-brand-950 dark:via-brand-900 dark:to-brand-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-brand-900/80 backdrop-blur-xl
                         border-b border-gray-200/50 dark:border-brand-700/50 shadow-lg shadow-brand-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
              <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl
                              flex items-center justify-center shadow-lg shadow-brand-600/25
                              group-hover:shadow-brand-600/40 transition-all duration-300
                              group-hover:scale-105">
                <TrendingUp className="w-5 h-5 text-gold-400" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-brand-800 to-brand-600
                               dark:from-white dark:to-brand-200 bg-clip-text text-transparent">
                StockPulse
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/70 dark:bg-brand-800/50 rounded-xl p-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentPage(id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${currentPage === id
                      ? 'bg-white dark:bg-brand-700 text-brand-700 dark:text-gold-400 shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-brand-800
                           transition-all duration-200 hover:text-gold-500 hover:shadow-md"
                aria-label="Toggle dark mode"
              >
                {darkMode
                  ? <Sun className="w-5 h-5 text-gold-400" />
                  : <Moon className="w-5 h-5" />
                }
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-brand-800
                           transition-all duration-200"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-brand-800 bg-white/95 dark:bg-brand-900/95
                          backdrop-blur-xl pb-3 animate-slide-up">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setCurrentPage(id); setMobileMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all duration-200
                  ${currentPage === id
                    ? 'bg-brand-50 dark:bg-brand-800/60 text-brand-700 dark:text-gold-400 border-l-4 border-gold-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-800/40'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
        {renderPage()}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white/90 dark:bg-brand-900/90 backdrop-blur-xl
                      border-t border-gray-200/50 dark:border-brand-700/50
                      shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-medium
                transition-all duration-200 min-w-[56px]
                ${currentPage === id
                  ? 'text-brand-700 dark:text-gold-400 scale-105'
                  : 'text-gray-400 dark:text-gray-500 hover:text-brand-600'
                }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-200
                ${currentPage === id ? 'drop-shadow-[0_0_6px_rgba(245,197,24,0.4)]' : ''}`} />
              <span className="truncate">{label}</span>
              {currentPage === id && (
                <div className="absolute -bottom-0 w-8 h-0.5 bg-gradient-to-r from-gold-400 to-gold-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </div>
  )
}
