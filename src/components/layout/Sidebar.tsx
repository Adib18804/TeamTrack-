import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare2, GraduationCap, Library,
  Microscope, Trophy, BookOpen, MessageSquare, Calendar, Activity, BarChart3,
  Settings, ChevronDown, Plus, Sparkles, Users, LogOut, Shield
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials, getAvatarColor } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'
import { listTeamsForUser } from '@/lib/dataService'
import type { Team } from '@/types'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare2 },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/resources', label: 'Resources', icon: Library },
  { to: '/research', label: 'Research', icon: Microscope },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/chat', label: 'Team Chat', icon: MessageSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

interface Props {
  openCreateTeam?: () => void
}

export default function Sidebar({ openCreateTeam }: Props) {
  const { currentUser, currentTeamId, setCurrentTeamId, signOut, refreshCurrentUser } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    let alive = true
    listTeamsForUser(currentUser.userId).then(list => {
      if (alive) { setTeams(list); setLoadingTeams(false) }
    })
    return () => { alive = false }
  }, [currentUser, currentTeamId])

  const currentTeam = teams.find(t => t.teamId === currentTeamId)

  async function handleSignOut() {
    await signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <aside className="hidden md:flex w-64 lg:w-72 shrink-0 border-r-2 border-sidebar-border bg-sidebar flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-5 border-b-2 border-sidebar-border">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight leading-tight">TeamTrack</div>
            <div className="text-xs text-muted-foreground">Collaboration workspace</div>
          </div>
        </NavLink>
      </div>

      <div className="px-4 py-4 border-b border-sidebar-border">
        {loadingTeams ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-sidebar-border bg-background hover:bg-sidebar-accent transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg grid place-items-center font-bold text-sm shrink-0 text-white"
                    style={{ backgroundColor: currentTeam ? getAvatarColor(currentTeam.name) : '#64748b' }}>
                    {currentTeam ? getInitials(currentTeam.name) : '—'}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-semibold text-base truncate">{currentTeam?.name || 'Select team'}</div>
                    <div className="text-xs text-muted-foreground truncate">{currentTeam?.domain || 'Workspace'}</div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 !p-2">
              <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">Your teams</DropdownMenuLabel>
              {teams.map(t => (
                <DropdownMenuItem key={t.teamId} className={`!rounded-lg ${t.teamId === currentTeamId ? 'bg-accent' : ''}`} onClick={() => setCurrentTeamId(t.teamId)}>
                  <div className="h-8 w-8 rounded-md grid place-items-center text-xs font-bold text-white mr-3" style={{ backgroundColor: getAvatarColor(t.name) }}>
                    {getInitials(t.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.domain}</div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {currentUser?.globalRole === 'super_admin' && (
                <DropdownMenuItem className="!rounded-lg" onClick={openCreateTeam}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-medium">Create new team</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) => cn(
              'group flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        <div className="pt-5 mt-3 border-t border-sidebar-border space-y-1">
          {currentUser?.globalRole === 'super_admin' && (
            <NavLink to="/admin" className={({ isActive }) => cn(
              'flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-medium transition-all',
              isActive
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                : 'text-violet-600 dark:text-violet-400 hover:bg-violet-500/10'
            )}>
              <Shield className="h-5 w-5 shrink-0" />
              <span>Admin Panel</span>
            </NavLink>
          )}
          <NavLink to="/settings" className={({ isActive }) => cn(
            'flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-medium transition-all',
            isActive ? 'bg-accent text-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}>
            <Settings className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t-2 border-sidebar-border">
        {currentUser ? (
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full text-left">
                  <Avatar className="h-11 w-11 border-2 border-sidebar-border">
                    <AvatarFallback style={{ backgroundColor: getAvatarColor(currentUser.fullName), color: 'white' }}>
                      {getInitials(currentUser.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{currentUser.fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 !p-2">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="font-semibold text-base">{currentUser.fullName}</div>
                  <div className="text-xs text-muted-foreground">{currentUser.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="!rounded-lg" onClick={() => navigate('/settings/profile')}>
                  <Users className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="!rounded-lg" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="!rounded-lg !text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Skeleton className="h-14 w-full rounded-xl" />
        )}
      </div>
    </aside>
  )
}
