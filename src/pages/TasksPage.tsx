import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckSquare2, Plus, Search, Filter, LayoutGrid, List, Table as TableIcon,
  CalendarDays, ChevronRight, ArrowUpDown, Calendar as CalendarIcon, GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { COLLECTIONS, listTeamMembers, onSnapshot, query } from '@/lib/dataService'
import type { Task, User } from '@/types'
import {
  cn, formatDate, formatStatusLabel, getStatusColor, getPriorityColor,
  getInitials, getAvatarColor, getDifficultyColor
} from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { addDoc, updateDoc } from '@/lib/dataService'

const STATUS_COLUMNS: Task['status'][] = ['not_started', 'in_progress', 'blocked', 'submitted', 'under_review', 'completed']

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  difficulty: z.enum(['beginner', 'easy', 'medium', 'hard', 'expert']),
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z.coerce.number().optional(),
})

export default function TasksPage() {
  const { currentUser, currentTeamId } = useAuth()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') || 'kanban'
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [assignee, setAssignee] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (params.get('new') === '1') {
      setCreateOpen(true)
      const next = new URLSearchParams(params); next.delete('new'); setParams(next)
    }
  }, [params, setParams])

  useEffect(() => {
    if (!currentTeamId) return
    let alive = true
    Promise.all([
      query<Task>(COLLECTIONS.TASKS, [{ field: 'teamId', op: '==', value: currentTeamId }], { field: 'updatedAt', direction: 'desc' }),
      listTeamMembers(currentTeamId),
    ]).then(([t, m]) => {
      if (!alive) return
      setTasks(t); setMembers(m); setLoading(false)
    })
    const unsub = onSnapshot<Task>(COLLECTIONS.TASKS, data => {
      if (!alive) return
      setTasks(data.filter(x => x.teamId === currentTeamId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    })
    return () => { alive = false; unsub() }
  }, [currentTeamId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
      if (priority !== 'all' && t.priority !== priority) return false
      if (status !== 'all' && t.status !== status) return false
      if (assignee === 'me') { if (!currentUser || !t.assignedUsers.includes(currentUser.userId)) return false }
      else if (assignee !== 'all' && !t.assignedUsers.includes(assignee)) return false
      return true
    })
  }, [tasks, search, priority, status, assignee, currentUser])

  const total = filtered.length
  const completed = filtered.filter(t => t.status === 'completed').length
  const overdue = filtered.filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < new Date()).length

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = {}
    STATUS_COLUMNS.forEach(s => map[s] = [])
    filtered.forEach(t => {
      if (!map[t.status]) map[t.status] = []
      map[t.status].push(t)
    })
    return map
  }, [filtered])

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', priority: 'medium', difficulty: 'medium', dueDate: '', estimatedHours: undefined } })

  async function onSubmit(data: any) {
    if (!currentTeamId || !currentUser) return
    try {
      await addDoc<Task>(COLLECTIONS.TASKS, {
        teamId: currentTeamId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        difficulty: data.difficulty,
        status: 'not_started',
        assignedUsers: [currentUser.userId],
        createdBy: currentUser.userId,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours,
        actualHours: 0,
        progressPercentage: 0,
        attachments: [],
        resources: [],
        proof: [],
        reviewStatus: 'pending',
        reviewComments: [],
      } as unknown as Task, 'taskId')
      toast({ title: 'Task created', description: 'Your task has been added.', variant: 'success' })
      reset(); setCreateOpen(false)
    } catch (e: any) {
      toast({ title: 'Failed to create', description: e?.message || 'Try again.', variant: 'destructive' })
    }
  }

  async function cycleStatus(task: Task) {
    const idx = STATUS_COLUMNS.indexOf(task.status)
    const next = STATUS_COLUMNS[Math.min(STATUS_COLUMNS.length - 1, idx + 1)]
    const progress = next === 'completed' ? 100 : next === 'in_progress' ? 25 : next === 'submitted' ? 85 : next === 'under_review' ? 95 : task.progressPercentage
    await updateDoc<Task>(COLLECTIONS.TASKS, 'taskId', task.taskId, { status: next, progressPercentage: Math.max(task.progressPercentage, progress) })
    toast({ title: 'Status updated', description: formatStatusLabel(next) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Manage work, track progress, and review submissions across your team.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 text-base px-3 py-2 rounded-xl bg-muted/50 border border-border">
            <span className="font-semibold">{total}</span><span className="text-muted-foreground">total</span>
            <span className="mx-1.5 h-4 w-px bg-border" />
            <span className="font-semibold text-green-600 dark:text-green-400">{completed}</span><span className="text-muted-foreground">done</span>
            {overdue > 0 && (<><span className="mx-1.5 h-4 w-px bg-border" /><span className="font-semibold text-destructive">{overdue}</span><span className="text-muted-foreground">overdue</span></>)}
          </div>
          <Button className="h-11" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New task
          </Button>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input className="h-11 pl-11" placeholder="Search by title or description…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-11 w-[140px]"><span className="text-muted-foreground mr-2"><Filter className="h-4 w-4 inline" /></span><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_COLUMNS.map(s => <SelectItem key={s} value={s}>{formatStatusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-11 w-[180px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                <SelectItem value="me">Assigned to me</SelectItem>
                {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:ml-auto">
            <Tabs value={view} onValueChange={v => setParams(new URLSearchParams([['view', v]]))}>
              <TabsList className="h-11 p-1">
                <TabsTrigger value="kanban" className="h-9"><LayoutGrid className="h-4 w-4 mr-1.5" />Kanban</TabsTrigger>
                <TabsTrigger value="list" className="h-9"><List className="h-4 w-4 mr-1.5" />List</TabsTrigger>
                <TabsTrigger value="table" className="h-9"><TableIcon className="h-4 w-4 mr-1.5" />Table</TabsTrigger>
                <TabsTrigger value="calendar" className="h-9 hidden md:inline-flex"><CalendarDays className="h-4 w-4 mr-1.5" />Calendar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : view === 'kanban' ? (
        <div className="overflow-x-auto pb-4 -mx-4 md:mx-0 px-4 md:px-0">
          <div className="grid grid-flow-col auto-cols-[minmax(320px,1fr)] lg:grid-cols-3 xl:grid-cols-6 gap-4 min-w-max lg:min-w-0">
            {STATUS_COLUMNS.map(col => (
              <div key={col} className="flex flex-col min-h-[50vh] bg-muted/30 rounded-2xl border-2 border-border p-3">
                <div className="flex items-center justify-between px-2 py-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-semibold text-base capitalize">{formatStatusLabel(col).replace(/ /g, '')}</h4>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{(columns[col] || []).length}</Badge>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {(columns[col] || []).map(t => <TaskCard key={t.taskId} task={t} members={members} onClick={() => cycleStatus(t)} />)}
                  {(columns[col] || []).length === 0 && (
                    <div className="p-6 rounded-xl border-2 border-dashed border-border text-center text-sm text-muted-foreground">Empty — drop tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : view === 'list' ? (
        <Card className="border-2">
          <CardContent className="p-0 divide-y divide-border">
            {filtered.length === 0 ? (
              <EmptyTasks />
            ) : filtered.map(t => (
              <Link key={t.taskId} to={`/tasks/${t.taskId}`} className="flex items-center gap-4 p-5 hover:bg-muted/40 transition-colors">
                <GripVertical className="h-5 w-5 text-muted-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="font-semibold text-lg truncate">{t.title}</div>
                    <Badge className={cn('text-xs border-0', getPriorityColor(t.priority))}>{t.priority}</Badge>
                    <Badge className={cn('text-xs border-0', getStatusColor(t.status))}>{formatStatusLabel(t.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{t.description || 'No description'}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 -space-x-2">
                  {t.assignedUsers.map(uid => {
                    const m = members.find(x => x.userId === uid)
                    return m ? (
                      <Avatar key={uid} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white', fontSize: 11 }}>{getInitials(m.fullName)}</AvatarFallback>
                      </Avatar>
                    ) : null
                  })}
                </div>
                {t.dueDate && (
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                    <CalendarIcon className="h-4 w-4" />{formatDate(t.dueDate)}
                  </div>
                )}
                <div className="w-24 shrink-0">
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${t.progressPercentage}%` }} />
                  </div>
                  <div className="text-xs text-right text-muted-foreground">{t.progressPercentage}%</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : view === 'table' ? (
        <Card className="border-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-muted/50 text-left text-sm">
                  <th className="p-4 font-semibold"><span className="inline-flex items-center gap-1.5">Task <ArrowUpDown className="h-3.5 w-3.5" /></span></th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Priority</th>
                  <th className="p-4 font-semibold">Difficulty</th>
                  <th className="p-4 font-semibold">Assignees</th>
                  <th className="p-4 font-semibold">Due</th>
                  <th className="p-4 font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyTasks /></td></tr>
                ) : filtered.map(t => (
                  <tr key={t.taskId} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 max-w-sm">
                      <Link to={`/tasks/${t.taskId}`} className="font-semibold text-foreground hover:text-primary">{t.title}</Link>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{t.description}</p>
                    </td>
                    <td className="p-4"><Badge className={cn('text-xs border-0', getStatusColor(t.status))}>{formatStatusLabel(t.status)}</Badge></td>
                    <td className="p-4"><Badge className={cn('text-xs border-0 uppercase', getPriorityColor(t.priority))}>{t.priority}</Badge></td>
                    <td className="p-4"><Badge variant="outline" className="text-xs capitalize">{t.difficulty}</Badge></td>
                    <td className="p-4">
                      <div className="flex -space-x-2">
                        {t.assignedUsers.map(uid => {
                          const m = members.find(x => x.userId === uid)
                          return m ? (
                            <Avatar key={uid} className="h-8 w-8 border-2 border-background" title={m.fullName}>
                              <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white', fontSize: 11 }}>{getInitials(m.fullName)}</AvatarFallback>
                            </Avatar>
                          ) : null
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                    <td className="p-4 min-w-[160px]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${t.progressPercentage}%` }} />
                        </div>
                        <span className="text-sm font-medium shrink-0">{t.progressPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Calendar view</CardTitle>
            <CardDescription className="text-base mt-1">Tasks organized by due date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filtered.filter(t => t.dueDate).length === 0 ? (
              <EmptyTasks hint="Tasks with a due date will appear here." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...filtered].filter(t => t.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)).map(t => (
                  <TaskCard key={t.taskId} task={t} members={members} compact />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl">Create new task</DialogTitle>
            <DialogDescription className="text-base md:text-lg mt-1">Assign to yourself or a project for now — refine details in the task page.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-lg">Title</Label>
              <Input className="h-12 !text-lg" {...register('title')} placeholder="Short, descriptive task title" />
              {errors.title && <p className="text-sm text-destructive">{(errors.title as any).message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-lg">Description</Label>
              <Textarea rows={4} className="!text-lg" {...register('description')} placeholder="Requirements, context, and acceptance criteria…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg">Priority</Label>
                <Select defaultValue="medium" onValueChange={v => register('priority').onChange({ target: { value: v } })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-lg">Difficulty</Label>
                <Select defaultValue="medium" onValueChange={v => register('difficulty').onChange({ target: { value: v } })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{['beginner', 'easy', 'medium', 'hard', 'expert'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-lg">Due date</Label>
                <Input type="date" className="h-11" {...register('dueDate')} />
              </div>
              <div className="space-y-2">
                <Label className="text-lg">Estimated hours</Label>
                <Input type="number" min="0" step="0.5" className="h-11" {...register('estimatedHours')} placeholder="4" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11">Create task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskCard({ task, members, compact, onClick }: { task: Task; members: User[]; compact?: boolean; onClick?: () => void }) {
  return (
    <Link to={`/tasks/${task.taskId}`} onClick={(e) => { if (onClick) { e.preventDefault(); onClick() } }} className="block card-premium !rounded-xl !p-4 group !border-2 hover:border-primary/40">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={cn('text-[10px] px-1.5 py-0.5 border-0 uppercase', getPriorityColor(task.priority))}>{task.priority}</Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 capitalize">{task.difficulty}</Badge>
        </div>
        <Badge className={cn('text-[10px] px-2 py-0.5 border-0', getStatusColor(task.status))}>{formatStatusLabel(task.status)}</Badge>
      </div>
      <div className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">{task.title}</div>
      {!compact && task.description && (
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-border/60">
        <div className="flex items-center gap-1.5 -space-x-1.5">
          {task.assignedUsers.slice(0, 4).map(uid => {
            const m = members.find(x => x.userId === uid)
            return m ? (
              <Avatar key={uid} className="h-7 w-7 border-2 border-card">
                <AvatarFallback style={{ backgroundColor: getAvatarColor(m.fullName), color: 'white', fontSize: 10 }}>{getInitials(m.fullName)}</AvatarFallback>
              </Avatar>
            ) : null
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (<span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(task.dueDate)}</span>)}
          <span>{task.progressPercentage}%</span>
        </div>
      </div>
    </Link>
  )
}

function EmptyTasks({ hint = 'Create a task to start tracking work.' }: { hint?: string }) {
  return (
    <div className="p-14 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-4">
        <CheckSquare2 className="h-7 w-7" />
      </div>
      <h4 className="text-xl font-semibold">No tasks match your filters</h4>
      <p className="text-muted-foreground mt-1 mb-5 leading-relaxed">{hint}</p>
    </div>
  )
}

