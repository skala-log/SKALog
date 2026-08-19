import { Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar, TabBar } from './components/Shell'
import { AuthProvider } from './lib/auth'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './lib/toast'
import AdminMaterials from './pages/AdminMaterials'
import AdminSchedules from './pages/AdminSchedules'
import Home from './pages/Home'
import Login from './pages/Login'
import MyRecords from './pages/MyRecords'
import ScheduleDetail from './pages/ScheduleDetail'
import Showcase from './pages/Showcase'
import Timeline from './pages/Timeline'

/** 로그인은 사이드바·탭바 없이 단독 화면으로 뜬다.
 * 반 선택 온보딩은 없앴다 — 슬랙 표시 이름("판교_1반_탁연우")에서 반을 자동으로 읽어온다. */
const STANDALONE = ['/login']

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
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
        </Routes>
      </div>
    )
  }

  return (
    <AuthProvider>
      <StoreProvider>
        <AuthedShell />
      </StoreProvider>
    </AuthProvider>
  )
}

function AuthedShell() {
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
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/admin/materials" element={<AdminMaterials />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </div>
  )
}
