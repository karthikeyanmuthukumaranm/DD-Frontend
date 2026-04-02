import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Toasts } from '../components/Toasts'

export function AppLayout() {
  const location = useLocation()

  return (
    <AppShell>
      <main className="min-w-0 max-w-full overflow-x-hidden px-4 py-8 md:px-8">
        <div key={location.pathname} className="ddms-animate-fade-up min-w-0 max-w-full">
          <Outlet />
        </div>
      </main>
      <Toasts />
    </AppShell>
  )
}


