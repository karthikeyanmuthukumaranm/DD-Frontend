import React, { useEffect, useMemo } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { UploadPage } from './pages/UploadPage'
import { DashboardPage } from './pages/DashboardPage'
import { AboutPage } from './pages/AboutPage'
import { useDocuments } from './contexts/DocumentsContext'
import { useToasts } from './contexts/ToastContext'
import { isOverdue, isUpcoming } from './utils/date'

function App() {
  const { documents } = useDocuments()
  const { pushToast } = useToasts()
  const location = useLocation()

  const { upcomingCount, overdueCount } = useMemo(() => {
    return {
      upcomingCount: documents.filter(isUpcoming).length,
      overdueCount: documents.filter(isOverdue).length,
    }
  }, [documents])

  // Lightweight "notifications UI" using toasts (mock behavior).
  useEffect(() => {
    // Avoid spamming on initial load if user is navigating around.
    if (location.pathname !== '/' && location.pathname !== '/dashboard') return
    if (overdueCount > 0) {
      pushToast({
        kind: 'warning',
        title: `${overdueCount} overdue deadline${overdueCount === 1 ? '' : 's'}`,
        message: 'Review overdue documents and update status.',
      })
    } else if (upcomingCount > 0) {
      pushToast({
        kind: 'info',
        title: `${upcomingCount} upcoming deadline${upcomingCount === 1 ? '' : 's'}`,
        message: 'Keep an eye on documents due soon.',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
