import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { query, COLLECTIONS, onSnapshot, getCurrentTeamId } from '@/lib/dataService'
import type { ChatChannel, Project, Domain, Topic } from '@/types'
import {
  MessageSquare, Hash, Megaphone, Folder, FolderArchive,
  GraduationCap, Compass, Trophy, Microscope, ChevronRight, Plus, Inbox
} from 'lucide-react'
import { cn, formatStatusLabel, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import CreateChannelDialog from '@/components/dialogs/CreateChannelDialog'

interface Props {
  className?: string
}

export default function SecondarySidebar({ className }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const teamId = getCurrentTeamId()
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return
    let alive = true
    const q = (c: string, idField: string) => query<any>(c, [{ field: 'teamId', op: '==', value: teamId }])
    Promise.all([
      q(COLLECTIONS.CHANNELS, 'channelId'),
      q(COLLECTIONS.PROJECTS, 'projectId'),
      q(COLLECTIONS.DOMAINS, 'domainId'),
      q(COLLECTIONS.TOPICS, 'topicId'),
    ]).then(([c, p, d, t]) => {
      if (!alive) return
      setChannels(c); setProjects(p); setDomains(d); setTopics(t)
    })
    const unsubs = [
      onSnapshot<ChatChannel>(COLLECTIONS.CHANNELS, data => setChannels(data.filter(x => x.teamId === teamId))),
      onSnapshot<Project>(COLLECTIONS.PROJECTS, data => setProjects(data.filter(x => x.teamId === teamId))),
      onSnapshot<Domain>(COLLECTIONS.DOMAINS, data => setDomains(data.filter(x => x.teamId === teamId))),
      onSnapshot<Topic>(COLLECTIONS.TOPICS, data => setTopics(data.filter(x => x.teamId === teamId))),
    ]
    return () => { alive = false; unsubs.forEach(u => u()) }
  }, [teamId, location.pathname])

  const path = location.pathname
  const section = path.split('/')[1] || 'dashboard'

  if (!teamId) {
    return (
      <aside className={cn('hidden lg:flex w-64 shrink-0 border-r-2 border-border bg-muted/20 flex-col p-5', className)}>
        <div className="text-sm text-muted-foreground">Select a team to explore.</div>
      </aside>
    )
  }

  const sections: Record<string, React.ReactNode> = {
    chat: (
      <SidebarGroup
        title="Channels"
        action={<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setIsCreateChannelOpen(true)}><Plus className="h-4 w-4" /></Button>}
      >
        {channels.map(ch => (
          <SidebarItem
            key={ch.channelId}
            to={`/chat?channel=${ch.channelId}`}
            icon={ch.type === 'announcement' ? Megaphone : Hash}
            label={ch.name}
            badge={ch.type === 'announcement' ? '🔔' : undefined}
          />
        ))}
        {channels.length === 0 && <EmptyHint text="No channels yet" />}
      </SidebarGroup>
    ),
    projects: (
      <>
        <SidebarGroup title="Active Projects">
          {projects.filter(p => p.status === 'active').map(p => (
            <SidebarItem key={p.projectId} to={`/projects/${p.projectId}`} icon={Folder} label={p.name}>
              <ProgressBar value={p.progress} />
            </SidebarItem>
          ))}
          {projects.filter(p => p.status === 'active').length === 0 && <EmptyHint text="No active projects" />}
        </SidebarGroup>
        <SidebarGroup title="Other Projects">
          {projects.filter(p => p.status !== 'active').slice(0, 8).map(p => (
            <SidebarItem key={p.projectId} to={`/projects/${p.projectId}`} icon={FolderArchive} label={p.name}>
              <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full', getStatusColor(p.status))}>
                {formatStatusLabel(p.status)}
              </span>
            </SidebarItem>
          ))}
        </SidebarGroup>
      </>
    ),
    learning: (
      <>
        <SidebarGroup
          title="Domains"
          action={<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><Plus className="h-4 w-4" /></Button>}
        >
          {domains.map(d => (
            <SidebarItem key={d.domainId} to={`/learning/domains/${d.domainId}`} icon={Compass} label={d.name}>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            </SidebarItem>
          ))}
          {domains.length === 0 && <EmptyHint text="No domains yet" />}
        </SidebarGroup>
        <SidebarGroup title="Topics">
          {topics.slice(0, 12).map(t => (
            <SidebarItem key={t.topicId} to={`/learning/topics/${t.topicId}`} icon={GraduationCap} label={t.name}>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
            </SidebarItem>
          ))}
        </SidebarGroup>
      </>
    ),
    tasks: (
      <SidebarGroup title="Quick Filters">
        <SidebarItem to="/tasks?view=kanban" icon={MessageSquare} label="Kanban view" />
        <SidebarItem to="/tasks?view=list" icon={MessageSquare} label="List view" />
        <SidebarItem to="/tasks?view=table" icon={MessageSquare} label="Table view" />
        <SidebarItem to="/tasks?assignee=me" icon={Inbox} label="Assigned to me" />
      </SidebarGroup>
    ),
    contests: (
      <SidebarGroup title="Categories">
        <SidebarItem to="/contests?status=upcoming" icon={Trophy} label="Upcoming" />
        <SidebarItem to="/contests?status=active" icon={Trophy} label="Ongoing" />
        <SidebarItem to="/contests?status=completed" icon={Trophy} label="Completed" />
        <SidebarItem to="/contests/leaderboard" icon={Trophy} label="Leaderboards" />
      </SidebarGroup>
    ),
    research: (
      <SidebarGroup title="Workspaces">
        <SidebarItem to="/research?status=idea" icon={Microscope} label="Ideas" />
        <SidebarItem to="/research?status=planning" icon={Microscope} label="Planning" />
        <SidebarItem to="/research?status=experimentation" icon={Microscope} label="Experiments" />
        <SidebarItem to="/research?status=writing" icon={Microscope} label="Writing" />
      </SidebarGroup>
    ),
  }

  return (
    <aside className={cn(
      'hidden lg:flex w-64 shrink-0 border-r-2 border-border bg-muted/20 flex-col overflow-hidden h-[calc(100vh-72px)] sticky top-[72px]',
      className
    )}>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-6">
        {sections[section] || (
          <div className="text-sm text-muted-foreground">
            <div className="font-semibold text-base text-foreground mb-3">Overview</div>
            <p className="leading-relaxed">Switch to Chat, Projects, or Learning to see contextual navigation.</p>
          </div>
        )}
      </div>

      {section === 'chat' && (
        <CreateChannelDialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen} />
      )}
    </aside>
  )
}

function SidebarGroup({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">{title}</h4>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function SidebarItem({ to, icon: Icon, label, children, badge }: { to: string; icon: any; label: string; children?: React.ReactNode; badge?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium text-sidebar-foreground hover:bg-background hover:shadow-sm transition-all"
    >
      <Icon className="h-4.5 w-4.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" style={{ width: 18, height: 18 }} />
      <span className="truncate flex-1 text-left">{label}</span>
      {badge && <span className="text-xs">{badge}</span>}
      {children}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden shrink-0">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <div className="px-3 py-3 text-sm text-muted-foreground italic">{text}</div>
}
