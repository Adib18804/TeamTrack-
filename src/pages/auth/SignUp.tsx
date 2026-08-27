import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Chrome, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[0-9]/, 'Include a number'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(v => v === true, 'You must accept the Terms'),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', terms: false },
  })

  const pw = watch('password', '')
  const strength = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length

  async function onSubmit(data: FormData) {
    setBusy(true)
    try {
      await signUp(data.fullName, data.email, data.password)
      toast({ title: 'Account created', description: 'Welcome to TeamTrack!', variant: 'success' })
      navigate('/onboarding', { replace: true })
    } catch (e: any) {
      toast({ title: 'Registration failed', description: e?.message || 'Please try a different email.', variant: 'destructive' })
    } finally { setBusy(false) }
  }

  async function onGoogle() {
    setGoogleBusy(true)
    try {
      await signInWithGoogle()
      toast({ title: 'Account created', description: 'Signed up with Google.', variant: 'success' })
      navigate('/onboarding', { replace: true })
    } catch (e: any) {
      toast({ title: 'Google signup failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally { setGoogleBusy(false) }
  }

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
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

        <div className="space-y-7 max-w-xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Build stronger teams with TeamTrack.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Manage projects, track learning, collaborate on research, and chat in real-time — all in one beautifully designed workspace.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Multi-tenant team isolation with role-based access',
              'Tasks, kanban, daily logs, and reviews in one place',
              'Real-time team chat, knowledge base & resource library',
              'Contests, research, and learning roadmaps',
            ].map(t => (
              <div key={t} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary grid place-items-center mt-0.5 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-lg">{t}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-base text-muted-foreground">© {new Date().getFullYear()} TeamTrack. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">TeamTrack</div>
          </div>
          <Card>
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Start collaborating with your team in minutes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button type="button" variant="outline" className="w-full h-12 !text-lg" onClick={onGoogle} disabled={googleBusy}>
                {googleBusy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Chrome className="h-5 w-5" />}
                {googleBusy ? 'Creating account…' : 'Continue with Google'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-sm text-muted-foreground">or create with email</span></div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" {...register('fullName')} placeholder="Jordan Smith" />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="you@company.com" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register('password')} placeholder="Create a strong password" />
                  {pw && (
                    <div className="pt-1">
                      <div className="flex gap-1 mb-1.5">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? (strength >= 3 ? 'bg-green-500' : strength === 2 ? 'bg-amber-500' : 'bg-red-500') : 'bg-muted'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Strength: {['Too weak', 'Fair', 'Good', 'Strong'][Math.max(0, strength - 1)] || 'Too weak'}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
                <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                  <input type="checkbox" {...register('terms')} className="mt-1.5 h-4 w-4 rounded border-input accent-primary" />
                  <span className="text-base text-muted-foreground leading-relaxed">
                    I agree to the <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
                  </span>
                </label>
                {errors.terms && <p className="text-sm text-destructive -mt-2">{errors.terms.message}</p>}
                <Button type="submit" className="w-full h-12 !text-lg" disabled={busy}>
                  {busy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Create account'}
                  {!busy && <ArrowRight className="h-5 w-5" />}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="text-center text-base text-muted-foreground">
            Already have an account?{' '}
            <Link to="/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
