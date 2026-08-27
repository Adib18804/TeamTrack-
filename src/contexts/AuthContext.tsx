import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, isDemoMode } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import type { User, GlobalRole, TeamRole } from '@/types'
import {
  getUser, createUser as dsCreateUser, getCurrentUserId, setCurrentUser as dsSetCurrentUser,
  getCurrentTeamId, setCurrentTeam as dsSetCurrentTeam, listTeamsForUser,
  hasSuperAdmin, promoteToSuperAdmin,
} from '@/lib/dataService'
import { demoUsers, demoTeams, demoUserId1, demoPasswords } from '@/lib/demoData'

interface AuthContextType {
  currentUser: User | null
  currentTeamId: string | null
  loading: boolean
  signUp: (fullName: string, email: string, password: string) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setCurrentTeamId: (teamId: string | null) => void
  refreshCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function deriveGlobalRole(existing: GlobalRole | undefined): GlobalRole {
  return existing || 'team_member'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentTeamId, setCurrentTeamIdState] = useState<string | null>(() => getCurrentTeamId())
  const [loading, setLoading] = useState(true)

  const pickDefaultTeam = useCallback(async (user: User) => {
    const teams = await listTeamsForUser(user.userId)
    let teamId: string | null = null
    if (teams.length > 0) {
      teamId = teams[0].teamId
    }
    dsSetCurrentTeam(teamId)
    setCurrentTeamIdState(teamId)
  }, [])

  const hydrateFromService = useCallback(async (uid: string | null) => {
    if (!uid) {
      setCurrentUser(null)
      setCurrentTeamIdState(null)
      setLoading(false)
      return
    }
    try {
      const user = await getUser(uid)
      if (user) {
        setCurrentUser(user)
        if (!getCurrentTeamId() || !user.teamMemberships.some(m => m.teamId === getCurrentTeamId())) {
          await pickDefaultTeam(user)
        } else {
          setCurrentTeamIdState(getCurrentTeamId())
        }
      } else {
        setCurrentUser(null)
      }
    } catch {
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }, [pickDefaultTeam])

  useEffect(() => {
    if (isDemoMode) {
      const uid = getCurrentUserId() || demoUserId1
      dsSetCurrentUser(uid)
      hydrateFromService(uid)
      return
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        dsSetCurrentUser(fbUser.uid)
        await hydrateFromService(fbUser.uid)
      } else {
        dsSetCurrentUser(null)
        hydrateFromService(null)
      }
    })
    return unsub
  }, [hydrateFromService])

  const finishLogin = useCallback(async (uid: string) => {
    setLoading(true)
    dsSetCurrentUser(uid)
    const user = await getUser(uid)
    if (user) {
      setCurrentUser(user)
      await pickDefaultTeam(user)
    }
    setLoading(false)
    return user!
  }, [pickDefaultTeam])

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<User> => {
    setLoading(true)
    try {
      let uid: string
      if (isDemoMode) {
        uid = 'u_' + email.replace(/[^a-z0-9]/gi, '_')
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        uid = cred.user.uid
        try { await sendEmailVerification(cred.user) } catch {}
      }
      const existing = await getUser(uid)
      if (existing) { setLoading(false); return existing }
      // If no super admin exists yet, the first user to register becomes one
      const noAdminYet = !(await hasSuperAdmin())
      const user = await dsCreateUser({
        userId: uid, fullName, email, avatar: '',
        globalRole: noAdminYet ? 'super_admin' : 'team_member',
      })
      setCurrentUser(user)
      await pickDefaultTeam(user)
      setLoading(false)
      return user
    } catch (err) {
      setLoading(false)
      throw err
    }
  }, [pickDefaultTeam])

  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true)
    try {
      let uid: string
      if (isDemoMode) {
        const matched = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
        if (!matched) throw new Error('Invalid credentials')
        const expectedPassword = demoPasswords[matched.userId]
        if (expectedPassword ? password !== expectedPassword : password.length < 6) throw new Error('Invalid credentials')
        uid = matched.userId
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        uid = cred.user.uid
      }
      return await finishLogin(uid)
    } catch (err) {
      setLoading(false)
      throw err
    }
  }, [finishLogin])

  const signInWithGoogle = useCallback(async (): Promise<User> => {
    setLoading(true)
    try {
      let uid: string
      let displayName: string | null = null
      let emailValue: string | null = null
      if (isDemoMode) {
        uid = demoUserId1
        const u = demoUsers[0]
        displayName = u.fullName
        emailValue = u.email
      } else {
        const provider = new GoogleAuthProvider()
        const cred = await signInWithPopup(auth, provider)
        uid = cred.user.uid
        displayName = cred.user.displayName
        emailValue = cred.user.email
      }
      const existing = await getUser(uid)
      if (existing) return await finishLogin(uid)
      await dsCreateUser({
        userId: uid,
        fullName: displayName || 'Google User',
        email: emailValue || `google_${uid}@teamtrack.dev`,
        avatar: '',
      })
      return await finishLogin(uid)
    } catch (err) {
      setLoading(false)
      throw err
    }
  }, [finishLogin])

  const signOut = useCallback(async () => {
    setLoading(true)
    if (!isDemoMode) {
      try { await fbSignOut(auth) } catch {}
    }
    dsSetCurrentUser(null)
    dsSetCurrentTeam(null)
    setCurrentUser(null)
    setCurrentTeamIdState(null)
    setLoading(false)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 500))
      return
    }
    await sendPasswordResetEmail(auth, email)
  }, [])

  const setCurrentTeamId = useCallback((teamId: string | null) => {
    dsSetCurrentTeam(teamId)
    setCurrentTeamIdState(teamId)
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser) return
    const updated = await getUser(currentUser.userId)
    if (updated) setCurrentUser(updated)
  }, [currentUser])

  return (
    <AuthContext.Provider value={{
      currentUser, currentTeamId, loading,
      signUp, signIn, signInWithGoogle, signOut, resetPassword,
      setCurrentTeamId, refreshCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
