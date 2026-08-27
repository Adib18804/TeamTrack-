import { useEffect, useMemo, useState } from 'react'
import {
  Library, Search, Plus, Filter, ExternalLink, Bookmark, BookmarkCheck,
  BookOpen, Video, FileText, Github, Database, Wrench, Trophy, BookMarked,
  GraduationCap, PlayCircle, Archive, SortAsc, Tag, ChevronRight, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { COLLECTIONS, getCurrentTeamId, onSnapshot, query } from '@/lib/dataService'
import type { Resource, ResourceType, TaskDifficulty } from '@/types'
import { cn, formatDate, truncateText } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import CreateResourceDialog from '@/components/dialogs/CreateResourceDialog'

const RESOURCE_TYPES: ResourceType[] = ['course', 'documentation', 'video', 'youtube_playlist', 'lab', 'ctf', 'article', 'research_paper', 'dataset', 'tool', 'repository', 'other']
const DIFFICULTIES: TaskDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert']

const TYPE_META: Record<ResourceType, { label: string; icon: any; color: string }> = {
  course: { label: 'Course', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  documentation: { label: 'Docs', icon: FileText, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  video: { label: 'Video', icon: PlayCircle, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  youtube_playlist: { label: 'Playlist', icon: Video, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  lab: { label: 'Lab', icon: BookOpen, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  ctf: { label: 'CTF', icon: Trophy, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  article: { label: 'Article', icon: FileText, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  research_paper: { label: 'Paper', icon: BookMarked, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  dataset: { label: 'Dataset', icon: Database, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  tool: { label: 'Tool', icon: Wrench, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  repository: { label: 'Repo', icon: Github, color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
  other: { label: 'Other', icon: Library, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

const DIFF_COLOR: Record<TaskDifficulty, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  easy: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  hard: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function ResourcesPage() {
  const teamId = getCurrentTeamId()
  const { toast } = useToast()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return
    let alive = true
    query<Resource>(COLLECTIONS.RESOURCES, [{ field: 'teamId', op: '==', value: teamId }], { field: 'createdAt', direction: 'desc' })
      .then(list => { if (alive) { setResources(list); setLoading(false) } })
    const unsub = onSnapshot<Resource>(COLLECTIONS.RESOURCES, d => {
      if (!alive) return
      setResources(d.filter(x => x.teamId === teamId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    })
    return () => { alive = false; unsub() }
  }, [teamId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = resources.filter(r => {
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.tags.join(' ').toLowerCase().includes(q)) return false
      if (type !== 'all' && r.type !== type) return false
      if (difficulty !== 'all' && r.difficulty !== difficulty) return false
      return true
    })
    switch (sort) {
      case 'newest': list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
      case 'oldest': list = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break
      case 'easy': list = [...list].sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty)); break
      case 'hard': list = [...list].sort((a, b) => DIFFICULTIES.indexOf(b.difficulty) - DIFFICULTIES.indexOf(a.difficulty)); break
      case 'title': list = [...list].sort((a, b) => a.title.localeCompare(b.title)); break
    }
    return list
  }, [resources, search, type, difficulty, sort])

  const stats = useMemo(() => ({
    total: resources.length,
    types: RESOURCE_TYPES.slice(0, 6).map(t => ({ t, n: resources.filter(r => r.type === t).length })).filter(x => x.n > 0),
  }), [resources])

  function toggleBookmark(id: string) {
    const next = new Set(bookmarks)
    if (next.has(id)) { next.delete(id); toast({ description: 'Removed from bookmarks' }) }
    else { next.add(id); toast({ description: 'Saved to bookmarks', variant: 'success' }) }
    setBookmarks(next)
  }

  if (!teamId) return <EmptyHint />

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Resource Library</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Courses, papers, tools, videos, and more — curated for your team.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-sm px-3 py-1">{stats.total} resources</Badge>
          <Button className="h-11" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add resource</Button>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-5 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input className="h-11 pl-11" placeholder="Search by title, description, or tag…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 w-[150px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{TYPE_META[t].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-11 w-[150px]"><Star className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 w-[150px]"><SortAsc className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="easy">Easiest first</SelectItem>
                <SelectItem value="hard">Hardest first</SelectItem>
                <SelectItem value="title">By title A→Z</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={view} onValueChange={v => setView(v as any)} className="ml-auto">
              <TabsList className="h-11 p-1">
                <TabsTrigger value="grid" className="h-9 text-sm">Grid</TabsTrigger>
                <TabsTrigger value="list" className="h-9 text-sm">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {stats.types.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          <Badge variant="outline" className="text-sm px-3 py-1.5 cursor-pointer hover:bg-accent transition-colors" onClick={() => setType('all')}>All ({stats.total})</Badge>
          {stats.types.map(({ t, n }) => {
            const meta = TYPE_META[t]
            const active = type === t
            return (
              <button key={t} onClick={() => setType(active ? 'all' : t)} className={cn(
                'inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all',
                active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted'
              )}>
                <meta.icon className="h-4 w-4" />
                {meta.label} <span className="text-muted-foreground">({n})</span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onClear={() => { setSearch(''); setType('all'); setDifficulty('all') }} onCreate={() => setIsCreateOpen(true)} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(r => <ResourceCard key={r.resourceId} r={r} meta={TYPE_META[r.type]} bookmarked={bookmarks.has(r.resourceId)} onBookmark={() => toggleBookmark(r.resourceId)} />)}
        </div>
      ) : (
        <Card className="border-2 overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(r => {
              const meta = TYPE_META[r.type]
              const Icon = meta.icon
              return (
                <a key={r.resourceId} href={r.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-4 p-5 hover:bg-muted/40 transition-colors group">
                  <div className={cn('h-12 w-12 rounded-xl grid place-items-center shrink-0', meta.color)}><Icon className="h-6 w-6" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg md:text-xl font-semibold truncate group-hover:text-primary transition-colors">{r.title}</h3>
                      <Badge className="text-xs border-0 capitalize" variant="outline">{meta.label}</Badge>
                      <Badge className={cn('text-xs border-0 capitalize', DIFF_COLOR[r.difficulty])}>{r.difficulty}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{r.description}</p>
                  </div>
                  <div className="hidden md:flex flex-wrap gap-1.5 max-w-xs justify-end">
                    {r.tags.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>)}
                  </div>
                  <div className="hidden lg:block text-sm text-muted-foreground shrink-0 w-32 text-right">{formatDate(r.createdAt)}</div>
                  <button onClick={(e) => { e.preventDefault(); toggleBookmark(r.resourceId) }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors">
                    {bookmarks.has(r.resourceId) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </button>
                </a>
              )
            })}
          </div>
        </Card>
      )}

      <CreateResourceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}

function ResourceCard({ r, meta, bookmarked, onBookmark }: { r: Resource; meta: any; bookmarked: boolean; onBookmark: () => void }) {
  const Icon = meta.icon
  return (
    <a href={r.url} target="_blank" rel="noreferrer noopener" className="card-premium !rounded-2xl !p-0 overflow-hidden group hover:shadow-lg transition-all relative flex flex-col h-full">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className={cn('h-12 w-12 rounded-xl grid place-items-center shrink-0 shadow-sm', meta.color)}><Icon className="h-6 w-6" /></div>
          <button onClick={(e) => { e.preventDefault(); onBookmark() }} className={cn('p-2 rounded-lg hover:bg-muted transition-colors shrink-0', bookmarked ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500')}>
            {bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge className={cn('text-xs border-0 capitalize', DIFF_COLOR[r.difficulty])}>{r.difficulty}</Badge>
          <Badge className="text-xs border-0" variant="outline">{meta.label}</Badge>
          {r.estimatedDuration && <Badge variant="secondary" className="text-xs">{r.estimatedDuration}h</Badge>}
        </div>
        <h3 className="text-xl font-bold tracking-tight line-clamp-2 group-hover:text-primary transition-colors leading-snug">{r.title}</h3>
        <p className="text-base text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{r.description || 'No description.'}</p>
        {r.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {r.tags.slice(0, 4).map(tag => <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1"><Tag className="h-3 w-3 mr-1 inline opacity-70" />{tag}</Badge>)}
          </div>
        )}
      </div>
      <div className="mt-auto px-6 py-4 border-t-2 border-border/60 flex items-center justify-between">
        <div className="text-sm text-muted-foreground flex items-center gap-1">{formatDate(r.createdAt)}</div>
        <div className="inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Open <ExternalLink className="h-4 w-4" /> <ChevronRight className="h-4 w-4 -ml-1.5" />
        </div>
      </div>
    </a>
  )
}

function EmptyState({ onClear, onCreate }: { onClear: () => void, onCreate: () => void }) {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <Library className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h3 className="text-2xl md:text-3xl font-bold mb-2">No matching resources</h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">Try adjusting filters, search for a different keyword, or add a new resource to the library.</p>
        <div className="flex items-center gap-2.5 justify-center">
          <Button variant="outline" className="h-11" onClick={onClear}>Clear filters</Button>
          <Button className="h-11" onClick={onCreate}><Plus className="h-4 w-4 mr-1.5" />Add resource</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyHint() {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <Library className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold mb-2">No team selected</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">Choose a team to see your resource library.</p>
      </CardContent>
    </Card>
  )
}
