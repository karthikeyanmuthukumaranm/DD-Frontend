import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useToasts } from '../contexts/ToastContext'
import { BrandLogo } from '../components/BrandLogo'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { pushToast } = useToasts()
  const location = useLocation()

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from || '/dashboard'
  }, [location.state])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={from} replace />

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <BrandLogo className="h-14 w-auto max-w-[min(100%,280px)] object-contain" />
          <p className="mt-3 text-center text-sm font-semibold text-[color:var(--fg)]">Insurance Manager</p>
        </div>
        <Card className="border-0 shadow-xl shadow-slate-900/5">
          <CardHeader title="Login" subtitle="Admin access (single user)" />
          <CardBody className="space-y-4">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button
              className="w-full"
              disabled={isSubmitting}
              onClick={() => {
                setIsSubmitting(true)
                try {
                  const res = login(username, password)
                  if (!res.ok) {
                    pushToast({ kind: 'error', title: 'Login failed', message: res.message })
                    return
                  }
                  pushToast({ kind: 'success', title: 'Welcome', message: 'Login successful.' })
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              Sign in
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

