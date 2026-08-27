import {
  CalendarDays, Activity, BarChart3, BookOpen, CheckSquare2,
  Sparkles, Plus, ChevronRight, MessageSquare, MessageCircle, FileText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

export function PageHeader({ icon: Icon, title, subtitle, accent = true, actions }: any) {
  return (
    <div className="space-y-2 mb-7">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />{typeof Icon !== 'string' ? title : 'Module'}
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
      </div>
    </div>
  )
}

function ModuleShell({ icon: Icon, title, subtitle, status, children, accentBg, fade }: any) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border-2 border-border bg-card', fade && 'animate-fade-in')}>
      <div className={cn('absolute inset-0 opacity-40 pointer-events-none', accentBg || 'bg-gradient-to-br from-primary/5 via-transparent to-transparent')} />
      <div className="relative p-8 md:p-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/70 border border-border mb-6 text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-4 w-4" />{status || 'In progress'}
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 text-primary grid place-items-center shadow-sm">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
          </div>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">{subtitle}</p>
        <Separator className="my-8" />
        {children}
      </div>
    </div>
  )
}

function EmptyIllustration({ icon: Icon, text, cta, href }: any) {
  return (
    <div className="p-10 md:p-14 rounded-2xl bg-muted/30 border-2 border-dashed border-border/60 text-center max-w-xl mx-auto">
      <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-6 shadow-sm">
        <Icon className="h-8 w-8 md:h-10 md:w-10" />
      </div>
      <h3 className="text-2xl md:text-3xl font-bold mb-3">Nothing here yet</h3>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{text}</p>
      <Button className="h-12 !text-base md:!text-lg px-6" asChild><Link to={href || '/dashboard'}>{cta || 'Get started'} <ChevronRight className="h-4 w-4 ml-0.5 md:h-5 md:w-5 md:ml-1" /></Link></Button>
    </div>
  )
}

