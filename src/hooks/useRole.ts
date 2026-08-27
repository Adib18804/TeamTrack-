import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Central hook for role-based permission checks.
 * All UI permission gates should use this instead of inline role comparisons.
 */
export function useRole(teamId?: string | null) {
  const { currentUser } = useAuth()

  return useMemo(() => {
    if (!currentUser) {
      return {
        isSuperAdmin: false,
        isTeamLeader: false,
        isTeamMember: false,
        canManageTeam: false,
        canManageMembers: false,
        canDeleteTeam: false,
        canCreateTeam: false,
        effectiveRole: null as 'super_admin' | 'team_admin' | 'team_member' | null,
      }
    }

    const isSuperAdmin = currentUser.globalRole === 'super_admin'

    // Resolve team-level role
    const membership = teamId
      ? currentUser.teamMemberships.find(m => m.teamId === teamId)
      : undefined

    const isTeamLeader =
      isSuperAdmin || membership?.role === 'team_admin'

    const isTeamMember =
      isSuperAdmin || !!membership

    const effectiveRole: 'super_admin' | 'team_admin' | 'team_member' | null = isSuperAdmin
      ? 'super_admin'
      : membership?.role ?? null

    return {
      /** True if user has the global super_admin role */
      isSuperAdmin,
      /** True if user is a team_admin in the given team, or is super_admin */
      isTeamLeader,
      /** True if user is any member of the given team, or is super_admin */
      isTeamMember,
      /** Can invite, remove members, and change roles */
      canManageMembers: isTeamLeader,
      /** Can edit team settings, create/archive resources */
      canManageTeam: isTeamLeader,
      /** Only super admins can delete an entire team */
      canDeleteTeam: isSuperAdmin,
      /** Super admins can create teams from anywhere */
      canCreateTeam: isSuperAdmin,
      /** The effective role string for display */
      effectiveRole,
    }
  }, [currentUser, teamId])
}
