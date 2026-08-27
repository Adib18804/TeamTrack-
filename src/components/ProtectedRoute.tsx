import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  requireVerified?: boolean
}

export default function ProtectedRoute({ children, requireVerified = false }: Props) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-lg text-muted-foreground">Loading TeamTrack…</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  if (requireVerified && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  return <>{children}</>
}
