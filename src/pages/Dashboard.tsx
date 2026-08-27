import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  CheckSquare2, FolderKanban, Users, Clock, TrendingUp, AlertTriangle,
  ArrowRight, CalendarDays, MessageSquare, BookOpen, Trophy, Microscope, Library,
  Sparkles, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  query, COLLECTIONS, listTeamMembers, getCurrentTeamId, onSnapshot
} from '@/lib/dataService'
import type { Task, Project, DailyLog, User, ChatMessage, Team } from '@/types'
import {
  cn, formatRelativeTime, formatStatusLabel, getStatusColor, getPriorityColor,
  getInitials, getAvatarColor
} from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import CreateTeamDialog from '@/components/dialogs/CreateTeamDialog'

export default function Dashboard() {
  const { currentUser, currentTeamId } = useAuth()
  const teamId = currentTeamId
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId || !currentUser) return
    let alive = true
    Promise.all([
      query<Task>(COLLECTIONS.TASKS, [{ field: 'teamId', op: '==', value: teamId }], { field: 'updatedAt', direction: 'desc' }, 10),
      query<Project>(COLLECTIONS.PROJECTS, [{ field: 'teamId', op: '==', value: teamId }]),
      query<DailyLog>(COLLECTIONS.DAILY_LOGS, [{ field: 'teamId', op: '==', value: teamId }], { field: 'createdAt', direction: 'desc' }, 5),
      listTeamMembers(teamId),
      query<ChatMessage>(COLLECTIONS.MESSAGES, [{ field: 'teamId', op: '==', value: teamId }], { field: 'createdAt', direction: 'desc' }, 6),
    ]).then(([t, p, l, m, msg]) => {
      if (!alive) return
      setTasks(t); setProjects(p); setLogs(l); setMembers(m); setMessages(msg); setLoading(false)
    })
    const unsubs = [
      onSnapshot<Task>(COLLECTIONS.TASKS, d => setTasks(d.filter(x => x.teamId === teamId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10))),
      onSnapshot<Project>(COLLECTIONS.PROJECTS, d => setProjects(d.filter(x => x.teamId === teamId))),
      onSnapshot<DailyLog>(COLLECTIONS.DAILY_LOGS, d => setLogs(d.filter(x => x.teamId === teamId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5))),
      onSnapshot<ChatMessage>(COLLECTIONS.MESSAGES, d => setMessages(d.filter(x => x.teamId === teamId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6))),
    ]
    return () => { alive = false; unsubs.forEach(u => u()) }
  }, [teamId, currentUser])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const myTasks = tasks.filter(t => currentUser && t.assignedUsers.includes(currentUser.userId))
    const completed = myTasks.filter(t => t.status === 'completed').length
    const dueSoon = tasks.filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < new Date(Date.now() + 86400000 * 3)).length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const todayLogs = logs.filter(l => l.date === today).length
    return {
      totalTasks: tasks.length,
      myTasks: myTasks.length,
      myCompleted: completed,
      myCompletionRate: myTasks.length ? Math.round((completed / myTasks.length) * 100) : 0,
      dueSoon,
      activeProjects,
      teamMembers: members.length,
      hoursLogged: logs.reduce((s, l) => s + (l.actualHours || 0), 0),
      todayLogs,
    }
  }, [tasks, projects, logs, members, currentUser])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    const name = currentUser?.fullName?.split(' ')[0] || 'there'
    if (h < 5) return `Up late, ${name}?`
    if (h < 12) return `Good morning, ${name} ☀️`
    if (h < 17) return `Good afternoon, ${name} ✨`
    return `Good evening, ${name} 🌙`
  }, [currentUser])

  if (!teamId) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-8 py-20">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/15 text-primary grid place-items-center">
          <Sparkles className="h-8 w-8" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Pick or create a team</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            TeamTrack data lives inside each team. Select one from the sidebar or create a new workspace to continue.
          </p>
        </div>
        {currentUser?.globalRole === 'super_admin' && (
          <div className="card-premium max-w-md mx-auto !rounded-xl text-left space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Create your first team</h3>
              <p className="text-muted-foreground mt-1">Set up a workspace and start inviting team members.</p>
            </div>
            <Button className="w-full h-12 !text-lg" onClick={() => setCreateOpen(true)}>
              Create team <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}
        <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    )
  }

  const statCards = [
    { label: 'My tasks', value: stats.myTasks, sub: `${stats.myCompletionRate}% complete`, icon: CheckSquare2, accent: 'from-blue-500/20 to-blue-500/5', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Due soon', value: stats.dueSoon, sub: 'Next 3 days', icon: AlertTriangle, accent: 'from-amber-500/20 to-amber-500/5', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Active projects', value: stats.activeProjects, sub: `${projects.length} total`, icon: FolderKanban, accent: 'from-violet-500/20 to-violet-500/5', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Team members', value: stats.teamMembers, sub: `${stats.todayLogs} posted today`, icon: Users, accent: 'from-emerald-500/20 to-emerald-500/5', color: 'text-emerald-600 dark:text-emerald-400' },
  ]

  const quickLinks = [
    { to: '/tasks', label: 'View my tasks', icon: CheckSquare2 },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/chat', label: 'Team chat', icon: MessageSquare },
    { to: '/learning', label: 'Learning', icon: BookOpen },
    { to: '/resources', label: 'Resources', icon: Library },
    { to: '/research', label: 'Research', icon: Microscope },
    { to: '/contests', label: 'Contests', icon: Trophy },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {loading ? 'Loading your workspace…' : `You have ${stats.myTasks - stats.myCompleted} tasks in progress. ${stats.dueSoon} ${stats.dueSoon === 1 ? 'is' : 'are'} due soon.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-11" asChild><Link to="/daily-logs"><Clock className="h-4 w-4 mr-1.5" /> Submit daily log</Link></Button>
          <Button className="h-11" asChild><Link to="/tasks?new=1"><CheckSquare2 className="h-4 w-4 mr-1.5" /> New task</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : statCards.map(s => (
          <Card key={s.label} className={cn('relative overflow-hidden border-2')}>
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', s.accent)} />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('h-11 w-11 rounded-xl bg-background/80 grid place-items-center shadow-sm', s.color)}>
                  <s.icon className="h-5.5 w-5.5" style={{ width: 22, height: 22 }} />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1">
                <div className="text-lg font-medium">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <Card className="md:col-span-2 border-2">
          <CardHeader className="pb-4 flex-row items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Recent tasks</CardTitle>
              <CardDescription className="text-base mt-1">Across all active projects in your team.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-9" asChild><Link to="/tasks">View all <ChevronRight className="h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : tasks.length === 0 ? (
              <EmptyState title="No tasks yet" hint="Create your first task to get moving." cta="New task" href="/tasks?new=1" icon={CheckSquare2} />
            ) : tasks.slice(0, 5).map(t => {
              const assignees = members.filter(m => t.assignedUsers.includes(m.userId))
              return (
                <Link key={t.taskId} to={`/tasks/${t.taskId}`} className="flex items-start gap-4 p-4 rounded-xl border-2 border-transparent hover:border-border hover:bg-muted/40 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <div className="font-semibold text-lg truncate">{t.title}</div>
                      <Badge variant="outline" className={cn('text-xs px-2 py-0.5 border-0', getStatusColor(t.status))}>{formatStatusLabel(t.status)}</Badge>
                      {t.priority !== 'low' && <Badge variant="outline" className={cn('text-xs px-2 py-0.5 border-0', getPriorityColor(t.priority))}>{t.priority}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">{t.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {assignees.length > 0 && (
                      <div className="flex -space-x-2">
                        {assignees.slice(0, 3).map(a => (
                          <Avatar key={a.userId} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback style={{ backgroundColor: getAvatarColor(a.fullName), color: 'white', fontSize: 11 }}>
                              {getInitials(a.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                    <div className="h-2.5 w-20 rounded-full bg-muted overflow-hidden shrink-0">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${t.progressPercentage}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle>Team members</CardTitle>
            <CardDescription className="text-base mt-1">Active contributors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            ) : members.slice(0, 6).map(m => {
              const mem = m.teamMemberships.find(x => x.teamId === teamId)
              const userTasks = tasks.filter(t => t.assignedUsers.includes(m.userId))
              const done = userTasks.filter(t => t.status === 'completed').length
              const rate = userTasks.length ? Math.round((done / userTasks.length) * 100) : 0
              return (
                <div key={m.userId} className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white' }}>
                      {getInitials(m.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-base truncate">{m.fullName}</div>
                      {m.globalRole === 'super_admin' || mem?.role === 'team_admin' ? (
                        <Badge variant="warning" className="text-[10px] px-2 py-0">{m.globalRole === 'super_admin' ? 'Super Admin' : 'Admin'}</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {userTasks.length} tasks · {rate}% complete
                    </div>
                  </div>
                </div>
              )
            })}
            <Button variant="outline" className="w-full mt-2" asChild><Link to="/members">All members <ChevronRight className="h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <Card className="border-2">
          <CardHeader className="pb-4 flex-row items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Daily logs</CardTitle>
              <CardDescription className="text-base mt-1">Latest team progress updates.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-9" asChild><Link to="/daily-logs">All logs</Link></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : logs.length === 0 ? (
              <EmptyState title="No daily logs" hint="Encourage the team to post today's updates." cta="Submit log" href="/daily-logs" icon={Clock} />
            ) : logs.slice(0, 3).map(l => {
              const author = members.find(m => m.userId === l.userId)
              return (
                <div key={l.logId} className="p-4 rounded-xl bg-muted/30 border-2 border-transparent hover:border-border transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback style={{ backgroundColor: author ? getAvatarColor(author.fullName) : '#64748b', color: 'white', fontSize: 11 }}>
                        {author ? getInitials(author.fullName) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-base truncate">{author?.fullName || 'Unknown user'}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(l.createdAt)} · {l.actualHours}h worked</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2">{l.workSummary || 'No summary provided.'}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle>Active projects</CardTitle>
            <CardDescription className="text-base mt-1">Your team's current initiatives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : projects.length === 0 ? (
              <EmptyState title="No projects yet" hint="Organize work by creating a project." cta="New project" href="/projects?new=1" icon={FolderKanban} />
            ) : projects.slice(0, 4).map(p => (
              <Link key={p.projectId} to={`/projects/${p.projectId}`} className="block p-4 rounded-xl border-2 border-transparent hover:border-border hover:bg-muted/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg truncate">{p.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{p.description}</div>
                  </div>
                  <Badge className={cn('text-xs shrink-0', getStatusColor(p.status))}>{formatStatusLabel(p.status)}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent-foreground/60 dark:to-primary/60 rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="text-sm font-semibold shrink-0">{p.progress}%</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-4 flex-row items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Jump to</CardTitle>
              <CardDescription className="text-base mt-1">Quick access to your workspace.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map(l => (
                <Link key={l.to} to={l.to} className="p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/40 transition-all flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground grid place-items-center group-hover:scale-105 transition-transform shrink-0">
                    <l.icon className="h-5 w-5" />
                  </div>
                  <div className="font-medium text-base">{l.label}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-4 flex-row items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription className="text-base mt-1">Latest messages and discussions.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-9" asChild><Link to="/chat">Open chat <ChevronRight className="h-4 w-4" /></Link></Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : messages.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title="No messages yet" hint="Start a conversation in #general." cta="Open chat" href="/chat" icon={MessageSquare} />
              </div>
            ) : messages.slice(0, 6).map(m => {
              const author = members.find(x => x.userId === m.userId)
              return (
                <div key={m.messageId} className="p-4 rounded-xl bg-muted/30 border-2 border-transparent hover:border-border transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback style={{ backgroundColor: author ? getAvatarColor(author.fullName) : '#64748b', color: 'white', fontSize: 11 }}>
                        {author ? getInitials(author.fullName) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{author?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(m.createdAt)}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3">{m.content}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ title, hint, cta, href, icon: Icon }: { title: string; hint: string; cta: string; href: string; icon: any }) {
  return (
    <div className="p-10 text-center rounded-xl bg-muted/30">
      <div className="mx-auto h-12 w-12 rounded-xl bg-muted text-muted-foreground grid place-items-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-xl font-semibold">{title}</h4>
      <p className="text-muted-foreground mt-1 mb-4 leading-relaxed">{hint}</p>
      <Button variant="outline" className="h-11" asChild><Link to={href}>{cta}</Link></Button>
    </div>
  )
}
