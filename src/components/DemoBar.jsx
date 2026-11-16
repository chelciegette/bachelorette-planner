import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { repository } from '../data'
import { forgetEditCode } from '../lib/rememberedCode'
import { SparkleIcon } from './ui/icons'

const navClass = ({ isActive }) =>
  `rounded-full px-3 py-1 font-medium transition ${
    isActive ? 'bg-champagne-700 text-cream-50' : 'text-champagne-700 hover:bg-champagne-300/60'
  }`

/**
 * Only shown while the data lives in this browser (`persistent: false`).
 * Once a real database is connected it disappears on its own.
 */
export default function DemoBar() {
  const navigate = useNavigate()
  const [armed, setArmed] = useState(null) // 'reset' | 'clear' — first click arms, second confirms
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!armed) return undefined
    const timer = setTimeout(() => setArmed(null), 3500)
    return () => clearTimeout(timer)
  }, [armed])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(timer)
  }, [notice])

  if (repository.meta.persistent) return null

  async function run(action) {
    if (armed !== action) {
      setArmed(action)
      return
    }
    setArmed(null)
    setBusy(true)
    if (action === 'reset') await repository.resetDemoData()
    else await repository.clearAll()
    forgetEditCode()
    setBusy(false)
    setNotice(action === 'reset' ? 'Sample data restored ✓' : 'All responses cleared ✓')
    navigate('/')
  }

  const actionClass = (action) =>
    `rounded-full px-3 py-1 font-medium transition disabled:opacity-50 ${
      armed === action ? 'bg-berry-600 text-white' : 'text-champagne-700 ring-1 ring-inset ring-champagne-500/50 hover:bg-champagne-300/60'
    }`

  return (
    <div className="border-b border-champagne-300/70 bg-champagne-100 text-xs text-champagne-700">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <p className="flex items-center gap-1.5">
          <SparkleIcon className="size-3 text-champagne-500" />
          <span>
            <strong className="font-semibold">Demo mode</strong>
            <span className="hidden sm:inline"> — responses are saved in this browser only</span>
          </span>
          {notice && <span className="ml-2 animate-fade-in font-medium text-sage-700">{notice}</span>}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <nav className="flex items-center gap-1" aria-label="Demo navigation">
            <NavLink to="/" end className={navClass}>
              Bridesmaid view
            </NavLink>
            <NavLink to="/organizer" className={navClass}>
              Organizer view
            </NavLink>
          </nav>
          <span className="mx-1 hidden h-4 w-px bg-champagne-300 sm:block" aria-hidden="true" />
          <button type="button" disabled={busy} onClick={() => run('reset')} className={actionClass('reset')}>
            {armed === 'reset' ? 'Tap again to reset' : 'Reset demo data'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('clear')} className={actionClass('clear')}>
            {armed === 'clear' ? 'Tap again to clear' : 'Start empty'}
          </button>
        </div>
      </div>
    </div>
  )
}
