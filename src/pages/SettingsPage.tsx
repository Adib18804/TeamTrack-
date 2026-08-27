import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Settings, User as UserIcon, Bell, Palette, Shield, Database, Users as UsersIcon,
  Plus, ChevronRight, Link, Globe2, Eye, EyeOff, Save, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getCurrentTeamId, getUser, getTeam, updateUser, updateTeam } from '@/lib/dataService'
import type { Team, User } from '@/types'
import { getAvatarColor, getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import CreateDomainDialog from '@/components/dialogs/CreateDomainDialog'
import CreateTopicDialog from '@/components/dialogs/CreateTopicDialog'
import CreateSubtopicDialog from '@/components/dialogs/CreateSubtopicDialog'

export default function SettingsPage() {
  const { '*': subpage } = useParams()
  const { currentUser, signOut, refreshCurrentUser } = useAuth()
  const teamId = getCurrentTeamId()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [oldPw, setOldPw] = useState(''); const [newPw, setNewPw] = useState(''); const [confirmPw, setConfirmPw] = useState('')
  const [show, setShow] = useState({ old: false, nw: false, cfm: false })
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [teamDomain, setTeamDomain] = useState('')

  const [isCreateDomainOpen, setIsCreateDomainOpen] = useState(false)
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false)
  const [isCreateSubtopicOpen, setIsCreateSubtopicOpen] = useState(false)

  useEffect(() => {
    if (!currentUser || !teamId) return
    let alive = true
    Promise.all([getUser(currentUser.userId), getTeam(teamId, currentUser.userId)]).then(([u, t]) => {
      if (!alive) return
      setUser(u); setTeam(t)
      if (u) { setName(u.fullName); setAvatar(u.avatar) }
      if (t) { setTeamName(t.name); setTeamDesc(t.description); setTeamDomain(t.domain) }
      setLoading(false)
    })
    return () => { alive = false }
  }, [currentUser, teamId])

  async function saveProfile() {
    if (!currentUser) return
    await updateUser(currentUser.userId, { fullName: name, avatar })
    await refreshCurrentUser()
    toast({ title: 'Profile saved', variant: 'success' })
  }

  async function changePassword() {
    if (newPw.length < 8) return toast({ title: 'Password too short', description: 'Use 8+ characters.', variant: 'destructive' })
    if (newPw !== confirmPw) return toast({ title: 'Passwords do not match', variant: 'destructive' })
    toast({ title: 'Password change', description: 'Demo mode — password not changed. Firebase will handle this in production.', variant: 'warning' })
    setOldPw(''); setNewPw(''); setConfirmPw('')
  }

  async function saveTeam() {
    if (!teamId) return
    await updateTeam(teamId, { name: teamName, description: teamDesc, domain: teamDomain })
    toast({ title: 'Team saved', variant: 'success' })
  }

  const nav = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team', icon: UsersIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'domains', label: 'Domains & Topics', icon: Globe2 },
    { id: 'integrations', label: 'Integrations', icon: Link },
  ]
  const active = subpage || 'profile'

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Settings className="h-4 w-4" />Settings
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Workspace settings</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">Manage your profile, theme, team, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="rounded-2xl border-2 border-border bg-card h-fit p-2 space-y-0.5 sticky top-4">
          {nav.map(n => (
            <a key={n.id} href={`/settings/${n.id}`} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-all',
              active === n.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15' : 'hover:bg-muted'
            )}>
              <n.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              {n.label}
            </a>
          ))}
        </aside>

        <div className="space-y-6 min-w-0">
          <Tabs value={active} className="w-full">
            <TabsList className="hidden h-11 p-1 lg:inline-flex">
              {nav.map(n => <TabsTrigger key={n.id} value={n.id} className="h-9"><n.icon className="h-4 w-4 mr-1.5" />{n.label}</TabsTrigger>)}
            </TabsList>

            <TabsContent value="profile" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader><CardTitle className="text-2xl">Your profile</CardTitle><CardDescription className="text-base mt-1">This info is visible to your teammates.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  {loading ? <div className="space-y-3"><Skeleton className="h-12 w-48" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : (
                    <>
                      <div className="flex items-center gap-5 flex-wrap">
                        <Avatar className="h-20 w-20 border-4 border-border shadow-sm">
                          <AvatarImage src={avatar || undefined} />
                          <AvatarFallback style={{ backgroundColor: user ? getAvatarColor(user.fullName) : '#64748b', color: 'white', fontSize: 26 }}>{user ? getInitials(user.fullName) : '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-lg">{name || '—'}</div>
                          <div className="text-sm text-muted-foreground">{user?.email}</div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{user?.globalRole?.replace('_', ' ')}</Badge>
                            <Button variant="outline" size="sm" className="h-8 text-xs">Change photo</Button>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-lg">Full name</Label>
                          <Input className="h-11 !text-lg" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-lg">Email</Label>
                          <Input className="h-11 !text-lg" value={user?.email} disabled />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-lg">Avatar URL (optional)</Label>
                          <Input className="h-11" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button className="h-11" onClick={saveProfile}><Save className="h-4 w-4 mr-1.5" />Save changes</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader><CardTitle className="text-2xl">Theme</CardTitle><CardDescription className="text-base mt-1">Choose how TeamTrack looks for you.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', desc: 'Premium SaaS look' },
                      { id: 'dark', label: 'Dark', desc: 'Cybersecurity neon' },
                      { id: 'system', label: 'System', desc: 'Follow your OS' },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTheme(t.id as any)} className={cn(
                        'text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md',
                        theme === t.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/40'
                      )}>
                        <div className={cn(
                          'h-28 rounded-xl border-2 mb-4 relative overflow-hidden',
                          t.id === 'dark' ? 'bg-[#0b1120] border-[#1e293b]' : t.id === 'system' ? 'bg-gradient-to-r from-white to-[#0b1120] border-border' : 'bg-white border-border'
                        )}>
                          <div className="absolute inset-3 flex gap-2">
                            <div className={cn('w-1/3 rounded-lg', t.id === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-100')} />
                            <div className="flex-1 space-y-2">
                              <div className={cn('h-6 rounded-md', t.id === 'dark' ? 'bg-slate-800' : 'bg-slate-100')} />
                              <div className={cn('h-20 rounded-md', t.id === 'dark' ? 'bg-slate-800/60' : 'bg-slate-50')} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-lg">{t.label}</div>
                          {theme === t.id && <Badge className="text-xs"><CheckCircle2 className="h-3 w-3 mr-0.5" />Active</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader><CardTitle className="text-2xl">Notifications</CardTitle><CardDescription className="text-base mt-1">Choose what reaches your inbox.</CardDescription></CardHeader>
                <CardContent className="divide-y divide-border">
                  {[
                    { label: 'Task assignments', desc: 'When someone assigns a task to you.', defaultChecked: true },
                    { label: 'Due date reminders', desc: 'Tasks due soon or overdue.', defaultChecked: true },
                    { label: 'Mentions', desc: 'When you\'re @mentioned in chat.', defaultChecked: true },
                    { label: 'Direct messages', desc: 'Real-time DMs from teammates.', defaultChecked: true },
                    { label: 'Announcements', desc: 'Team-wide announcements.', defaultChecked: true },
                    { label: 'Research updates', desc: 'Activity on assigned research items.', defaultChecked: false },
                    { label: 'Weekly digest', desc: 'Roll-up email every Monday.', defaultChecked: false },
                  ].map((n, i) => (
                    <div key={i} className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="font-semibold text-lg">{n.label}</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{n.desc}</div>
                      </div>
                      <Toggle defaultChecked={n.defaultChecked} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-2xl">Team workspace</CardTitle>
                      <CardDescription className="text-base mt-1">Team identity and basic info.</CardDescription>
                    </div>
                    <Button variant="outline" className="h-10" asChild><a href="/members">Manage members <ChevronRight className="h-4 w-4 ml-0.5" /></a></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {loading ? <Skeleton className="h-24 w-full rounded-xl" /> : team ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-lg">Team name</Label>
                          <Input className="h-11 !text-lg" value={teamName} onChange={e => setTeamName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-lg">Domain / Focus</Label>
                          <Input className="h-11 !text-lg" value={teamDomain} onChange={e => setTeamDomain(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-lg">Description</Label>
                          <Textarea rows={3} className="!text-lg resize-y" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2.5">
                        <Button variant="outline" className="h-11" onClick={() => signOut().then(() => location.href = '/sign-in')}>Leave team</Button>
                        <Button className="h-11" onClick={saveTeam}><Save className="h-4 w-4 mr-1.5" />Save team</Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Select a team first.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader><CardTitle className="text-2xl">Change password</CardTitle><CardDescription className="text-base mt-1">Keep your account secure with a strong password.</CardDescription></CardHeader>
                <CardContent className="space-y-4 max-w-lg">
                  <PwField label="Current password" value={oldPw} setValue={setOldPw} show={show.old} toggle={() => setShow(s => ({ ...s, old: !s.old }))} />
                  <PwField label="New password" value={newPw} setValue={setNewPw} show={show.nw} toggle={() => setShow(s => ({ ...s, nw: !s.nw }))} />
                  <PwField label="Confirm new password" value={confirmPw} setValue={setConfirmPw} show={show.cfm} toggle={() => setShow(s => ({ ...s, cfm: !s.cfm }))} />
                  <div className="flex justify-end"><Button className="h-11" onClick={changePassword}><Shield className="h-4 w-4 mr-1.5" />Update password</Button></div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardHeader><CardTitle className="text-2xl">Active sessions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border-2 border-border">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center"><Database className="h-5 w-5" /></div>
                      <div>
                        <div className="font-semibold text-lg">Current browser</div>
                        <div className="text-sm text-muted-foreground">This device · Signed in just now</div>
                      </div>
                    </div>
                    <Badge className="text-xs"><CheckCircle2 className="h-3 w-3 mr-0.5" />Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domains" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-2xl">Domains & Topics</CardTitle>
                      <CardDescription className="text-base mt-1">Team-specific categorization for learning, tasks, and resources.</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="h-11"><Plus className="h-4 w-4 mr-1.5" />New</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="!rounded-lg" onSelect={() => setIsCreateDomainOpen(true)}><Globe2 className="h-4 w-4 mr-2" />Create domain</DropdownMenuItem>
                        <DropdownMenuItem className="!rounded-lg" onSelect={() => setIsCreateTopicOpen(true)}><Palette className="h-4 w-4 mr-2" />Create topic</DropdownMenuItem>
                        <DropdownMenuItem className="!rounded-lg" onSelect={() => setIsCreateSubtopicOpen(true)}><Plus className="h-4 w-4 mr-2" />Create subtopic</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <EmptyModule icon={Globe2} title="Fully dynamic" hint="Create unlimited custom domains + topics here. Demo is seeded with Cybersecurity and AI/ML samples." cta="Open Domains" href="/learning" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-0 space-y-6 pt-6 lg:pt-0">
              <Card className="border-2">
                <CardHeader><CardTitle className="text-2xl">Integrations</CardTitle><CardDescription className="text-base mt-1">Connect TeamTrack to the tools you already use.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Google Workspace', desc: 'SSO and Drive file preview.', badge: 'Soon' },
                    { name: 'GitHub', desc: 'Link commits and PRs to tasks.', badge: 'Soon' },
                    { name: 'Slack', desc: 'Mirror team channels.', badge: 'Soon' },
                    { name: 'Discord', desc: 'Cross-post announcements.', badge: 'Soon' },
                    { name: 'Jira / Linear', desc: 'Two-way issue sync.', badge: 'Planned' },
                  ].map(i => (
                    <div key={i.name} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border-2 border-border">
                      <div>
                        <div className="font-semibold text-lg">{i.name}</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{i.desc}</div>
                      </div>
                      <Badge variant="outline" className="text-xs px-3 py-1">{i.badge}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateDomainDialog open={isCreateDomainOpen} onOpenChange={setIsCreateDomainOpen} />
      <CreateTopicDialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen} />
      <CreateSubtopicDialog open={isCreateSubtopicOpen} onOpenChange={setIsCreateSubtopicOpen} />
    </div>
  )
}

function PwField({ label, value, setValue, show, toggle }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-lg">{label}</Label>
      <div className="relative">
        <Input type={show ? 'text' : 'password'} className="h-11 pr-11" value={value} onChange={e => setValue(e.target.value)} />
        <button type="button" onClick={toggle} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-muted text-muted-foreground">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}

function Toggle({ defaultChecked }: { defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button onClick={() => setOn(!on)} className={cn(
      'inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors shrink-0',
      on ? 'bg-primary' : 'bg-muted'
    )}>
      <span className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  )
}

function EmptyModule({ icon: Icon, title, hint, cta, href }: any) {
  return (
    <div className="p-12 text-center max-w-xl mx-auto">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-muted text-muted-foreground grid place-items-center mb-5"><Icon className="h-7 w-7" /></div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-lg leading-relaxed mb-6">{hint}</p>
      <Button className="h-11" asChild><a href={href}>{cta} <ChevronRight className="h-4 w-4 ml-0.5" /></a></Button>
    </div>
  )
}
