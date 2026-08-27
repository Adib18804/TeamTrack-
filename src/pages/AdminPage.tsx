import { useEffect, useMemo, useState } from 'react'
import {
  Shield, Users, Building2, Search, Crown, Plus, Trash2, ArchiveX,
  MoreHorizontal, UserX, RefreshCw, AlertTriangle,
  Pencil, Activity, UserPlus, UserCheck, ChevronDown, X,
  Settings2, UsersRound
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllUsers, promoteToSuperAdmin, demoteFromSuperAdmin, deleteTeam, updateTeam,
  createTeam, addTeamMember, removeTeamMember, COLLECTIONS, onSnapshot, query
} from '@/lib/dataService'
import type { Team, User, TeamStatus, TeamRole } from '@/types'
import { cn, getAvatarColor, getInitials, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleBadge(u: User) {
  if (u.globalRole === 'super_admin')
    return <Badge variant="destructive" className="text-[10px] gap-1"><Crown className="h-3 w-3" />Super Admin</Badge>
  return <Badge variant="outline" className="text-[10px]">Member</Badge>
}

function teamRoleBadge(role: TeamRole | 'super_admin') {
  if (role === 'super_admin')
    return <Badge variant="destructive" className="text-[10px] gap-1"><Crown className="h-3 w-3" />Super Admin</Badge>
  if (role === 'team_admin')
    return <Badge variant="info" className="text-[10px] gap-1"><Shield className="h-3 w-3" />Team Leader</Badge>
  return <Badge variant="outline" className="text-[10px]">Member</Badge>
}

function statusBadge(s: TeamStatus) {
  const map: Record<TeamStatus, string> = {
    active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    archived: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    suspended: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', map[s])}>
      {s}
    </span>
  )
}

// ─── Create Team Dialog ───────────────────────────────────────────────────────

interface CreateTeamDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  currentUser: User
}

