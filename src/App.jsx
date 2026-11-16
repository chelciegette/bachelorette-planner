import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import OrganizerPage from './pages/OrganizerPage'
import PlanPage from './pages/PlanPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Hash routing (#/…) keeps the site deployable to GitHub Pages or any static
// host without server-side rewrite rules.
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<PlanPage />} />
          <Route path="/edit/:code" element={<PlanPage />} />
          <Route path="/organizer" element={<OrganizerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
