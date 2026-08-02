import { Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar, TabBar } from './components/Shell'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './lib/toast'
import AdminMaterials from './pages/AdminMaterials'
import AdminSchedules from './pages/AdminSchedules'
import ClassSelect from './pages/ClassSelect'
import Home from './pages/Home'
import Login from './pages/Login'
import MyRecords from './pages/MyRecords'
import ScheduleDetail from './pages/ScheduleDetail'
import Timeline from './pages/Timeline'

/** 로그인/온보딩은 사이드바·탭바 없이 단독 화면으로 뜬다. */
const STANDALONE = ['/login', '/onboarding/class']

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  )
}

function Shell() {
  const { pathname } = useLocation()
  const standalone = STANDALONE.includes(pathname)

  if (standalone) {
    return (
      <div className="min-h-dvh bg-app text-ink">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding/class" element={<ClassSelect />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-app text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/timeline/:id" element={<ScheduleDetail />} />
            <Route path="/records" element={<MyRecords />} />
            <Route path="/admin/materials" element={<AdminMaterials />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </div>
  )
}