function CreateTeamDialog({ open, onClose, onCreated, currentUser }: CreateTeamDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await createTeam({ name: name.trim(), description: desc.trim(), domain: domain.trim() || 'General', createdBy: currentUser.userId })
      toast({ title: 'Team created', variant: 'success' })
      setName(''); setDesc(''); setDomain('')
      onCreated(); onClose()
    } catch (e: any) {
      toast({ title: 'Failed to create team', description: e?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center"><Building2 className="h-6 w-6" /></div>
            <div>
              <DialogTitle className="text-2xl">Create Team</DialogTitle>
              <DialogDescription className="text-base mt-0.5">Set up a new team workspace</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Team name *</Label>
            <Input className="h-11" placeholder="e.g. Cyber Research Lab" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Domain / Focus area</Label>
            <Input className="h-11" placeholder="e.g. Cybersecurity, AI, Web Dev" value={domain} onChange={e => setDomain(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} placeholder="What does this team work on?" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Team Dialog ─────────────────────────────────────────────────────────

interface EditTeamDialogProps {
  team: Team | null
  onClose: () => void
  onSaved: () => void
}

function EditTeamDialog({ team, onClose, onSaved }: EditTeamDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState(team?.name || '')
  const [desc, setDesc] = useState(team?.description || '')
  const [status, setStatus] = useState<TeamStatus>(team?.status || 'active')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (team) { setName(team.name); setDesc(team.description); setStatus(team.status) }
  }, [team])

  if (!team) return null

  async function handleSave() {
    setLoading(true)
    try {
      await updateTeam(team!.teamId, { name, description: desc, status })
      toast({ title: 'Team updated', variant: 'success' })
      onSaved(); onClose()
    } catch (e: any) {
      toast({ title: 'Failed to update team', description: e?.message, variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={!!team} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 grid place-items-center"><Pencil className="h-5 w-5" /></div>
            <div>
              <DialogTitle className="text-2xl">Edit Team</DialogTitle>
              <DialogDescription>Update team details and status</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Team name</Label>
            <Input className="h-11" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(['active', 'archived', 'suspended'] as TeamStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex-1 h-10 rounded-xl border-2 text-sm font-medium capitalize transition-all',
                    status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Manage Team Members Dialog ───────────────────────────────────────────────

interface ManageMembersDialogProps {
  team: Team | null
  allUsers: User[]
  onClose: () => void
  onChanged: () => void
}

function ManageMembersDialog({ team, allUsers, onClose, onChanged }: ManageMembersDialogProps) {
  const { toast } = useToast()
  const [addSearch, setAddSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  if (!team) return null

  // Current team members
  const members = allUsers.filter(u =>
    u.globalRole === 'super_admin' || u.teamMemberships.some(m => m.teamId === team.teamId)
  )

  // Non-members (can be added)
  const nonMembers = allUsers.filter(u =>
    u.globalRole !== 'super_admin' && !u.teamMemberships.some(m => m.teamId === team.teamId)
  ).filter(u => {
    const q = addSearch.trim().toLowerCase()
    return !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  function getRoleInTeam(u: User): 'super_admin' | 'team_admin' | 'team_member' {
    if (u.globalRole === 'super_admin') return 'super_admin'
    return u.teamMemberships.find(m => m.teamId === team!.teamId)?.role || 'team_member'
  }

  async function handlePromote(u: User) {
    setBusy(u.userId)
    try {
      await addTeamMember(team!.teamId, u.userId, 'team_admin')
      toast({ title: `${u.fullName} promoted to Team Leader`, variant: 'success' })
      onChanged()
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' })
    } finally { setBusy(null) }
  }

  async function handleDemote(u: User) {
    setBusy(u.userId)
    try {
      await addTeamMember(team!.teamId, u.userId, 'team_member')
      toast({ title: `${u.fullName} changed to Member` })
      onChanged()
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' })
    } finally { setBusy(null) }
  }

  async function handleRemove(u: User) {
    setBusy(u.userId)
    try {
      await removeTeamMember(team!.teamId, u.userId)
      toast({ title: `${u.fullName} removed from team` })
      onChanged()
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' })
    } finally { setBusy(null) }
  }

  async function handleAdd(u: User, role: TeamRole = 'team_member') {
    setBusy(u.userId)
    try {
      await addTeamMember(team!.teamId, u.userId, role)
      toast({ title: `${u.fullName} added to team`, variant: 'success' })
      setAddSearch('')
      onChanged()
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' })
    } finally { setBusy(null) }
  }

  const leaders = members.filter(u => getRoleInTeam(u) === 'team_admin')
  const regularMembers = members.filter(u => getRoleInTeam(u) === 'team_member')
  const superAdmins = members.filter(u => getRoleInTeam(u) === 'super_admin')

  return (
    <Dialog open={!!team} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center">
              <UsersRound className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Manage Members</DialogTitle>
              <DialogDescription className="text-base mt-0.5">
                <span className="font-semibold text-foreground">{team.name}</span> · {members.length} member{members.length !== 1 ? 's' : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-1">
          <div className="space-y-5 py-1">

            {/* Add Member */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <UserPlus className="h-4 w-4" />
                  Add member to team
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => setAddOpen(o => !o)}>
                  {addOpen ? 'Hide' : 'Search users'} <ChevronDown className={cn('h-3.5 w-3.5 ml-1 transition-transform', addOpen && 'rotate-180')} />
                </Button>
              </div>
              {addOpen && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="h-10 pl-9 text-sm"
                      placeholder="Search by name or email…"
                      value={addSearch}
                      onChange={e => setAddSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {nonMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-1 py-2">
                      {addSearch ? 'No users match your search.' : 'All platform users are already in this team.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-border rounded-xl border border-border bg-background max-h-52 overflow-y-auto">
                      {nonMembers.map(u => (
                        <div key={u.userId} className="flex items-center gap-3 px-3 py-2.5">
                          <Avatar className="h-8 w-8 border border-border shrink-0">
                            <AvatarFallback style={{ backgroundColor: getAvatarColor(u.fullName), color: 'white', fontSize: 11 }}>
                              {getInitials(u.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{u.fullName}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={busy === u.userId}
                              onClick={() => handleAdd(u, 'team_member')}
                            >
                              {busy === u.userId ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Add as Member'}
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs"
                              disabled={busy === u.userId}
                              onClick={() => handleAdd(u, 'team_admin')}
                            >
                              {busy === u.userId ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Add as Leader'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Super Admins */}
            {superAdmins.length > 0 && (
              <Section title="Super Admins" count={superAdmins.length} icon={<Crown className="h-4 w-4" />} color="text-violet-600 dark:text-violet-400">
                {superAdmins.map(u => (
                  <MemberRow
                    key={u.userId}
                    user={u}
                    role="super_admin"
                    teamId={team.teamId}
                    busy={busy}
                    onPromote={handlePromote}
                    onDemote={handleDemote}
                    onRemove={handleRemove}
                    locked // Super admins cannot be managed from here
                  />
                ))}
              </Section>
            )}

            {/* Team Leaders */}
            {leaders.length > 0 && (
              <Section title="Team Leaders" count={leaders.length} icon={<Shield className="h-4 w-4" />} color="text-blue-600 dark:text-blue-400">
                {leaders.map(u => (
                  <MemberRow
                    key={u.userId}
                    user={u}
                    role="team_admin"
                    teamId={team.teamId}
                    busy={busy}
                    onPromote={handlePromote}
                    onDemote={handleDemote}
                    onRemove={handleRemove}
                  />
                ))}
              </Section>
            )}

            {/* Members */}
            {regularMembers.length > 0 && (
              <Section title="Members" count={regularMembers.length} icon={<Users className="h-4 w-4" />} color="text-muted-foreground">
                {regularMembers.map(u => (
                  <MemberRow
                    key={u.userId}
                    user={u}
                    role="team_member"
                    teamId={team.teamId}
                    busy={busy}
                    onPromote={handlePromote}
                    onDemote={handleDemote}
                    onRemove={handleRemove}
                  />
                ))}
              </Section>
            )}

            {members.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No members yet. Add someone above.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 pt-2">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, count, icon, color, children }: { title: string; count: number; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className={cn('flex items-center gap-2 text-sm font-bold uppercase tracking-wider', color)}>
        {icon}
        {title}
        <span className="ml-auto text-xs font-normal normal-case tracking-normal text-muted-foreground">{count}</span>
      </div>
      <div className="divide-y divide-border rounded-xl border-2 border-border overflow-hidden">
        {children}
      </div>
    </div>
  )
}

interface MemberRowProps {
  user: User
  role: 'super_admin' | 'team_admin' | 'team_member'
  teamId: string
  busy: string | null
  onPromote: (u: User) => void
  onDemote: (u: User) => void
  onRemove: (u: User) => void
  locked?: boolean
}

function MemberRow({ user, role, teamId, busy, onPromote, onDemote, onRemove, locked }: MemberRowProps) {
  const membership = user.teamMemberships.find(m => m.teamId === teamId)
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/40 transition-colors">
      <Avatar className="h-9 w-9 border border-border shrink-0">
        <AvatarFallback style={{ backgroundColor: getAvatarColor(user.fullName), color: 'white', fontSize: 12 }}>
          {getInitials(user.fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">{user.fullName}</span>
          {teamRoleBadge(role)}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {user.email} {membership && `· Joined ${formatDate(membership.joinedAt)}`}
        </div>
      </div>
      {!locked && (
        busy === user.userId ? (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!p-2 w-52">
              <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Role</div>
              {role !== 'team_admin' && (
                <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => onPromote(user)}>
                  <Crown className="h-4 w-4 text-blue-500" />Promote to Team Leader
                </DropdownMenuItem>
              )}
              {role === 'team_admin' && (
                <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => onDemote(user)}>
                  <UserCheck className="h-4 w-4 text-amber-500" />Demote to Member
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="!rounded-lg gap-2 !text-destructive" onClick={() => onRemove(user)}>
                <X className="h-4 w-4" />Remove from team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { currentUser, refreshCurrentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [manageTeam, setManageTeam] = useState<Team | null>(null)
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<Team | null>(null)
  const [demoteTarget, setDemoteTarget] = useState<User | null>(null)

  async function load() {
    const [u, t] = await Promise.all([getAllUsers(), query<Team>(COLLECTIONS.TEAMS)])
    setUsers(u); setTeams(t); setLoading(false)
  }

  useEffect(() => {
    load()
    const u1 = onSnapshot<User>(COLLECTIONS.USERS, async () => setUsers(await getAllUsers()))
    const u2 = onSnapshot<Team>(COLLECTIONS.TEAMS, async (data) => setTeams(data))
    return () => { u1(); u2() }
  }, [])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalUsers: users.length,
    superAdmins: users.filter(u => u.globalRole === 'super_admin').length,
    totalTeams: teams.length,
    activeTeams: teams.filter(t => t.status === 'active').length,
  }), [users, teams])

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users.filter(u => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, userSearch])

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase()
    return teams.filter(t => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
  }, [teams, teamSearch])

  // ── User actions ───────────────────────────────────────────────────────────
  async function handlePromote(user: User) {
    await promoteToSuperAdmin(user.userId)
    if (currentUser?.userId === user.userId) await refreshCurrentUser()
    toast({ title: `${user.fullName} is now Super Admin`, variant: 'success' })
  }

  async function handleDemote(user: User) {
    if (user.userId === currentUser?.userId) {
      toast({ title: 'Cannot demote yourself', variant: 'destructive' }); return
    }
    await demoteFromSuperAdmin(user.userId)
    toast({ title: `${user.fullName} demoted to Member` })
    setDemoteTarget(null)
  }

  // ── Team actions ───────────────────────────────────────────────────────────
  async function handleDeleteTeam(team: Team) {
    await deleteTeam(team.teamId)
    toast({ title: `Team "${team.name}" deleted`, variant: 'success' })
    setDeleteTeamTarget(null)
  }

  async function handleArchiveTeam(team: Team) {
    const newStatus: TeamStatus = team.status === 'archived' ? 'active' : 'archived'
    await updateTeam(team.teamId, { status: newStatus })
    toast({ title: `Team ${newStatus === 'archived' ? 'archived' : 'restored'}` })
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center shadow-lg">
            <Shield className="h-9 w-9" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/70 uppercase tracking-wider mb-0.5">Global Administration</div>
            <h1 className="text-3xl md:text-4xl font-bold">Super Admin Panel</h1>
            <p className="text-white/80 text-base mt-1">Full CRUD control over all users, teams, and platform settings.</p>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 right-24 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-6 w-6" />} label="Total Users" value={stats.totalUsers} color="text-blue-600 dark:text-blue-400" bg="bg-blue-500/15" />
        <StatCard icon={<Crown className="h-6 w-6" />} label="Super Admins" value={stats.superAdmins} color="text-violet-600 dark:text-violet-400" bg="bg-violet-500/15" />
        <StatCard icon={<Building2 className="h-6 w-6" />} label="Total Teams" value={stats.totalTeams} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/15" />
        <StatCard icon={<Activity className="h-6 w-6" />} label="Active Teams" value={stats.activeTeams} color="text-amber-600 dark:text-amber-400" bg="bg-amber-500/15" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="teams">
        <TabsList className="h-12 p-1 gap-1">
          <TabsTrigger value="teams" className="h-10 px-5 text-base gap-2">
            <Building2 className="h-4 w-4" />Teams
            <Badge variant="secondary" className="ml-1 text-xs">{stats.totalTeams}</Badge>
          </TabsTrigger>
          <TabsTrigger value="users" className="h-10 px-5 text-base gap-2">
            <Users className="h-4 w-4" />Users
            <Badge variant="secondary" className="ml-1 text-xs">{stats.totalUsers}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── TEAMS TAB ── */}
        <TabsContent value="teams" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input className="h-11 pl-11" placeholder="Search teams…" value={teamSearch} onChange={e => setTeamSearch(e.target.value)} />
            </div>
            <Button className="h-11 shrink-0" onClick={() => setCreateTeamOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Team
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeams.length === 0 ? (
                <div className="col-span-full">
                  <Card className="border-2"><div className="p-12 text-center text-muted-foreground">No teams found.</div></Card>
                </div>
              ) : filteredTeams.map(team => {
                const teamMembers = users.filter(u =>
                  u.globalRole === 'super_admin' || u.teamMemberships.some(m => m.teamId === team.teamId)
                )
                const leaders = teamMembers.filter(u =>
                  u.teamMemberships.some(m => m.teamId === team.teamId && m.role === 'team_admin')
                )
                const memberCount = teamMembers.length

                return (
                  <Card key={team.teamId} className="border-2 hover:shadow-md transition-all group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 grid place-items-center shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-lg truncate">{team.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{team.domain}</div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><MoreHorizontal className="h-5 w-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="!p-2 w-52">
                            <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => setManageTeam(team)}>
                              <UsersRound className="h-4 w-4 text-emerald-500" />Manage members
                            </DropdownMenuItem>
                            <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => setEditTeam(team)}>
                              <Settings2 className="h-4 w-4" />Edit team
                            </DropdownMenuItem>
                            <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => handleArchiveTeam(team)}>
                              <ArchiveX className="h-4 w-4" />{team.status === 'archived' ? 'Restore' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="!rounded-lg gap-2 !text-destructive" onClick={() => setDeleteTeamTarget(team)}>
                              <Trash2 className="h-4 w-4" />Delete team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(team.status)}
                        <Badge variant="outline" className="text-xs gap-1"><Users className="h-3 w-3" />{memberCount} member{memberCount !== 1 ? 's' : ''}</Badge>
                        {leaders.length > 0 && (
                          <Badge variant="info" className="text-xs gap-1"><Shield className="h-3 w-3" />{leaders.length} leader{leaders.length !== 1 ? 's' : ''}</Badge>
                        )}
                      </div>

                      {/* Team Leaders preview */}
                      {leaders.length > 0 && (
                        <div className="space-y-1.5">
                          {leaders.slice(0, 2).map(leader => (
                            <div key={leader.userId} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                              <Avatar className="h-7 w-7 border border-border shrink-0">
                                <AvatarFallback style={{ backgroundColor: getAvatarColor(leader.fullName), color: 'white', fontSize: 10 }}>
                                  {getInitials(leader.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium truncate">{leader.fullName}</div>
                                <div className="text-[10px] text-muted-foreground">Team Leader</div>
                              </div>
                              <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            </div>
                          ))}
                          {leaders.length > 2 && (
                            <div className="text-xs text-muted-foreground px-1">+{leaders.length - 2} more leader{leaders.length - 2 !== 1 ? 's' : ''}</div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <div className="text-xs text-muted-foreground">Created {formatDate(team.createdAt)}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setManageTeam(team)}
                        >
                          <UsersRound className="h-3.5 w-3.5" />Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── USERS TAB ── */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input className="h-11 pl-11" placeholder="Search users by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : (
            <Card className="border-2">
              <CardContent className="p-0">
                {filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No users found.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredUsers.map((user, idx) => {
                      const isSelf = user.userId === currentUser?.userId
                      const isAdmin = user.globalRole === 'super_admin'
                      const userTeams = teams.filter(t =>
                        user.teamMemberships.some(m => m.teamId === t.teamId)
                      )
                      return (
                        <div key={user.userId} className={cn('flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors', idx === 0 && 'rounded-t-2xl', idx === filteredUsers.length - 1 && 'rounded-b-2xl')}>
                          <Avatar className="h-12 w-12 border-2 border-border shrink-0">
                            <AvatarFallback style={{ backgroundColor: getAvatarColor(user.fullName), color: 'white', fontSize: 15 }}>
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-base">{user.fullName}</span>
                              {roleBadge(user)}
                              {isSelf && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                            {/* Team memberships with roles */}
                            {userTeams.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                {userTeams.slice(0, 3).map(t => {
                                  const mem = user.teamMemberships.find(m => m.teamId === t.teamId)
                                  return (
                                    <span key={t.teamId} className={cn(
                                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border',
                                      mem?.role === 'team_admin'
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                                        : 'bg-muted border-border text-muted-foreground'
                                    )}>
                                      {mem?.role === 'team_admin' && <Shield className="h-2.5 w-2.5" />}
                                      {t.name}
                                    </span>
                                  )
                                })}
                                {userTeams.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{userTeams.length - 3} more</span>
                                )}
                              </div>
                            )}
                            {userTeams.length === 0 && !isAdmin && (
                              <div className="text-xs text-muted-foreground mt-0.5 italic">Not in any team</div>
                            )}
                            {isAdmin && (
                              <div className="text-xs text-muted-foreground mt-0.5">Access to all {teams.length} teams</div>
                            )}
                          </div>
                          {!isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><MoreHorizontal className="h-5 w-5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="!p-2 w-56">
                                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Global Role</div>
                                {!isAdmin ? (
                                  <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => handlePromote(user)}>
                                    <Crown className="h-4 w-4 text-violet-500" />Promote to Super Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => setDemoteTarget(user)}>
                                    <UserX className="h-4 w-4 text-amber-500" />Demote to Member
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Teams</div>
                                {userTeams.length > 0 ? userTeams.map(t => (
                                  <DropdownMenuItem key={t.teamId} className="!rounded-lg gap-2" onClick={() => setManageTeam(t)}>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />{t.name}
                                  </DropdownMenuItem>
                                )) : (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground italic">No team memberships</div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      {currentUser && (
        <CreateTeamDialog
          open={createTeamOpen}
          onClose={() => setCreateTeamOpen(false)}
          onCreated={load}
          currentUser={currentUser}
        />
      )}

      <EditTeamDialog
        team={editTeam}
        onClose={() => setEditTeam(null)}
        onSaved={load}
      />

      <ManageMembersDialog
        team={manageTeam}
        allUsers={users}
        onClose={() => setManageTeam(null)}
        onChanged={load}
      />

      {/* Demote confirmation */}
      <AlertDialog open={!!demoteTarget} onOpenChange={v => { if (!v) setDemoteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />Demote Super Admin?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{demoteTarget?.fullName}</strong> will lose all Super Admin privileges and revert to a regular Member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => demoteTarget && handleDemote(demoteTarget)} className="bg-amber-500 hover:bg-amber-600">
              Demote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete team confirmation */}
      <AlertDialog open={!!deleteTeamTarget} onOpenChange={v => { if (!v) setDeleteTeamTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />Delete Team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTeamTarget?.name}</strong> and all its tasks, projects, messages, and resources. This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTeamTarget && handleDeleteTeam(deleteTeamTarget)} className="bg-destructive hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <Card className="border-2">
      <CardContent className="p-5">
        <div className={cn('h-11 w-11 rounded-xl grid place-items-center mb-3', bg, color)}>{icon}</div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}
