import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
}

/**
 * Route guard: only renders children for super_admin users.
 * All other users are redirected to /dashboard.
 */
export default function SuperAdminRoute({ children }: Props) {
  const { currentUser, loading } = useAuth()

  if (loading) return null

  if (!currentUser || currentUser.globalRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
