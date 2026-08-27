import { useEffect, useMemo, useState } from 'react'
import {
  Trophy, Plus, Calendar, Users, Medal, Timer, ChevronRight,
  Search, Filter, TrendingUp, Crown, Award, Zap, CheckCircle2, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import {
  COLLECTIONS, getCurrentTeamId, listTeamMembers, onSnapshot, query
} from '@/lib/dataService'
import type { Contest, ContestStatus, User } from '@/types'
import { cn, formatDate, formatStatusLabel, getAvatarColor, getInitials } from '@/lib/utils'
import CreateContestDialog from '@/components/dialogs/CreateContestDialog'
import SubmitContestScoreDialog from '@/components/dialogs/SubmitContestScoreDialog'

const STATUSES: ContestStatus[] = ['upcoming', 'active', 'completed', 'archived']

const STATUS_META: Record<ContestStatus, { color: string; dot: string }> = {
  upcoming: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' },
  active: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
  completed: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-500' },
  archived: { color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300', dot: 'bg-zinc-500' },
}

export default function ContestsPage() {
  const teamId = getCurrentTeamId()
  const [contests, setContests] = useState<Contest[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [scoreDialogOpen, setScoreDialogOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) return
    let alive = true
    Promise.all([
      query<Contest>(COLLECTIONS.CONTESTS, [{ field: 'teamId', op: '==', value: teamId }], { field: 'startDate', direction: 'asc' }),
      listTeamMembers(teamId),
    ]).then(([c, m]) => { if (alive) { setContests(c); setMembers(m); setLoading(false) } })
    const unsub = onSnapshot<Contest>(COLLECTIONS.CONTESTS, d => setContests(d.filter(x => x.teamId === teamId).sort((a, b) => a.startDate.localeCompare(b.startDate))))
    return () => { alive = false; unsub() }
  }, [teamId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contests.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false
      if (status !== 'all' && c.status !== status) return false
      return true
    })
  }, [contests, search, status])

  const leaderboard = useMemo(() => {
    const scores: Record<string, number> = {}
    contests.forEach(c => Object.entries(c.points).forEach(([uid, pts]) => { scores[uid] = (scores[uid] || 0) + (pts || 0) }))
    return members.map(m => ({ user: m, points: scores[m.userId] || 0 })).sort((a, b) => b.points - a.points)
  }, [contests, members])

  const upcoming = contests.filter(c => c.status === 'upcoming').sort((a, b) => a.startDate.localeCompare(b.startDate))
  const active = contests.filter(c => c.status === 'active')

  if (!teamId) return <EmptyHint />

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contests & Competitions</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Challenges, CTFs, hackathons, leaderboards, submissions.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1">{contests.length} contests · {active.length} live</Badge>
          <Button className="h-11" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New contest</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <StatCard icon={Zap} label="Active contests" value={active.length.toString()} sub="Right now" accent="from-emerald-500/20 to-emerald-500/5" pulse />
            <StatCard icon={Calendar} label="Upcoming" value={upcoming.length.toString()} sub="Scheduled" accent="from-blue-500/20 to-blue-500/5" />
            <StatCard icon={Trophy} label="Total participants" value={contests.reduce((s, c) => s + c.participants.length, 0).toString()} sub="Across all contests" accent="from-amber-500/20 to-amber-500/5" />
          </div>

          {active.length > 0 && (
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-background overflow-hidden relative">
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl bg-emerald-500/20" />
              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm font-semibold">
                    <span className="relative flex h-2.5 w-2.5 mr-1"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" /><span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
                    LIVE NOW
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{active[0].name}</h3>
                <p className="text-base md:text-lg text-muted-foreground mt-1 max-w-2xl leading-relaxed">{active[0].description}</p>
                <div className="flex flex-wrap items-center gap-5 mt-5 text-sm md:text-base">
                  <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{formatDate(active[0].startDate)} → {formatDate(active[0].endDate)}</span>
                  <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{active[0].participants.length} participants</span>
                  <span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground" />{active[0].categories.length} categories</span>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <Button className="h-11 !text-base">Enter contest <ChevronRight className="h-4 w-4 ml-1" /></Button>
                  <Button variant="outline" className="h-11 !text-base">View leaderboard</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-5">
            <div className="flex-1 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                <Tabs defaultValue="all" className="w-full md:w-auto">
                  <TabsList className="h-11 p-1">
                    <TabsTrigger value="all" className="h-9">All ({contests.length})</TabsTrigger>
                    <TabsTrigger value="upcoming" className="h-9">Upcoming ({upcoming.length})</TabsTrigger>
                    <TabsTrigger value="active" className="h-9">Active ({active.length})</TabsTrigger>
                    <TabsTrigger value="completed" className="h-9">Completed ({contests.filter(c => c.status === 'completed').length})</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" style={{ width: 18, height: 18 }} />
                    <Input className="h-11 w-[220px] pl-10" placeholder="Search contests…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11 w-[150px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Filter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{formatStatusLabel(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyContests onCreate={() => setIsCreateOpen(true)} />
              ) : (
                <div className="space-y-4">
                  {filtered.map(c => {
                    const meta = STATUS_META[c.status]
                    const participants = members.filter(m => c.participants.includes(m.userId))
                    const leaders = Object.entries(c.points).sort(([, a], [, b]) => b - a).slice(0, 3)
                    return (
                      <Card key={c.contestId} className="border-2 hover:shadow-md transition-all overflow-hidden group">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1.5 bg-gradient-to-b from-primary/80 to-primary" />
                            <div className="flex-1 p-6 space-y-4">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                                    <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', meta.color)}>
                                      <span className={cn('h-2 w-2 rounded-full', meta.dot)} />{formatStatusLabel(c.status)}
                                    </span>
                                    {c.categories.map(cat => <Badge key={cat} variant="secondary" className="text-xs">#{cat}</Badge>)}
                                  </div>
                                  <h3 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">{c.name}</h3>
                                  <p className="text-sm md:text-base text-muted-foreground mt-1 leading-relaxed max-w-2xl">{c.description || 'No description.'}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-5 text-sm md:text-base">
                                <span className="inline-flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />{formatDate(c.startDate)}</span>
                                <span className="inline-flex items-center gap-2 text-muted-foreground"><Timer className="h-4 w-4" />→ {formatDate(c.endDate)}</span>
                                <span className="inline-flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{participants.length} joined</span>
                              </div>
                              {leaders.length > 0 && (
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top</span>
                                  {leaders.map(([uid, pts], i) => {
                                    const u = members.find(m => m.userId === uid)
                                    if (!u) return null
                                    return (
                                      <div key={uid} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border">
                                        {i === 0 && <Crown className="h-4 w-4 text-amber-500" />}
                                        {i === 1 && <Medal className="h-4 w-4 text-slate-400" />}
                                        {i === 2 && <Award className="h-4 w-4 text-orange-500" />}
                                        <Avatar className="h-6 w-6 border border-background">
                                          <AvatarFallback style={{ backgroundColor: getAvatarColor(u.fullName), color: 'white', fontSize: 9 }}>{getInitials(u.fullName)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm">{u.fullName}</span>
                                        <span className="text-xs font-bold text-muted-foreground">{pts} pts</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="p-6 pt-0 md:p-6 md:pl-4 md:flex md:flex-col md:justify-center md:items-end border-t-2 md:border-t-0 md:border-l-2 border-border/60 bg-muted/10 md:bg-transparent">
                              <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                                <TrendingUp className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
                                <span className="font-bold text-sm uppercase tracking-wider">Leaderboard</span>
                              </div>
                              <div className="text-2xl md:text-3xl font-bold tracking-tight">{Object.values(c.points).reduce((a, b) => a + b, 0)}</div>
                              <div className="text-sm text-muted-foreground mb-4">total points</div>
                              <Button className="h-10 w-full md:w-auto mb-2" onClick={() => setScoreDialogOpen(c.contestId)}>Submit Score</Button>
                              <Button variant="outline" className="h-10 w-full md:w-auto">Details <ChevronRight className="h-4 w-4 ml-0.5" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="w-full lg:w-80 shrink-0 space-y-5">
              <Card className="border-2 sticky top-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl">Team Leaderboard</CardTitle>
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  <CardDescription className="text-base mt-1">Cumulative across all contests.</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-2.5">
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 leading-relaxed">No scored submissions yet.</p>
                  ) : leaderboard.map((row, i) => {
                    const isTop3 = i < 3
                    return (
                      <div key={row.user.userId} className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-colors',
                        isTop3 ? 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/20' : 'hover:bg-muted/40'
                      )}>
                        <div className={cn(
                          'h-8 w-8 rounded-lg grid place-items-center font-bold text-sm shrink-0',
                          i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          i === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                          i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-muted text-muted-foreground'
                        )}>
                          {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-background shrink-0">
                          <AvatarFallback style={{ backgroundColor: getAvatarColor(row.user.fullName), color: 'white', fontSize: 11 }}>{getInitials(row.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate">{row.user.fullName}</div>
                          <div className="text-xs text-muted-foreground truncate">{row.user.email}</div>
                        </div>
                        <div className="font-bold text-lg shrink-0">{row.points}</div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <CreateContestDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {scoreDialogOpen && <SubmitContestScoreDialog contestId={scoreDialogOpen} open={!!scoreDialogOpen} onOpenChange={(v) => !v && setScoreDialogOpen(null)} />}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, accent, pulse }: any) {
  return (
    <Card className="relative overflow-hidden border-2">
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', accent)} />
      <CardContent className="relative p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('h-12 w-12 rounded-xl bg-background/80 grid place-items-center shadow-sm text-primary', pulse && 'animate-pulse-slow')}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="text-3xl md:text-4xl font-bold tracking-tight">{value}</div>
        <div className="mt-1"><div className="text-lg font-medium">{label}</div><div className="text-sm text-muted-foreground">{sub}</div></div>
      </CardContent>
    </Card>
  )
}

function EmptyContests({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-5"><Trophy className="h-8 w-8" /></div>
        <h3 className="text-2xl md:text-3xl font-bold mb-2">No contests yet</h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">Host CTFs, hackathons, challenges, and friendly competitions.</p>
        <Button className="h-12 !text-lg" onClick={onCreate}><Plus className="h-5 w-5 mr-1.5" /> Create contest</Button>
      </CardContent>
    </Card>
  )
}

function EmptyHint() {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <Trophy className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold mb-2">No team selected</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">Choose a team to view contests and leaderboards.</p>
      </CardContent>
    </Card>
  )
}
