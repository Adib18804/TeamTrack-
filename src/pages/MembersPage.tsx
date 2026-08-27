import { useEffect, useMemo, useState } from 'react'
import {
  Users, Plus, Search, Shield, Crown, UserCheck, X, Mail,
  Copy, CheckCircle2, MoreHorizontal, CalendarDays, CheckSquare2,
  TrendingUp, UserPlus, ChevronRight, Link2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import {
  COLLECTIONS, addTeamMember, createTeamInvite, getCurrentTeamId, getUserRoleInTeam,
  listTeamMembers, onSnapshot, query, removeTeamMember
} from '@/lib/dataService'
import type { Task, TeamInvite, TeamRole, User } from '@/types'
import { cn, formatDate, getAvatarColor, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const inviteSchema = z.object({
  emails: z.string().min(5, 'Enter at least one email'),
  role: z.enum(['team_admin', 'team_member']).default('team_member'),
  message: z.string().optional().or(z.literal('')),
})

type InviteForm = z.infer<typeof inviteSchema>

export default function MembersPage() {
  const teamId = getCurrentTeamId()
  const { currentUser, refreshCurrentUser } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<User[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<'super_admin' | 'team_admin' | 'team_member' | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { role: 'team_member', emails: '', message: '' } })

  useEffect(() => {
    if (!teamId || !currentUser) return
    let alive = true
    Promise.all([
      listTeamMembers(teamId),
      query<TeamInvite>(COLLECTIONS.TEAM_INVITES, [{ field: 'teamId', op: '==', value: teamId }, { field: 'used', op: '==', value: false }]),
      query<Task>(COLLECTIONS.TASKS, [{ field: 'teamId', op: '==', value: teamId }]),
      getUserRoleInTeam(currentUser.userId, teamId),
    ]).then(([m, i, t, r]) => {
      if (!alive) return
      setMembers(m); setInvites(i); setTasks(t); setMyRole(r); setLoading(false)
    })
    const u1 = onSnapshot<User>(COLLECTIONS.USERS, async () => setMembers(await listTeamMembers(teamId)))
    const u2 = onSnapshot<TeamInvite>(COLLECTIONS.TEAM_INVITES, d => setInvites(d.filter(x => x.teamId === teamId && !x.used)))
    return () => { alive = false; u1(); u2() }
  }, [teamId, currentUser])

  const canManage = myRole === 'super_admin' || myRole === 'team_admin'

  // Helper: resolve a member's effective role in this team
  function roleOf(m: User): 'super_admin' | 'team_admin' | 'team_member' {
    if (m.globalRole === 'super_admin') return 'super_admin'
    return m.teamMemberships.find(tm => tm.teamId === teamId)?.role || 'team_member'
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter(m => {
      if (q && !m.fullName.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
      if (roleFilter !== 'all') {
        if (roleOf(m) !== roleFilter) return false
      }
      return true
    })
  }, [members, search, roleFilter, teamId])

  // Group filtered members
  const superAdmins = filtered.filter(m => roleOf(m) === 'super_admin')
  const leaders = filtered.filter(m => roleOf(m) === 'team_admin')
  const regularMembers = filtered.filter(m => roleOf(m) === 'team_member')

  const stats = useMemo(() => ({
    total: members.length,
    leaders: members.filter(m => roleOf(m) === 'super_admin' || roleOf(m) === 'team_admin').length,
    pending: invites.length,
  }), [members, invites, teamId])

  async function onInvite(data: InviteForm) {
    if (!teamId || !currentUser) return
    try {
      const emails = data.emails.split(/[\s,;]+/).map(e => e.trim()).filter(Boolean)
      let count = 0
      for (const email of emails) {
        const invite = await createTeamInvite(teamId, email, currentUser.userId)
        count++
        console.log('Invite link:', `${window.location.origin}/invite/${invite.token}`)
      }
      toast({ title: `Invites created (${count})`, description: 'Share the invite link with new members.', variant: 'success' })
      reset(); setInviteOpen(false)
    } catch (e: any) {
      toast({ title: 'Failed to create invites', description: e?.message || 'Try again.', variant: 'destructive' })
    }
  }

  async function handleRoleChange(user: User, role: TeamRole) {
    if (!teamId) return
    await addTeamMember(teamId, user.userId, role)
    await refreshCurrentUser()
    toast({ title: 'Role updated', description: `${user.fullName} is now ${role === 'team_admin' ? 'Team Leader' : 'Member'}.` })
  }

  async function handleRemove(user: User) {
    if (!teamId || !currentUser) return
    if (user.userId === currentUser.userId) {
      toast({ title: 'Cannot remove yourself', variant: 'destructive' })
      return
    }
    await removeTeamMember(teamId, user.userId)
    toast({ title: 'Member removed' })
  }

  function copyInvite(token: string) {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard?.writeText(url)
    setCopiedId(token)
    toast({ title: 'Invite link copied' })
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!teamId) return <EmptyHint />

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Team Members</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Manage roles, invite new contributors, see everyone's progress.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className="text-sm px-3 py-1">{stats.total} members · {stats.leaders} leaders · {stats.pending} invites</Badge>
            <Button className="h-11" onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" />Invite members</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <StatCard icon={<Users className="h-6 w-6" />} label="Total members" value={stats.total.toString()} sub="Active workspace users" bg="bg-blue-500/15" color="text-blue-600 dark:text-blue-400" />
            <StatCard icon={<Crown className="h-6 w-6" />} label="Leaders" value={stats.leaders.toString()} sub="Can manage team settings" bg="bg-violet-500/15" color="text-violet-600 dark:text-violet-400" />
            <StatCard icon={<Mail className="h-6 w-6" />} label="Pending invites" value={stats.pending.toString()} sub="Not yet accepted" bg="bg-amber-500/15" color="text-amber-600 dark:text-amber-400" />
          </div>

          {invites.length > 0 && canManage && (
            <Card className="border-2 bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Pending invitations</CardTitle>
                  <Badge variant="warning" className="text-sm px-3 py-1">{invites.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {invites.map(inv => (
                  <div key={inv.inviteId} className="flex items-center gap-4 p-4 rounded-xl bg-background border-2 border-border">
                    <div className="h-11 w-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0"><Mail className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg truncate">{inv.email}</div>
                      <div className="text-sm text-muted-foreground">Invited {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => copyInvite(inv.token)}>
                      {copiedId === inv.token ? <><CheckCircle2 className="h-4 w-4 mr-1" />Copied</> : <><Link2 className="h-4 w-4 mr-1" />Copy link</>}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Search & Filter */}
          <Card className="border-2">
            <CardContent className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input className="h-11 pl-11" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-11 w-[180px]"><Shield className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="team_admin">Team Leader</SelectItem>
                  <SelectItem value="team_member">Member</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <Card className="border-2"><CardContent className="p-14 text-center"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-lg text-muted-foreground">No members match.</p></CardContent></Card>
          ) : (
            <div className="space-y-8">
              {/* Super Admins */}
              {superAdmins.length > 0 && (
                <MemberSection
                  title="Super Admins"
                  icon={<Crown className="h-5 w-5" />}
                  color="text-violet-600 dark:text-violet-400"
                  count={superAdmins.length}
                >
                  {superAdmins.map(m => (
                    <MemberCard
                      key={m.userId}
                      member={m}
                      role="super_admin"
                      teamId={teamId!}
                      tasks={tasks}
                      canManage={false}
                      isSelf={m.userId === currentUser?.userId}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </MemberSection>
              )}

              {/* Team Leaders */}
              {leaders.length > 0 && (
                <MemberSection
                  title="Team Leaders"
                  icon={<Shield className="h-5 w-5" />}
                  color="text-blue-600 dark:text-blue-400"
                  count={leaders.length}
                >
                  {leaders.map(m => (
                    <MemberCard
                      key={m.userId}
                      member={m}
                      role="team_admin"
                      teamId={teamId!}
                      tasks={tasks}
                      canManage={canManage}
                      isSelf={m.userId === currentUser?.userId}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </MemberSection>
              )}

              {/* Members */}
              {regularMembers.length > 0 && (
                <MemberSection
                  title="Members"
                  icon={<Users className="h-5 w-5" />}
                  color="text-muted-foreground"
                  count={regularMembers.length}
                >
                  {regularMembers.map(m => (
                    <MemberCard
                      key={m.userId}
                      member={m}
                      role="team_member"
                      teamId={teamId!}
                      tasks={tasks}
                      canManage={canManage}
                      isSelf={m.userId === currentUser?.userId}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </MemberSection>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center"><UserPlus className="h-6 w-6" /></div>
              <div>
                <DialogTitle className="text-2xl md:text-3xl">Invite members</DialogTitle>
                <DialogDescription className="text-base md:text-lg mt-1">Invite people via email — they'll get a secure link to join.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit(onInvite)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-lg">Email addresses</Label>
              <Textarea rows={3} className="!text-lg resize-none" placeholder={`Separate with commas or new lines.\njane@company.com, john@company.com`} {...register('emails')} />
              {errors.emails && <p className="text-sm text-destructive">{errors.emails.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-lg">Role</Label>
              <Select defaultValue="team_member" onValueChange={v => register('role').onChange({ target: { value: v } })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">Member</SelectItem>
                  {canManage && <SelectItem value="team_admin">Team Leader</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-lg">Personal message (optional)</Label>
              <Textarea rows={3} className="!text-lg" placeholder="Hi! We'd love for you to join our team at…" {...register('message')} />
            </div>
            <DialogFooter className="gap-2.5">
              <Button type="button" variant="outline" className="h-11" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11"><Mail className="h-4 w-4 mr-1.5" />Send invites</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Member Section ────────────────────────────────────────────────────────────

function MemberSection({ title, icon, color, count, children }: {
  title: string; icon: React.ReactNode; color: string; count: number; children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className={cn('flex items-center gap-2.5 pb-1 border-b-2 border-border', color)}>
        {icon}
        <h2 className="text-lg font-bold">{title}</h2>
        <Badge variant="secondary" className="ml-auto text-xs">{count}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {children}
      </div>
    </div>
  )
}

// ─── Member Card ───────────────────────────────────────────────────────────────

interface MemberCardProps {
  member: User
  role: 'super_admin' | 'team_admin' | 'team_member'
  teamId: string
  tasks: Task[]
  canManage: boolean
  isSelf: boolean
  onRoleChange: (user: User, role: TeamRole) => void
  onRemove: (user: User) => void
}

function MemberCard({ member: m, role, teamId, tasks, canManage, isSelf, onRoleChange, onRemove }: MemberCardProps) {
  const membership = m.teamMemberships.find(tm => tm.teamId === teamId)
  const myTasks = tasks.filter(t => t.assignedUsers.includes(m.userId))
  const completed = myTasks.filter(t => t.status === 'completed').length
  const rate = myTasks.length ? Math.round((completed / myTasks.length) * 100) : 0
  const isSuper = role === 'super_admin'

  // How many OTHER teams is this member part of?
  const otherTeams = m.teamMemberships.filter(tm => tm.teamId !== teamId)

  return (
    <Card className={cn(
      'border-2 hover:shadow-md transition-all group relative overflow-hidden',
      role === 'team_admin' && 'border-blue-500/30 bg-blue-500/3',
      role === 'super_admin' && 'border-violet-500/30 bg-violet-500/3',
    )}>
      {/* Leader / Super accent stripe */}
      {(role === 'team_admin' || role === 'super_admin') && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1',
          role === 'super_admin' ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
        )} />
      )}
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <Avatar className={cn(
                'h-14 w-14 border-2',
                role === 'super_admin' ? 'border-violet-500/50' : role === 'team_admin' ? 'border-blue-500/50' : 'border-border'
              )}>
                <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white', fontSize: 18 }}>{getInitials(m.fullName)}</AvatarFallback>
              </Avatar>
              {/* Role icon overlay */}
              {role === 'super_admin' && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-violet-500 border-2 border-background grid place-items-center">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
              {role === 'team_admin' && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 border-2 border-background grid place-items-center">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xl font-bold truncate">{m.fullName}</h4>
                {isSelf && <Badge variant="secondary" className="text-[10px] px-1.5">You</Badge>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {role === 'super_admin' && (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.5 gap-1">
                    <Crown className="h-2.5 w-2.5" />Super Admin
                  </Badge>
                )}
                {role === 'team_admin' && (
                  <Badge variant="info" className="text-[10px] px-2 py-0.5 gap-1">
                    <Shield className="h-2.5 w-2.5" />Team Leader
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground truncate mt-0.5">{m.email}</div>
            </div>
          </div>
          {canManage && !isSuper && !isSelf && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><MoreHorizontal className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!p-2 w-52">
                <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Change role</div>
                <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => onRoleChange(m, 'team_admin')} disabled={role === 'team_admin'}>
                  <Shield className="h-4 w-4 text-blue-500" />Make Team Leader
                </DropdownMenuItem>
                <DropdownMenuItem className="!rounded-lg gap-2" onClick={() => onRoleChange(m, 'team_member')} disabled={role === 'team_member'}>
                  <UserCheck className="h-4 w-4" />Make Member
                </DropdownMenuItem>
                <Separator className="my-1.5" />
                <DropdownMenuItem className="!rounded-lg !text-destructive gap-2" onClick={() => onRemove(m)}>
                  <X className="h-4 w-4" />Remove from team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t-2 border-border/60">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {membership ? formatDate(membership.joinedAt) : '—'}</span>
          {otherTeams.length > 0 && (
            <span className="ml-auto text-[11px] inline-flex items-center gap-1 text-muted-foreground">
              +{otherTeams.length} other team{otherTeams.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-muted/40 border-2 border-border/60">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium"><CheckSquare2 className="h-4 w-4" />Task completion</span>
            <span className="font-bold">{myTasks.length} tasks · {rate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${rate}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs pt-2">
            <Mini label="Assigned" value={myTasks.length.toString()} />
            <Mini label="Done" value={completed.toString()} />
            <Mini label="Rate" value={`${rate}%`} />
          </div>
        </div>

        <Button variant="outline" className="w-full h-10 group-hover:bg-accent transition-colors">
          View profile <ChevronRight className="h-4 w-4 ml-0.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

function StatCard({ icon, label, value, sub, bg, color }: any) {
  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('h-12 w-12 rounded-xl grid place-items-center shadow-sm', bg, color)}>{icon}</div>
          <TrendingUp className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-3xl md:text-4xl font-bold tracking-tight">{value}</div>
        <div className="mt-1"><div className="text-lg font-medium">{label}</div><div className="text-sm text-muted-foreground leading-relaxed">{sub}</div></div>
      </CardContent>
    </Card>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-background border border-border/60 text-center">
      <div className="font-bold text-base">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}

function EmptyHint() {
  return (
    <Card className="border-2"><CardContent className="p-16 text-center max-w-xl mx-auto">
      <Users className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
      <h2 className="text-3xl font-bold mb-2">No team selected</h2>
      <p className="text-muted-foreground text-lg leading-relaxed">Choose a team to view and manage members.</p>
    </CardContent></Card>
  )
}