export function CalendarPage() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2)
  const today = 18
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const events: Record<number, { title: string; color: string }[]> = {
    5: [{ title: 'Team sync', color: 'bg-blue-500' }],
    12: [{ title: 'CTF begins', color: 'bg-violet-500' }],
    18: [{ title: 'Research review', color: 'bg-emerald-500' }, { title: 'Log due', color: 'bg-amber-500' }],
    21: [{ title: 'Task deadline', color: 'bg-rose-500' }],
    26: [{ title: 'Contest ends', color: 'bg-violet-500' }],
  }
  return (
    <div>
      <PageHeader icon={CalendarDays} title="Calendar" subtitle="Deadlines, milestones, events, and meetings across your team."
        actions={<><Button variant="outline" className="h-11">Today</Button><Button className="h-11"><Plus className="h-4 w-4 mr-1.5" />New event</Button></>} />
      <Card className="border-2">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl md:text-2xl font-bold">{month}</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">‹</Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">›</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-sm">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((d, i) => {
              const valid = d > 0 && d < 32
              const isToday = d === today
              const todayEvents = events[d] || []
              return (
                <div key={i} className={cn(
                  'aspect-square md:aspect-auto md:h-28 rounded-xl border-2 p-1.5 md:p-3 transition-all',
                  !valid ? 'border-transparent bg-transparent opacity-30' : isToday ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-border hover:bg-muted/30'
                )}>
                  {valid && (
                    <>
                      <div className={cn('inline-flex items-center justify-center h-7 w-7 md:h-8 md:w-8 rounded-full text-sm font-semibold', isToday && 'bg-primary text-primary-foreground')}>{d}</div>
                      <div className="mt-1.5 space-y-1 hidden md:block">
                        {todayEvents.slice(0, 2).map((e, j) => (
                          <div key={j} className="text-[11px] font-medium px-1.5 py-0.5 rounded truncate text-white" style={{ backgroundColor: e.color }}>{e.title}</div>
                        ))}
                        {todayEvents.length > 2 && <div className="text-[10px] text-muted-foreground pl-1">+{todayEvents.length - 2} more</div>}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ActivityPage() {
  const items = [
    { when: '2m ago', who: 'Alex Morgan', what: 'created task', target: 'Design challenge data model', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15' },
    { when: '6m ago', who: 'Jordan Lee', what: 'posted in', target: '#ctf-platform', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/15' },
    { when: '24m ago', who: 'Casey Kim', what: 'moved task', target: 'Scoring API → Under Review', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15' },
    { when: '1h ago', who: 'Alex Morgan', what: 'submitted daily log', target: 'Finished 5 beginner web challenges', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15' },
    { when: '3h ago', who: 'Jordan Lee', what: 'updated progress', target: 'Read PortSwigger XSS chapter → 33%', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15' },
    { when: 'Yesterday', who: 'Casey Kim', what: 'created research', target: 'Modern CSRF Bypass Techniques', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/15' },
    { when: 'Yesterday', who: 'System', what: 'posted announcement', target: 'Team sync this Thursday 3PM UTC', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/15' },
  ]
  return (
    <div>
      <PageHeader icon={Activity} title="Activity Feed" subtitle="Everything happening in your workspace, in real time."
        actions={<Badge variant="outline" className="text-sm px-3 py-1">{items.length} events</Badge>} />
      <Card className="border-2">
        <CardContent className="p-2 md:p-3">
          <ol className="relative border-s-2 border-border ms-3 md:ms-5">
            {items.map((it, i) => (
              <li key={i} className="ps-6 md:ps-8 pb-6 md:pb-8 last:pb-2 relative">
                <span className={cn('absolute -start-[13px] md:-start-[15px] flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full ring-4 ring-background shadow-sm', it.bg)}>
                  <Activity className={cn('h-3.5 w-3.5 md:h-4 md:w-4', it.color)} />
                </span>
                <div className="p-4 md:p-5 rounded-xl bg-muted/30 border-2 border-border hover:bg-muted/50 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5">
                    <span className="font-bold text-base md:text-lg">{it.who}</span>
                    <span className="text-sm md:text-base text-muted-foreground">{it.what}</span>
                    <span className="font-semibold text-sm md:text-base">{it.target}</span>
                    <span className="ms-auto text-xs md:text-sm text-muted-foreground">{it.when}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export function AnalyticsPage() {
  const metrics = [
    { label: 'Tasks completed', value: '128', change: '+12%', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Active projects', value: '4', change: '+1', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Hours logged', value: '342.5', change: '+18%', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Chat messages', value: '2,419', change: '+34%', color: 'text-rose-600 dark:text-rose-400' },
  ]
  const mockBars = Array.from({ length: 14 }, () => 10 + Math.random() * 90)
  return (
    <div>
      <PageHeader icon={BarChart3} title="Analytics" subtitle="Team productivity, progress, and engagement insights." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-7">
        {metrics.map(m => (
          <Card key={m.label} className="border-2">
            <CardContent className="p-5 md:p-6">
              <div className="text-sm md:text-base text-muted-foreground font-medium">{m.label}</div>
              <div className="mt-2 flex items-baseline gap-2 md:gap-3">
                <div className="text-3xl md:text-4xl font-bold tracking-tight">{m.value}</div>
                <span className={cn('font-semibold text-sm md:text-base', m.color)}>{m.change}</span>
              </div>
              <div className="mt-4 flex items-end gap-1 h-14 md:h-16 rounded-lg bg-muted/50 p-2 overflow-hidden">
                {mockBars.slice(0, 10).map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-primary/70 hover:bg-primary transition-all" style={{ height: `${h}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-2">
        <CardHeader><CardTitle className="text-2xl md:text-3xl">Tasks completed over time</CardTitle><CardDescription className="text-base mt-1">Last 14 days</CardDescription></CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-2 md:gap-3 h-64 md:h-80 rounded-2xl bg-muted/30 border-2 border-border p-4 md:p-6">
            {mockBars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60 hover:from-primary hover:to-accent-foreground/60 transition-all shadow-sm" style={{ height: `${h}%` }} />
                <span className="text-[10px] md:text-xs text-muted-foreground">D{i + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function KnowledgeBasePage() {
  const categories = [
    { name: 'Getting Started', count: 8, icon: Sparkles, color: 'bg-blue-500' },
    { name: 'Playbooks', count: 14, icon: FileText, color: 'bg-violet-500' },
    { name: 'Architecture', count: 6, icon: BookOpen, color: 'bg-emerald-500' },
    { name: 'Policies', count: 5, icon: MessageSquare, color: 'bg-amber-500' },
    { name: 'Runbooks', count: 11, icon: MessageCircle, color: 'bg-rose-500' },
    { name: 'Templates', count: 9, icon: CheckSquare2, color: 'bg-teal-500' },
  ]
  return (
    <div>
      <PageHeader icon={BookOpen} title="Knowledge Base" subtitle="Document everything — team docs, policies, runbooks, guides."
        actions={<Button className="h-11"><Plus className="h-4 w-4 mr-1.5" />New page</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 mb-7">
        {categories.map(c => (
          <Card key={c.name} className="border-2 hover:shadow-md transition-all group cursor-pointer">
            <CardContent className="p-5 md:p-6 flex items-start gap-4">
              <div className={cn('h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl grid place-items-center shrink-0 text-white shadow-sm', c.color)}>
                <c.icon className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors">{c.name}</h3>
                  <Badge variant="outline" className="text-sm md:text-base px-2.5 py-0.5">{c.count}</Badge>
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">Curated internal documentation and team references.</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <EmptyIllustration icon={BookOpen} text="Knowledge base documentation is created by your team dynamically. Add pages, subpages, and rich content in a future editor." cta="Browse tasks instead" href="/tasks" />
    </div>
  )
}

export function TaskDetailPage() {
  return (
    <div>
      <PageHeader icon={CheckSquare2} title="Task details" subtitle="Deep dive into a task: workflow, discussion, proof, review." />
      <ModuleShell
        icon={CheckSquare2}
        title="Dynamic task detail"
        subtitle="Each task opens with requirements, assignees, status, progress, attachments, resources, review workflow, and a dedicated threaded discussion."
        status="Individual task view"
        accentBg="bg-gradient-to-br from-violet-500/5 via-primary/5 to-transparent"
        fade
      >
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
          Click any task card from the main tasks list to open its full detail view (planned for the routed <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs md:text-sm">/tasks/:id</code> page).
          You'll see full description, timeline, comments, proof submissions, review approvals/rejections, and activity history.
        </p>
        <div className="mt-6 md:mt-8 flex flex-wrap gap-2.5 md:gap-3">
          <Button variant="outline" className="h-11" asChild><Link to="/tasks"><ChevronRight className="h-4 w-4 mr-1 rotate-180" />Back to all tasks</Link></Button>
          <Button className="h-11"><CheckSquare2 className="h-4 w-4 mr-1.5" />Mark in progress</Button>
        </div>
      </ModuleShell>
    </div>
  )
}
