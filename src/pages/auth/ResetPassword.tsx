import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Sparkles, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setBusy(true)
    try {
      await resetPassword(data.email)
      setSent(true)
      toast({ title: 'Email sent', description: 'Check your inbox for a reset link.', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Reset failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link to="/sign-in" className="p-2 rounded-lg hover:bg-muted transition-colors -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">TeamTrack</div>
          </div>
        </div>
        <Card>
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>We'll email you a secure link to reset it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {sent ? (
              <div className="card-premium !rounded-xl space-y-3 text-center py-8">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 grid place-items-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold">Check your inbox</h3>
                <p className="text-lg text-muted-foreground">If an account exists with that email, we've sent a password reset link.</p>
                <Link to="/sign-in" className="inline-block btn-primary mt-3">Return to sign in</Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-11" {...register('email')} placeholder="you@company.com" />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full h-12 !text-lg" disabled={busy}>
                  {busy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Send reset link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="text-center text-base text-muted-foreground">
          Remembered it?{' '}
          <Link to="/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
