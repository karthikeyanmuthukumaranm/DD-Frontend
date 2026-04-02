import React, { useEffect, useMemo } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CompaniesPage } from './pages/CompaniesPage'
import { CustomersPage } from './pages/CustomersPage'
import { PoliciesPage } from './pages/PoliciesPage'
import { LeadsPage } from './pages/LeadsPage'
import { ReportsPage } from './pages/ReportsPage'
import { useAuth } from './contexts/AuthContext'
import { useToasts } from './contexts/ToastContext'
import { useInsurance } from './contexts/InsuranceContext'
import { isInNextNDaysISO, isOverdueISO } from './utils/insuranceDates'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function App() {
  const { policies } = useInsurance()
  const { isAuthenticated } = useAuth()
  const { pushToast } = useToasts()
  const location = useLocation()

  const { upcomingCount, overdueCount } = useMemo(() => {
    return {
      upcomingCount: policies.filter((p) => isInNextNDaysISO(p.dueDateISO, 30)).length,
      overdueCount: policies.filter((p) => isOverdueISO(p.dueDateISO)).length,
    }
  }, [policies])

  // Lightweight "notifications UI" using toasts (mock behavior).
  useEffect(() => {
    if (!isAuthenticated) return
    // Avoid spamming on initial load if user is navigating around.
    if (location.pathname !== '/' && location.pathname !== '/dashboard') return
    if (overdueCount > 0) {
      pushToast({
        kind: 'warning',
        title: `${overdueCount} overdue renewal${overdueCount === 1 ? '' : 's'}`,
        message: 'Open dashboard to review due policies.',
      })
    } else if (upcomingCount > 0) {
      pushToast({
        kind: 'info',
        title: `${upcomingCount} renewal${upcomingCount === 1 ? '' : 's'} due in 30 days`,
        message: 'Open dashboard to review upcoming renewals.',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/dashboard" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/companies"
          element={
            <RequireAuth>
              <CompaniesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/customers"
          element={
            <RequireAuth>
              <CustomersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/policies"
          element={
            <RequireAuth>
              <PoliciesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/leads"
          element={
            <RequireAuth>
              <LeadsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <ReportsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/about"
          element={
            <RequireAuth>
              <AboutPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Route>
    </Routes>
  )
}

export default App
