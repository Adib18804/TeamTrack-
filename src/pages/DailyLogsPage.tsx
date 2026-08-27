import { useEffect, useMemo, useState } from 'react'
import {
  Clock, Plus, Users, AlertTriangle, Search, Filter, ChevronRight,
  BookOpen, Lightbulb, AlertCircle, Target, CheckCircle2, Sparkles, CalendarDays, Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { COLLECTIONS, addDoc, getCurrentTeamId, listTeamMembers, onSnapshot, query } from '@/lib/dataService'
import type { DailyLog, Task, User } from '@/types'
import { cn, formatDate, getAvatarColor, getInitials, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  relatedTaskId: z.string().optional().or(z.literal('')),
  topicId: z.string().optional().or(z.literal('')),
  plannedHours: z.coerce.number().min(0, 'Must be >= 0').max(24, '≤ 24h/day'),
  actualHours: z.coerce.number().min(0, 'Must be >= 0').max(24, '≤ 24h/day'),
  workSummary: z.string().min(10, 'Please describe today\'s work (10+ chars)'),
  whatILearned: z.string().optional().or(z.literal('')),
  challenges: z.string().optional().or(z.literal('')),
  blockers: z.string().optional().or(z.literal('')),
  nextSteps: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function DailyLogsPage() {
  const teamId = getCurrentTeamId()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plannedHours: 6, actualHours: 0, workSummary: '', whatILearned: '', challenges: '', blockers: '', nextSteps: '' },
  })

  useEffect(() => {
    if (!teamId) return
    let alive = true
    Promise.all([
      query<DailyLog>(COLLECTIONS.DAILY_LOGS, [{ field: 'teamId', op: '==', value: teamId }], { field: 'createdAt', direction: 'desc' }),
      listTeamMembers(teamId),
      query<Task>(COLLECTIONS.TASKS, [{ field: 'teamId', op: '==', value: teamId }]),
    ]).then(([l, m, t]) => { if (alive) { setLogs(l); setMembers(m); setTasks(t); setLoading(false) } })
    const unsub = onSnapshot<DailyLog>(COLLECTIONS.DAILY_LOGS, d => setLogs(d.filter(x => x.teamId === teamId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
    return () => { alive = false; unsub() }
  }, [teamId])

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter(l => {
      if (q && !l.workSummary.toLowerCase().includes(q) && !l.whatILearned.toLowerCase().includes(q)) return false
      if (userFilter !== 'all' && l.userId !== userFilter) return false
      if (dateFilter && l.date !== dateFilter) return false
      return true
    })
  }, [logs, search, userFilter, dateFilter])

  const stats = useMemo(() => {
    const todayLogs = logs.filter(l => l.date === today)
    const totalHours = logs.reduce((s, l) => s + (l.actualHours || 0), 0)
    const uniqueAuthors = new Set(logs.map(l => l.userId)).size
    const withBlockers = logs.filter(l => l.blockers.trim().length > 0 && l.date === today).length
    const teamTotal = members.filter(m => currentUser ? (m.globalRole === 'super_admin' || m.teamMemberships.some(tm => tm.teamId === teamId)) : false).length
    const missingToday = Math.max(0, teamTotal - todayLogs.length)
    return { today: todayLogs.length, missing: missingToday, totalHours, uniqueAuthors, withBlockers }
  }, [logs, today, members, currentUser, teamId])

  async function onSubmit(data: FormData) {
    if (!teamId || !currentUser) return
    try {
      await addDoc<DailyLog>(COLLECTIONS.DAILY_LOGS, {
        teamId,
        userId: currentUser.userId,
        date: today,
        relatedTaskId: data.relatedTaskId || undefined,
        topicId: data.topicId || undefined,
        plannedHours: data.plannedHours,
        actualHours: data.actualHours,
        workSummary: data.workSummary,
        whatILearned: data.whatILearned || '',
        challenges: data.challenges || '',
        blockers: data.blockers || '',
        nextSteps: data.nextSteps || '',
        proof: [],
      } as unknown as DailyLog, 'logId')
      toast({ title: 'Daily log submitted', description: 'Nice work keeping the team posted!', variant: 'success' })
      reset(); setCreateOpen(false)
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e?.message || 'Try again.', variant: 'destructive' })
    }
  }

  const postedToday = currentUser ? logs.some(l => l.userId === currentUser.userId && l.date === today) : false

  if (!teamId) return <EmptyHint />

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Daily Progress Logs</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Share wins, learnings, blockers, and next steps every day.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {!postedToday ? (
            <Button className="h-11" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Submit today's log
            </Button>
          ) : (
            <Badge variant="success" className="text-sm px-3 py-1.5"><CheckCircle2 className="h-4 w-4 mr-1" />You posted today</Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={<CheckCircle2 className="h-6 w-6" />} label="Posted today" value={stats.today.toString()} sub={`${members.length} team members total`} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/15" />
            <Stat icon={<AlertTriangle className="h-6 w-6" />} label="Missing today" value={stats.missing.toString()} sub="Haven't checked in yet" color="text-amber-600 dark:text-amber-400" bg="bg-amber-500/15" />
            <Stat icon={<Clock className="h-6 w-6" />} label="Total hours logged" value={stats.totalHours.toFixed(1)} sub="Across all logs" color="text-blue-600 dark:text-blue-400" bg="bg-blue-500/15" />
            <Stat icon={<AlertCircle className="h-6 w-6" />} label="Active blockers" value={stats.withBlockers.toString()} sub="Needs attention today" color="text-rose-600 dark:text-rose-400" bg="bg-rose-500/15" />
          </div>

          <Card className="border-2">
            <CardContent className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input className="h-11 pl-11" placeholder="Search summaries or learnings…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="h-11 w-[180px]"><Users className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All members</SelectItem>
                    {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" className="h-11 w-[180px]" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                {dateFilter && (
                  <Button variant="ghost" size="sm" className="h-9" onClick={() => setDateFilter('')}>Clear</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="h-11 p-1">
              <TabsTrigger value="all" className="h-9">All ({filtered.length})</TabsTrigger>
              <TabsTrigger value="today" className="h-9">Today ({filtered.filter(l => l.date === today).length})</TabsTrigger>
              {currentUser && <TabsTrigger value="mine" className="h-9">Mine ({filtered.filter(l => l.userId === currentUser.userId).length})</TabsTrigger>}
            </TabsList>
            <TabsContent value="all" className="mt-6"><LogList logs={filtered} members={members} tasks={tasks} /></TabsContent>
            <TabsContent value="today" className="mt-6"><LogList logs={filtered.filter(l => l.date === today)} members={members} tasks={tasks} empty="No one has posted yet today." /></TabsContent>
            <TabsContent value="mine" className="mt-6"><LogList logs={currentUser ? filtered.filter(l => l.userId === currentUser.userId) : []} members={members} tasks={tasks} empty="You haven't posted any logs yet." /></TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center"><Sparkles className="h-6 w-6" /></div>
              <div>
                <DialogTitle className="text-2xl md:text-3xl">Daily progress log</DialogTitle>
                <DialogDescription className="text-base md:text-lg mt-1">Share what you worked on today — {formatDate(today)}.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg">Related task (optional)</Label>
                <Select onValueChange={v => register('relatedTaskId').onChange({ target: { value: v } })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select a task…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {tasks.slice(0, 50).map(t => <SelectItem key={t.taskId} value={t.taskId}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-lg">Planned hours</Label>
                  <Input type="number" min="0" step="0.5" className="h-11" {...register('plannedHours')} />
                  {errors.plannedHours && <p className="text-sm text-destructive">{errors.plannedHours.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-lg">Actual hours</Label>
                  <Input type="number" min="0" step="0.5" className="h-11" {...register('actualHours')} />
                  {errors.actualHours && <p className="text-sm text-destructive">{errors.actualHours.message as string}</p>}
                </div>
              </div>
            </div>
            <Field icon={<BookOpen className="h-5 w-5" />} name="workSummary" label="Today's work summary" placeholder="What did you accomplish? Be specific." register={register} error={errors.workSummary?.message as string} rows={3} required />
            <Field icon={<Lightbulb className="h-5 w-5" />} name="whatILearned" label="What I learned (optional)" placeholder="Key takeaways, new concepts, tools mastered…" register={register} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field icon={<AlertTriangle className="h-5 w-5" />} name="challenges" label="Challenges (optional)" placeholder="What was difficult?" register={register} rows={3} />
              <Field icon={<AlertCircle className="h-5 w-5" />} name="blockers" label="Blockers (optional)" placeholder="Anything preventing progress?" register={register} rows={3} />
            </div>
            <Field icon={<Target className="h-5 w-5" />} name="nextSteps" label="Next steps / Tomorrow's plan (optional)" placeholder="What's next?" register={register} />
            <DialogFooter className="gap-2.5">
              <Button type="button" variant="outline" className="h-11" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11">Submit log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ icon, name, label, placeholder, register, error, rows = 2, required }: any) {
  const multi = rows > 1
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <Label className="text-lg">{label}{required && <span className="text-destructive"> *</span>}</Label>
      </div>
      {multi ? (
        <Textarea rows={rows} className="!text-lg resize-y" placeholder={placeholder} {...register(name)} />
      ) : (
        <Input className="h-11 !text-lg" placeholder={placeholder} {...register(name)} />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function Stat({ icon, label, value, sub, color, bg }: any) {
  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('h-12 w-12 rounded-xl grid place-items-center shadow-sm', bg, color)}>{icon}</div>
        </div>
        <div className="text-3xl md:text-4xl font-bold tracking-tight">{value}</div>
        <div className="mt-1"><div className="text-lg font-medium">{label}</div><div className="text-sm text-muted-foreground leading-relaxed">{sub}</div></div>
      </CardContent>
    </Card>
  )
}

function LogList({ logs, members, tasks, empty }: { logs: DailyLog[]; members: User[]; tasks: Task[]; empty?: string }) {
  if (logs.length === 0) {
    return (
      <Card className="border-2"><CardContent className="p-16 text-center max-w-xl mx-auto">
        <Clock className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h3 className="text-2xl md:text-3xl font-bold mb-2">No logs here</h3>
        <p className="text-muted-foreground text-lg leading-relaxed">{empty || 'Try adjusting filters or submitting the first log.'}</p>
      </CardContent></Card>
    )
  }
  const byDate: Record<string, DailyLog[]> = {}
  logs.forEach(l => { byDate[l.date] = byDate[l.date] || []; byDate[l.date].push(l) })
  return (
    <div className="space-y-8">
      {Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, dayLogs]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0"><CalendarDays className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold">{formatDate(date)}</div>
              <div className="text-sm text-muted-foreground">{dayLogs.length} submission{dayLogs.length === 1 ? '' : 's'} · {dayLogs.reduce((s, l) => s + (l.actualHours || 0), 0).toFixed(1)}h total</div>
            </div>
            <Separator className="flex-1 ml-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {dayLogs.map(l => {
              const author = members.find(m => m.userId === l.userId)
              const task = tasks.find(t => t.taskId === l.relatedTaskId)
              return (
                <Card key={l.logId} className="border-2 hover:shadow-md transition-all overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-11 w-11 border-2 border-border shrink-0">
                          <AvatarFallback style={{ backgroundColor: author ? getAvatarColor(author.fullName) : '#64748b', color: 'white' }}>{author ? getInitials(author.fullName) : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold text-lg truncate">{author?.fullName || 'Unknown user'}</div>
                          <div className="text-sm text-muted-foreground">{formatRelativeTime(l.createdAt)} · {l.actualHours}h / {l.plannedHours}h planned</div>
                        </div>
                      </div>
                    </div>
                    {task && <Badge variant="outline" className="w-fit text-xs px-2 py-0.5"><Hash className="h-3 w-3 mr-1 inline" />{task.title}</Badge>}
                    <Section icon={<BookOpen className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />} title="Work done">
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{l.workSummary}</p>
                    </Section>
                    {l.whatILearned && <Section icon={<Lightbulb className="h-4.5 w-4.5 text-amber-500" style={{ width: 18, height: 18 }} />} title="Learned"><p className="leading-relaxed">{l.whatILearned}</p></Section>}
                    {l.challenges && <Section icon={<AlertTriangle className="h-4.5 w-4.5 text-orange-500" style={{ width: 18, height: 18 }} />} title="Challenges"><p className="leading-relaxed">{l.challenges}</p></Section>}
                    {l.blockers && <Section icon={<AlertCircle className="h-4.5 w-4.5 text-rose-500" style={{ width: 18, height: 18 }} />} title="Blockers"><p className="leading-relaxed">{l.blockers}</p></Section>}
                    {l.nextSteps && <Section icon={<Target className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />} title="Next steps"><p className="leading-relaxed">{l.nextSteps}</p></Section>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Section({ icon, title, children }: any) {
  return (
    <div className="p-4 rounded-xl bg-muted/40 border-2 border-border/60 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wider text-foreground/80">{icon}{title}</div>
      <div className="text-foreground/90">{children}</div>
    </div>
  )
}

function EmptyHint() {
  return (
    <Card className="border-2"><CardContent className="p-16 text-center max-w-xl mx-auto">
      <Clock className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
      <h2 className="text-3xl font-bold mb-2">No team selected</h2>
      <p className="text-muted-foreground text-lg leading-relaxed">Choose a team to see daily progress logs.</p>
    </CardContent></Card>
  )
}
