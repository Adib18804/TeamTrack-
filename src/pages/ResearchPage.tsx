import { useEffect, useMemo, useState } from 'react'
import {
  Microscope, Plus, Lightbulb, FileSearch, Database, LineChart,
  BookMarked, MessageSquare, Calendar, Users, ChevronRight,
  MoreHorizontal, GripVertical, Search, Filter, Clock, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import {
  COLLECTIONS, getCurrentTeamId, listTeamMembers, onSnapshot, query
} from '@/lib/dataService'
import type { ResearchItem, ResearchStatus, User } from '@/types'
import { cn, formatDate, formatStatusLabel, getAvatarColor, getInitials } from '@/lib/utils'
import CreateResearchDialog from '@/components/dialogs/CreateResearchDialog'
import { Input } from '@/components/ui/input'

const STATUSES: ResearchStatus[] = ['idea', 'planning', 'literature_review', 'data_collection', 'experimentation', 'analysis', 'writing', 'review', 'completed']

const STATUS_META: Record<ResearchStatus, { color: string; label: string; icon: any }> = {
  idea: { color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', label: 'Idea', icon: Lightbulb },
  planning: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Planning', icon: FileSearch },
  literature_review: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', label: 'Lit Review', icon: BookMarked },
  data_collection: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', label: 'Data Collection', icon: Database },
  experimentation: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Experimentation', icon: Microscope },
  analysis: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: 'Analysis', icon: LineChart },
  writing: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', label: 'Writing', icon: BookMarked },
  review: { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', label: 'Review', icon: MessageSquare },
  completed: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Completed', icon: CheckCircle2 },
}

export default function ResearchPage() {
  const teamId = getCurrentTeamId()
  const [items, setItems] = useState<ResearchItem[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return
    let alive = true
    Promise.all([
      query<ResearchItem>(COLLECTIONS.RESEARCH, [{ field: 'teamId', op: '==', value: teamId }], { field: 'updatedAt', direction: 'desc' }),
      listTeamMembers(teamId),
    ]).then(([r, m]) => { if (alive) { setItems(r); setMembers(m); setLoading(false) } })
    const unsub = onSnapshot<ResearchItem>(COLLECTIONS.RESEARCH, d => setItems(d.filter(x => x.teamId === teamId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
    return () => { alive = false; unsub() }
  }, [teamId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(r => {
      if (q && !r.title.toLowerCase().includes(q) && !r.researchQuestion.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [items, search, statusFilter])

  const stats = useMemo(() => {
    const s: Record<string, number> = {}
    STATUSES.forEach(st => s[st] = 0)
    items.forEach(it => s[it.status]++)
    return s
  }, [items])

  if (!teamId) return <EmptyHint />

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Research Workspace</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Pose questions, run experiments, record findings, collaborate on papers.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1">{items.length} research items</Badge>
          <Button className="h-11" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New research</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {STATUSES.slice(0, 5).map(st => {
              const meta = STATUS_META[st]
              const Icon = meta.icon
              const active = statusFilter === st
              return (
                <button key={st} onClick={() => setStatusFilter(active ? 'all' : st)} className={cn(
                  'p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md',
                  active ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/30'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn('h-9 w-9 rounded-lg grid place-items-center', meta.color)}><Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} /></div>
                    <div className="text-2xl md:text-3xl font-bold">{stats[st] || 0}</div>
                  </div>
                  <div className="text-sm md:text-base font-semibold">{meta.label}</div>
                </button>
              )
            })}
          </div>

          <Card className="border-2">
            <CardContent className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input className="h-11 pl-11" placeholder="Search by title or research question…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-[180px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <EmptyResearch onCreate={() => setIsCreateOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(r => {
                const meta = STATUS_META[r.status]
                const Icon = meta.icon
                const assigned = members.filter(m => r.assignedMembers.includes(m.userId))
                return (
                  <Card key={r.researchId} className="border-2 group hover:shadow-lg transition-all overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', meta.color)}>
                            <Icon className="h-3.5 w-3.5" />{meta.label}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.preventDefault()}>
                            <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="h-5 w-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="!rounded-lg">Edit research</DropdownMenuItem>
                            <DropdownMenuItem className="!rounded-lg">Add findings</DropdownMenuItem>
                            <DropdownMenuItem className="!rounded-lg">Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors leading-snug">{r.title}</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/40 border-2 border-border">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Research Question</div>
                        <p className="text-base leading-snug">{r.researchQuestion || 'No question defined.'}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{r.description || 'No description yet.'}</p>
                      {r.hypothesis && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm leading-snug"><span className="font-semibold">Hypothesis:</span> {r.hypothesis}</p>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {assigned.length > 0 ? (
                            <div className="flex -space-x-2">
                              {assigned.slice(0, 4).map(a => (
                                <Avatar key={a.userId} className="h-8 w-8 border-2 border-card">
                                  <AvatarFallback style={{ backgroundColor: getAvatarColor(a.fullName), color: 'white', fontSize: 11 }}>{getInitials(a.fullName)}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No assignees</span>
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Updated {formatDate(r.updatedAt)}</div>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t-2 border-border/60 flex items-center justify-between bg-muted/20">
                      <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground">
                        {r.relatedPapers.length > 0 && <span className="inline-flex items-center gap-1"><BookMarked className="h-3.5 w-3.5" />{r.relatedPapers.length} papers</span>}
                        {r.datasetLinks.length > 0 && <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" />{r.datasetLinks.length} datasets</span>}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold">Open <ChevronRight className="h-3.5 w-3.5 ml-0.5" /></Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <CreateResearchDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}

function EmptyResearch({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-5"><Microscope className="h-8 w-8" /></div>
        <h3 className="text-2xl md:text-3xl font-bold mb-2">Nothing in the lab yet</h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">Start your first research item to track hypotheses, experiments, and findings.</p>
        <Button className="h-12 !text-lg" onClick={onCreate}><Plus className="h-5 w-5 mr-1.5" /> Start research</Button>
      </CardContent>
    </Card>
  )
}

function EmptyHint() {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <Microscope className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold mb-2">No team selected</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">Choose a team to open the research workspace.</p>
      </CardContent>
    </Card>
  )
}
