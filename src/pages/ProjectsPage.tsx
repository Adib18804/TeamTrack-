import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FolderKanban, Plus, ChevronRight, Users, Target, CheckSquare2, MessageSquare,
  CalendarDays, MoreHorizontal, Filter, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { COLLECTIONS, listTeamMembers, onSnapshot, query } from '@/lib/dataService'
import type { Project, Task, User } from '@/types'
import { cn, formatDate, formatStatusLabel, getStatusColor, getInitials, getAvatarColor } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import CreateProjectDialog from '@/components/dialogs/CreateProjectDialog'

const PROJECT_STATUSES: Project['status'][] = ['planning', 'active', 'on_hold', 'completed', 'archived']

export default function ProjectsPage() {
  const { currentTeamId, currentUser } = useAuth()
  const { id } = useParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (!currentTeamId) return
    let alive = true
    Promise.all([
      query<Project>(COLLECTIONS.PROJECTS, [{ field: 'teamId', op: '==', value: currentTeamId }], { field: 'updatedAt', direction: 'desc' }),
      query<Task>(COLLECTIONS.TASKS, [{ field: 'teamId', op: '==', value: currentTeamId }]),
      listTeamMembers(currentTeamId),
    ]).then(([p, t, m]) => { if (alive) { setProjects(p); setTasks(t); setMembers(m); setLoading(false) } })
    const u1 = onSnapshot<Project>(COLLECTIONS.PROJECTS, d => setProjects(d.filter(x => x.teamId === currentTeamId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
    const u2 = onSnapshot<Task>(COLLECTIONS.TASKS, d => setTasks(d.filter(x => x.teamId === currentTeamId)))
    return () => { alive = false; u1(); u2() }
  }, [currentTeamId])

  const project = id ? projects.find(p => p.projectId === id) : undefined

  const filtered = useMemo(() => statusFilter === 'all' ? projects : projects.filter(p => p.status === statusFilter), [projects, statusFilter])
  const activeCount = projects.filter(p => p.status === 'active').length
  const totalTasks = tasks.length

  if (id && project) {
    return <ProjectDetail project={project} tasks={tasks.filter(t => t.projectId === id)} members={members} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Projects</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Organize work into projects with objectives, tasks, members, and discussion.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-sm px-3 py-1">{projects.length} total · {activeCount} active · {totalTasks} tasks</Badge>
          <Button className="h-11" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New project</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList className="h-11 p-1 flex-wrap">
            <TabsTrigger value="all" className="h-9">All ({projects.length})</TabsTrigger>
            {PROJECT_STATUSES.filter(s => projects.some(p => p.status === s)).map(s => (
              <TabsTrigger key={s} value={s} className="h-9 capitalize">{formatStatusLabel(s)} ({projects.filter(p => p.status === s).length})</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2.5">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-[160px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROJECT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{formatStatusLabel(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyProjects onCreate={() => setIsCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => {
            const projectTasks = tasks.filter(t => t.projectId === p.projectId)
            const completed = projectTasks.filter(t => t.status === 'completed').length
            const projectMembers = members.filter(m => p.members.includes(m.userId))
            const dynamicProgress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0
            return (
              <Link key={p.projectId} to={`/projects/${p.projectId}`} className="card-premium !rounded-2xl !p-0 overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-2.5 bg-gradient-to-r from-primary via-accent-foreground to-primary" />
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight truncate group-hover:text-primary transition-colors">{p.name}</h3>
                        <Badge className={cn('text-xs border-0', getStatusColor(p.status))}>{formatStatusLabel(p.status)}</Badge>
                      </div>
                      <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">{p.description || 'No description yet.'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><MoreHorizontal className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="!rounded-lg">Edit project</DropdownMenuItem>
                        <DropdownMenuItem className="!rounded-lg">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><CheckSquare2 className="h-4 w-4" />{completed} / {projectTasks.length} tasks</span>
                      <span className="font-semibold">{dynamicProgress}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent-foreground/70 dark:to-primary rounded-full transition-all" style={{ width: `${dynamicProgress}%` }} />
                    </div>
                  </div>
                  {p.objectives && p.objectives.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.objectives.slice(0, 3).map((obj, i) => (
                        <Badge key={i} variant="secondary" className="text-xs truncate max-w-full">{obj}</Badge>
                      ))}
                      {p.objectives.length > 3 && <Badge variant="outline" className="text-xs">+{p.objectives.length - 3}</Badge>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-border/60">
                    <div className="flex -space-x-2">
                      {projectMembers.slice(0, 5).map(m => (
                        <Avatar key={m.userId} className="h-9 w-9 border-2 border-card">
                          <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white', fontSize: 11 }}>{getInitials(m.fullName)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {p.members.length > 5 && (
                        <div className="h-9 w-9 rounded-full border-2 border-card bg-muted text-muted-foreground grid place-items-center font-semibold text-xs">+{p.members.length - 5}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {p.startDate && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(p.startDate)}</span>}
                      <ChevronRight className="h-4 w-4 opacity-50 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}

function ProjectDetail({ project, tasks, members }: { project: Project; tasks: Task[]; members: User[] }) {
  const projectMembers = members.filter(m => project.members.includes(m.userId))
  const completed = tasks.filter(t => t.status === 'completed').length
  const dynamicProgress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/projects" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">Projects <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={cn('text-sm', getStatusColor(project.status))}>{formatStatusLabel(project.status)}</Badge>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">{project.description || 'No description yet.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11"><Users className="h-4 w-4 mr-1.5" />Invite</Button>
          <Button className="h-11"><Plus className="h-4 w-4 mr-1.5" />Add task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Progress" value={`${dynamicProgress}%`} sub={`${completed} of ${tasks.length} tasks done`} />
        <StatCard icon={CheckSquare2} label="Tasks" value={tasks.length.toString()} sub="Total tasks" />
        <StatCard icon={Users} label="Members" value={project.members.length.toString()} sub="Contributors" />
        <StatCard icon={CalendarDays} label="Timeline" value={project.startDate ? formatDate(project.startDate) : '—'} sub={project.endDate ? `→ ${formatDate(project.endDate)}` : 'TBD'} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-11 p-1 w-full overflow-x-auto justify-start">
          <TabsTrigger value="overview" className="h-9">Overview</TabsTrigger>
          <TabsTrigger value="tasks" className="h-9">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="members" className="h-9">Members</TabsTrigger>
          <TabsTrigger value="discussion" className="h-9">Discussion</TabsTrigger>
          <TabsTrigger value="activity" className="h-9">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border-2">
              <CardHeader><CardTitle className="text-2xl">Objectives</CardTitle><CardDescription className="text-base mt-1">What this project aims to accomplish.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {project.objectives?.length ? project.objectives.map((o, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/40 border-2 border-border flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0 mt-0.5 font-bold text-sm">{i + 1}</div>
                    <div className="text-lg leading-relaxed">{o}</div>
                  </div>
                )) : <EmptyHint text="Add objectives from project settings." />}
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader><CardTitle className="text-2xl">Tags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags?.length ? project.tags.map(t => <Badge key={t} variant="secondary" className="text-sm px-3 py-1.5">#{t}</Badge>) : <EmptyHint text="No tags yet." />}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-2">
            <CardHeader><CardTitle className="text-2xl">Recent tasks</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {tasks.length === 0 ? <EmptyHint text="No tasks in this project yet." /> : tasks.slice(0, 6).map(t => (
                <Link key={t.taskId} to={`/tasks/${t.taskId}`} className="p-4 rounded-xl hover:bg-muted/40 transition-colors flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate">{t.title}</div>
                    <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">{t.description}</p>
                  </div>
                  <Badge className={cn('text-xs border-0', getStatusColor(t.status))}>{formatStatusLabel(t.status)}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <Card className="border-2">
            <CardContent className="p-5 space-y-2.5">
              {tasks.length === 0 ? <EmptyHint text="Create tasks linked to this project to see them here." /> : tasks.map(t => (
                <Link key={t.taskId} to={`/tasks/${t.taskId}`} className="p-4 rounded-xl border-2 border-transparent hover:border-border hover:bg-muted/40 transition-all flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{t.title}</div>
                  </div>
                  <Badge className={cn('text-xs border-0', getStatusColor(t.status))}>{formatStatusLabel(t.status)}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <Card className="border-2">
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectMembers.length === 0 ? <EmptyHint text="No members assigned yet." /> : projectMembers.map(m => (
                <div key={m.userId} className="p-4 rounded-xl bg-muted/40 border-2 border-border flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white' }}>{getInitials(m.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-lg truncate">{m.fullName}</div>
                    <div className="text-sm text-muted-foreground truncate">{m.email}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discussion" className="mt-6">
          <Card className="border-2"><CardContent className="p-10 text-center"><MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-lg text-muted-foreground">Project discussion coming soon. Use team chat channels for now.</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <Card className="border-2"><CardContent className="p-10 text-center"><Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-lg text-muted-foreground">Activity feed will appear here.</p></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: any) {
  return (
    <Card className="border-2">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground grid place-items-center"><Icon className="h-5.5 w-5.5" style={{ width: 22, height: 22 }} /></div>
        </div>
        <div className="text-2xl md:text-3xl font-bold tracking-tight">{value}</div>
        <div className="mt-1"><div className="text-lg font-medium">{label}</div><div className="text-sm text-muted-foreground">{sub}</div></div>
      </CardContent>
    </Card>
  )
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-5">
          <FolderKanban className="h-8 w-8" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight">No projects yet</h3>
        <p className="text-muted-foreground mt-2 mb-6 max-w-lg mx-auto leading-relaxed">Projects organize work across tasks, members, and discussion. Create your first project to get started.</p>
        <Button className="h-12 !text-lg" onClick={onCreate}><Plus className="h-5 w-5 mr-1.5" /> Create project</Button>
      </CardContent>
    </Card>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-muted-foreground p-6 text-center leading-relaxed">{text}</p>
}
