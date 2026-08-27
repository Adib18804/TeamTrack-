import { useEffect, useMemo, useState } from 'react'
import {
  GraduationCap, Plus, ChevronRight, Target, TrendingUp, CheckCircle2,
  BookOpen, Compass, Sparkles, Star, BookMarked, Clock, Award, ArrowRight,
  CircleDot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import {
  COLLECTIONS, getCurrentTeamId, onSnapshot, query
} from '@/lib/dataService'
import type { Domain, Topic, Subtopic, Resource } from '@/types'
import { cn, getInitials, getAvatarColor, truncateText } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import CreateDomainDialog from '@/components/dialogs/CreateDomainDialog'
import CreateTopicDialog from '@/components/dialogs/CreateTopicDialog'
import CreateSubtopicDialog from '@/components/dialogs/CreateSubtopicDialog'

const STAGES = ['Beginner', 'Intermediate', 'Advanced']

export default function LearningPage() {
  const teamId = getCurrentTeamId()
  const { currentUser } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [domainFilter, setDomainFilter] = useState('all')

  const [isCreateDomainOpen, setIsCreateDomainOpen] = useState(false)
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false)
  const [isCreateSubtopicOpen, setIsCreateSubtopicOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return
    let alive = true
    Promise.all([
      query<Domain>(COLLECTIONS.DOMAINS, [{ field: 'teamId', op: '==', value: teamId }]),
      query<Topic>(COLLECTIONS.TOPICS, [{ field: 'teamId', op: '==', value: teamId }]),
      query<Subtopic>(COLLECTIONS.SUBTOPICS, [{ field: 'teamId', op: '==', value: teamId }]),
      query<Resource>(COLLECTIONS.RESOURCES, [{ field: 'teamId', op: '==', value: teamId }]),
    ]).then(([d, t, s, r]) => { if (alive) { setDomains(d); setTopics(t); setSubtopics(s); setResources(r); setLoading(false) } })
    const u = [
      onSnapshot<Domain>(COLLECTIONS.DOMAINS, x => setDomains(x.filter(y => y.teamId === teamId))),
      onSnapshot<Topic>(COLLECTIONS.TOPICS, x => setTopics(x.filter(y => y.teamId === teamId))),
      onSnapshot<Subtopic>(COLLECTIONS.SUBTOPICS, x => setSubtopics(x.filter(y => y.teamId === teamId))),
      onSnapshot<Resource>(COLLECTIONS.RESOURCES, x => setResources(x.filter(y => y.teamId === teamId))),
    ]
    return () => { alive = false; u.forEach(f => f()) }
  }, [teamId])

  const visibleTopics = useMemo(() => domainFilter === 'all' ? topics : topics.filter(t => t.domainId === domainFilter), [topics, domainFilter])

  const roadmap = useMemo(() => STAGES.map((stage, idx) => {
    const diffs = (['beginner', 'easy', 'medium', 'hard', 'expert'] as const)
    const minDiff = diffs[Math.min(idx * 2, 4)]
    const maxDiff = diffs[Math.min(idx * 2 + 1, 4)]
    return {
      stage,
      resources: resources.filter(r => {
        const score = diffs.indexOf(r.difficulty)
        return score >= diffs.indexOf(minDiff) && score <= diffs.indexOf(maxDiff)
      }).slice(0, 6)
    }
  }), [resources])

  if (!teamId) return <EmptyHint />

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Learning Hub</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Follow roadmaps, learn from curated resources, and track team progress.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1">{resources.length} resources · {topics.length} topics · {domains.length} domains</Badge>
          <Button variant="outline" className="h-11" onClick={() => setIsCreateDomainOpen(true)}><Compass className="h-4 w-4 mr-1.5" />New domain</Button>
          <Button className="h-11" onClick={() => setIsCreateTopicOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New topic</Button>
          <Button className="h-11" onClick={() => setIsCreateSubtopicOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New subtopic</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={BookOpen} label="Domains" value={domains.length.toString()} sub="Focus areas" />
            <Stat icon={Target} label="Topics" value={topics.length.toString()} sub="Subjects" />
            <Stat icon={GraduationCap} label="Resources" value={resources.length.toString()} sub="Library items" />
            <Stat icon={TrendingUp} label="In progress" value="—" sub="Learning paths" />
          </div>

          <Card className="border-2 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/15 text-primary grid place-items-center shadow-sm">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <Badge variant="info" className="mb-2 text-xs px-3 py-1">Learning Roadmap</Badge>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Team Learning Journey</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">A guided path from fundamentals to advanced skills. Built dynamically from your resource library.</p>
                  </div>
                </div>
                <Button size="lg" className="shrink-0">Explore roadmap <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {roadmap.map((stage, i) => (
                  <div key={stage.stage} className="rounded-2xl border-2 border-border p-5 bg-background/70 relative overflow-hidden">
                    <div className={cn('absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-20', i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-rose-500')} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stage {i + 1}</div>
                        <span className={cn('h-2.5 w-2.5 rounded-full', i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-rose-500')} />
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold">{stage.stage}</h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {stage.resources.length} curated resources · {Math.max(4, (i + 1) * 4)} hours
                      </p>
                      <Separator className="my-4" />
                      <ul className="space-y-2">
                        {stage.resources.length > 0 ? stage.resources.slice(0, 4).map(r => (
                          <li key={r.resourceId} className="flex items-center gap-2.5 text-sm">
                            <CircleDot className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate leading-snug">{truncateText(r.title, 48)}</span>
                          </li>
                        )) : (
                          <li className="text-sm text-muted-foreground italic">Add resources to unlock this stage.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="domains" className="w-full">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <TabsList className="h-11 p-1 w-full md:w-auto">
                <TabsTrigger value="domains" className="h-9"><Compass className="h-4 w-4 mr-1.5" />Domains</TabsTrigger>
                <TabsTrigger value="topics" className="h-9"><BookMarked className="h-4 w-4 mr-1.5" />Topics</TabsTrigger>
                <TabsTrigger value="progress" className="h-9"><TrendingUp className="h-4 w-4 mr-1.5" />Progress</TabsTrigger>
              </TabsList>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="h-11 w-[200px]"><SelectValue placeholder="Filter by domain" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All domains</SelectItem>
                  {domains.map(d => <SelectItem key={d.domainId} value={d.domainId}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="domains" className="mt-6">
              {domains.length === 0 ? (
                <EmptyDomains onCreate={() => setIsCreateDomainOpen(true)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {domains.map(d => {
                    const dTopics = topics.filter(t => t.domainId === d.domainId)
                    const dResources = dTopics.flatMap(t => resources.filter(r => r.topicId === t.topicId))
                    return (
                      <Card key={d.domainId} className="border-2 group hover:shadow-lg transition-all overflow-hidden">
                        <div className="h-2.5" style={{ backgroundColor: d.color }} />
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl grid place-items-center text-white shadow-sm" style={{ backgroundColor: d.color }}>
                              <GraduationCap className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="text-sm">{d.status}</Badge>
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold mb-1 group-hover:text-primary transition-colors" style={{ color: d.color }}>{d.name}</h3>
                          <p className="text-muted-foreground text-base mb-5 leading-relaxed">{d.description || 'No description yet.'}</p>
                          <div className="flex items-center justify-between pt-4 border-t-2 border-border/60">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="inline-flex items-center gap-1 text-muted-foreground"><BookMarked className="h-4 w-4" />{dTopics.length} topics</span>
                              <span className="inline-flex items-center gap-1 text-muted-foreground"><BookOpen className="h-4 w-4" />{dResources.length} resources</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="topics" className="mt-6 space-y-4">
              {visibleTopics.length === 0 ? (
                <Card className="border-2"><CardContent className="p-14 text-center"><GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-xl text-muted-foreground">No topics yet.</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleTopics.map(t => {
                    const tSubtopics = subtopics.filter(s => s.topicId === t.topicId)
                    const tResources = resources.filter(r => r.topicId === t.topicId)
                    const domain = domains.find(d => d.domainId === t.domainId)
                    return (
                      <Card key={t.topicId} className="border-2 hover:shadow-md transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 rounded-xl grid place-items-center text-white shrink-0" style={{ backgroundColor: t.color }}>
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xl font-bold truncate">{t.name}</h4>
                                <div className="text-xs md:text-sm text-muted-foreground truncate">{domain?.name || 'Uncategorized'}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">{t.status}</Badge>
                          </div>
                          <p className="text-base text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{t.description || 'No description.'}</p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {tSubtopics.slice(0, 4).map(s => (
                              <Badge key={s.subtopicId} variant="secondary" className="text-xs" style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}>{s.name}</Badge>
                            ))}
                            {tSubtopics.length > 4 && <Badge variant="outline" className="text-xs">+{tSubtopics.length - 4}</Badge>}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-sm">
                            <span className="text-muted-foreground">{tResources.length} resources</span>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">Explore <ChevronRight className="h-3.5 w-3.5 ml-0.5" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">Team learning progress</CardTitle>
                  <CardDescription className="text-base mt-1">Overall completion across learning items (mock preview).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {['Alex Morgan', 'Jordan Lee', 'Casey Kim'].map((name, idx) => (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-border">
                          <AvatarFallback style={{ backgroundColor: getAvatarColor(name), color: 'white' }}>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="font-semibold text-lg">{name}</div>
                            <div className="font-bold text-lg">{[68, 42, 81][idx]}%</div>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-amber-500' : 'bg-violet-500')} style={{ width: `${[68, 42, 81][idx]}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <CreateDomainDialog open={isCreateDomainOpen} onOpenChange={setIsCreateDomainOpen} />
      <CreateTopicDialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen} />
      <CreateSubtopicDialog open={isCreateSubtopicOpen} onOpenChange={setIsCreateSubtopicOpen} />
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <Card className="border-2">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground grid place-items-center"><Icon className="h-5.5 w-5.5" style={{ width: 22, height: 22 }} /></div>
          <Award className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div className="text-2xl md:text-3xl font-bold tracking-tight">{value}</div>
        <div className="mt-1"><div className="text-lg font-medium">{label}</div><div className="text-sm text-muted-foreground">{sub}</div></div>
      </CardContent>
    </Card>
  )
}

function EmptyDomains({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-5"><Compass className="h-8 w-8" /></div>
        <h3 className="text-2xl md:text-3xl font-bold mb-2">No learning domains yet</h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">Create your first domain to organize learning topics and resources.</p>
        <Button className="h-12 !text-lg" onClick={onCreate}><Plus className="h-5 w-5 mr-1.5" /> Create domain</Button>
      </CardContent>
    </Card>
  )
}

function EmptyHint() {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <GraduationCap className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold mb-2">No team selected</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">Choose a team to access your learning workspace.</p>
      </CardContent>
    </Card>
  )
}
