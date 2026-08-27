import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { createTeam, addTeamMember } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { Palette, Users, Sparkles } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(60),
  description: z.string().max(500).optional().or(z.literal('')),
  domain: z.string().min(2, 'Domain is required').max(40),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateTeamDialog({ open, onOpenChange }: Props) {
  const { currentUser, setCurrentTeamId, refreshCurrentUser } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', domain: '' },
  })

  async function onSubmit(data: FormData) {
    if (!currentUser) return
    setBusy(true)
    try {
      const team = await createTeam({
        name: data.name,
        description: data.description || '',
        domain: data.domain,
        createdBy: currentUser.userId,
      })
      await refreshCurrentUser()
      setCurrentTeamId(team.teamId)
      toast({ title: 'Team created', description: `Welcome to ${team.name}!`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create team', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl md:text-3xl">Create a new team</DialogTitle>
              <DialogDescription className="text-base md:text-lg mt-1">Set up a new workspace for your organization or project.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label htmlFor="name" className="text-lg">Team name</Label>
              </div>
              <Input id="name" className="h-12 !text-lg" placeholder="e.g. Cybersecurity Research" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <Label htmlFor="domain" className="text-lg">Domain / Focus area</Label>
              </div>
              <Input id="domain" className="h-12 !text-lg" placeholder="e.g. Artificial Intelligence, Research, Software Engineering" {...register('domain')} />
              {errors.domain && <p className="text-sm text-destructive">{errors.domain.message}</p>}
              <p className="text-sm text-muted-foreground leading-relaxed">You can always customize topics and subtopics later from team settings.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-lg">Description (optional)</Label>
              <Textarea id="description" rows={3} className="!text-lg resize-none" placeholder="What will your team work on?" {...register('description')} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2.5 sm:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="h-11 !text-base">Cancel</Button>
            <Button type="submit" disabled={busy} className="h-11 !text-base px-6">
              {busy ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : null}
              {busy ? 'Creating team…' : 'Create team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
