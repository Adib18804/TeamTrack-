import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Github, Chrome, ArrowRight, Sparkles, Shield, Target, BookOpen, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function SignIn() {
  const { signIn, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/dashboard'
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'adib@teamtrack.dev', password: 'AdibAdmin123' },
  })

  async function onSubmit(data: FormData) {
    setBusy(true)
    try {
      await signIn(data.email, data.password)
      toast({ title: 'Welcome back', description: 'Signed in successfully.', variant: 'success' })
      navigate(from, { replace: true })
    } catch (e: any) {
      toast({ title: 'Sign in failed', description: e?.message || 'Invalid credentials.', variant: 'destructive' })
    } finally { setBusy(false) }
  }

  async function onGoogle() {
    setGoogleBusy(true)
    try {
      await signInWithGoogle()
      toast({ title: 'Welcome', description: 'Signed in with Google.', variant: 'success' })
      navigate(from, { replace: true })
    } catch (e: any) {
      toast({ title: 'Google sign in failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally { setGoogleBusy(false) }
  }

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 border-r-2 border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">TeamTrack</div>
            <div className="text-sm text-muted-foreground">Plan. Learn. Build. Research. Together.</div>
          </div>
        </div>

        <div className="space-y-8 max-w-lg animate-fade-in">
          <Badge variant="info" className="text-base px-4 py-1.5">New · Multi-tenant workspace</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            One platform for every team's big ideas.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Plan projects, learn new skills, manage tasks, run research, and chat with your team — all in a secure, modern workspace.
          </p>
          <div className="grid grid-cols-2 gap-5 pt-4">
            {[
              { icon: Target, label: 'Tasks & Projects', caption: 'Kanban, roadmaps, reviews' },
              { icon: BookOpen, label: 'Learning', caption: 'Roadmaps, resources, progress' },
              { icon: Shield, label: 'Research', caption: 'Notes, papers, collaboration' },
              { icon: Users, label: 'Real-time chat', caption: 'Channels, threads, reactions' },
            ].map(f => (
              <div key={f.label} className="card-premium !p-4 !rounded-xl">
                <div className={cn('h-10 w-10 rounded-lg grid place-items-center mb-3', 'bg-accent text-accent-foreground')}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-lg font-semibold">{f.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.caption}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-base text-muted-foreground">
          <div className="flex -space-x-2">
            {['AM', 'JL', 'CK', 'RP'].map((n, i) => (
              <div key={i} className="h-9 w-9 rounded-full bg-primary/20 text-primary grid place-items-center font-semibold text-sm border-2 border-sidebar">
                {n}
              </div>
            ))}
          </div>
          <span>Trusted by security, AI, and research teams worldwide.</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">TeamTrack</div>
          </div>
          <Card>
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle>Sign in to TeamTrack</CardTitle>
              <CardDescription>Welcome back — pick up where you left off.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button type="button" variant="outline" className="w-full h-12 !text-lg" onClick={onGoogle} disabled={googleBusy}>
                {googleBusy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Chrome className="h-5 w-5" />}
                {googleBusy ? 'Signing in…' : 'Continue with Google'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-sm text-muted-foreground">or continue with email</span></div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" autoComplete="email" {...register('email')} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/reset-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full h-12 !text-lg" disabled={busy}>
                  {busy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Sign in'}
                  {!busy && <ArrowRight className="h-5 w-5" />}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="text-center text-base text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/sign-up" className="font-semibold text-primary hover:underline">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
