import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import MyRecords from './pages/MyRecords'

const tabs = [
  { to: '/', label: '오늘' },
  { to: '/timeline', label: '일정표' },
  { to: '/records', label: '내 기록' },
]

export default function App() {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
          <span className="font-medium">SKALog</span>
          <nav className="flex gap-4 text-sm">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/records" element={<MyRecords />} />
        </Routes>
      </main>
    </div>
  )
}
