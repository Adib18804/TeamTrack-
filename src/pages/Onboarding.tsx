import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, Plus, ArrowRight, ArrowLeft, CheckCircle2, Users, Link2,
  Shield, GraduationCap, Target, BookOpen, Trophy, Microscope
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createTeam, getInviteByToken, acceptInvite, addTeamMember, listTeamsForUser, getCurrentTeamId } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { cn, getInitials, getAvatarColor } from '@/lib/utils'
import type { Team } from '@/types'

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Set up your workspace' },
  { id: 2, title: 'Workspace', description: 'Create or join a team' },
  { id: 3, title: 'Complete', description: "You're all set!" },
]

export default function Onboarding() {
  const { currentUser, setCurrentTeamId, refreshCurrentUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [mode, setMode] = useState<'options' | 'create' | 'join'>('options')
  const [busy, setBusy] = useState(false)
  const [inviteToken, setInviteToken] = useState('')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    listTeamsForUser(currentUser.userId).then(setUserTeams)
  }, [currentUser])

  function goNext() { setStep(s => Math.min(3, s + 1)) }
  function goBack() { setStep(s => Math.max(1, s - 1)) }

  function handleSelectTeam(t: Team) {
    setCurrentTeamId(t.teamId)
    setStep(3)
  }

  async function handleCreate(data: { name: string; domain: string; description: string }) {
    if (!currentUser) return
    setBusy(true)
    try {
      const team = await createTeam({
        name: data.name, domain: data.domain, description: data.description, createdBy: currentUser.userId,
      })
      await refreshCurrentUser()
      setCurrentTeamId(team.teamId)
      setUserTeams(await listTeamsForUser(currentUser.userId))
      toast({ title: 'Team created', description: `${team.name} is ready.`, variant: 'success' })
      setStep(3)
    } catch (e: any) {
      toast({ title: 'Create team failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally { setBusy(false) }
  }

  async function handleRedeem() {
    if (!currentUser || !inviteToken.trim()) return
    setBusy(true); setInviteError('')
    try {
      const invite = await getInviteByToken(inviteToken.trim())
      if (!invite) throw new Error('Invite not found')
      await acceptInvite(invite.token, currentUser.userId)
      await refreshCurrentUser()
      setCurrentTeamId(invite.teamId)
      setUserTeams(await listTeamsForUser(currentUser.userId))
      toast({ title: 'Invite accepted', description: 'You have joined the team.', variant: 'success' })
      setStep(3)
    } catch (e: any) {
      setInviteError(e?.message || 'Invalid invite link')
    } finally { setBusy(false) }
  }

  function finish() {
    navigate('/dashboard', { replace: true })
  }

  const canCreate = currentUser?.globalRole === 'super_admin' || userTeams.length === 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">TeamTrack</div>
              <div className="text-sm text-muted-foreground">Plan. Learn. Build. Research. Together.</div>
            </div>
          </div>
          <Button variant="ghost" onClick={finish}>Skip →</Button>
        </div>

        <div className="flex items-center justify-between max-w-xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'h-10 w-10 rounded-full grid place-items-center font-bold transition-all',
                  step >= s.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                </div>
                <div className="hidden sm:block">
                  <div className={cn('font-semibold text-base', step >= s.id ? 'text-foreground' : 'text-muted-foreground')}>{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-1 rounded-full mx-2', step > s.id ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            {step === 1 && <Step1 user={currentUser} onNext={goNext} />}
            {step === 2 && (
              <Step2
                userTeams={userTeams}
                mode={mode} setMode={setMode}
                canCreate={canCreate}
                onSelect={handleSelectTeam}
                onCreate={handleCreate}
                inviteToken={inviteToken} setInviteToken={setInviteToken}
                onRedeem={handleRedeem} inviteError={inviteError}
                busy={busy}
                onBack={goBack} onNext={goNext}
              />
            )}
            {step === 3 && <Step3 onFinish={finish} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Step1({ user, onNext }: { user: any; onNext: () => void }) {
  const features = [
    { icon: Target, title: 'Tasks & Projects', desc: 'Roadmaps, kanban, workflows, reviews' },
    { icon: GraduationCap, title: 'Learning', desc: 'Roadmaps, resources, progress tracking' },
    { icon: Microscope, title: 'Research', desc: 'Notes, papers, findings, collaboration' },
    { icon: Users, title: 'Team Chat', desc: 'Channels, threads, reactions, sharing' },
    { icon: Trophy, title: 'Contests', desc: 'Challenges, leaderboards, submissions' },
    { icon: BookOpen, title: 'Knowledge Base', desc: 'Documents, resources, references' },
  ]
  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto text-center space-y-4 pt-4">
        <Badge variant="info" className="text-base px-4 py-1.5">Welcome to TeamTrack 🎉</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Hi {user?.fullName?.split(' ')[0] || 'there'} — let's get your workspace ready.
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          TeamTrack brings planning, learning, building, and research into one secure workspace — so your team can ship faster together.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {features.map(f => (
          <div key={f.title} className="card-premium !rounded-xl !p-5 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0">
              <f.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-lg">{f.title}</div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={onNext}>
          Continue <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

function Step2(props: any) {
  const { userTeams, mode, setMode, canCreate, onSelect, onCreate, inviteToken, setInviteToken, onRedeem, inviteError, busy, onBack, onNext } = props

  const schema = z.object({
    name: z.string().min(2, 'Name required').max(60),
    domain: z.string().min(2, 'Domain required').max(40),
    description: z.string().max(500).optional().or(z.literal('')),
  })
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', domain: '', description: '' },
  })

  return (
    <div className="space-y-6">
      {userTeams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Your teams</h3>
              <p className="text-muted-foreground text-lg mt-1">Pick a team to jump in, or create a new one.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userTeams.map((t: Team) => (
              <button
                key={t.teamId}
                onClick={() => onSelect(t)}
                className="card-premium !rounded-xl !p-5 hover:border-primary/50 hover:shadow-md text-left flex items-start gap-4"
              >
                <div className="h-12 w-12 rounded-xl grid place-items-center font-bold text-white shrink-0" style={{ backgroundColor: getAvatarColor(t.name) }}>
                  {getInitials(t.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-xl truncate">{t.name}</div>
                    <Badge variant="info" className="text-xs px-2 py-0.5">{t.domain}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{t.description || 'No description yet.'}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'options' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {canCreate && (
            <button onClick={() => setMode('create')} className="card-premium !rounded-xl !p-6 text-left group hover:border-primary hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4 group-hover:scale-105 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold">Create a new team</h4>
              <p className="text-muted-foreground mt-1.5 leading-relaxed">Start a new workspace. You'll automatically be added as Team Admin.</p>
            </button>
          )}
          <button onClick={() => setMode('join')} className="card-premium !rounded-xl !p-6 text-left group hover:border-primary hover:shadow-lg transition-all">
            <div className="h-12 w-12 rounded-xl bg-accent text-accent-foreground grid place-items-center mb-4 group-hover:scale-105 transition-transform">
              <Link2 className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-semibold">Join with invite link</h4>
            <p className="text-muted-foreground mt-1.5 leading-relaxed">Redeem an invitation token to join an existing team.</p>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleSubmit(onCreate)} className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Create your team</h3>
            <Button type="button" variant="ghost" onClick={() => setMode('options')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </div>
          <div className="space-y-2">
            <Label className="text-lg">Team name</Label>
            <Input className="h-12 !text-lg" placeholder="My Awesome Team" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{(errors.name as any).message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg">Domain / Focus area</Label>
            <Input className="h-12 !text-lg" placeholder="e.g. Software Engineering, Research, Cybersecurity, AI" {...register('domain')} />
            {errors.domain && <p className="text-sm text-destructive">{(errors.domain as any).message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-lg">Description (optional)</Label>
            <Textarea rows={3} className="!text-lg resize-none" placeholder="What will your team collaborate on?" {...register('description')} />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setMode('options')} className="h-11">Cancel</Button>
            <Button type="submit" disabled={busy} className="h-11">
              {busy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
              {busy ? 'Creating…' : 'Create team'}
            </Button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Join with invite token</h3>
            <Button variant="ghost" onClick={() => setMode('options')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </div>
          <div className="space-y-2">
            <Label className="text-lg">Invitation token or link</Label>
            <Input className="h-12 !text-lg font-mono" placeholder="Paste invite token or full URL" value={inviteToken} onChange={e => setInviteToken(e.target.value)} />
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
          </div>
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setMode('options')} className="h-11">Cancel</Button>
            <Button onClick={onRedeem} disabled={busy || !inviteToken.trim()} className="h-11">
              {busy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
              {busy ? 'Joining…' : 'Redeem invite'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'options' && (
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} className="h-11"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </div>
      )}
    </div>
  )
}

function Step3({ onFinish }: { onFinish: () => void }) {
  const checklist = [
    'Team workspace is created',
    'Default channels (#general, #announcements) are ready',
    'Domains, topics, tasks, and chat modules are live',
    'Invite your team from Team Members page',
  ]
  return (
    <div className="space-y-8 text-center py-6">
      <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 grid place-items-center shadow-lg shadow-green-500/20 animate-fade-in">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">You're all set! 🎉</h2>
        <p className="text-xl text-muted-foreground leading-relaxed">Your TeamTrack workspace is ready. Start adding members, planning projects, and building together.</p>
      </div>
      <div className="max-w-lg mx-auto space-y-3 text-left pt-2">
        {checklist.map(item => (
          <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-muted/40">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-lg">{item}</span>
          </div>
        ))}
      </div>
      <div className="pt-4">
        <Button size="lg" onClick={onFinish} className="h-12 px-8 !text-lg">
          Go to dashboard <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
