import { useEffect, useState } from 'react'
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { addDoc, COLLECTIONS, query } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { LayoutGrid } from 'lucide-react'
import type { Topic, Domain } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required').max(80),
  description: z.string().max(500).optional().or(z.literal('')),
  domainId: z.string().min(1, 'Domain is required'),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateTopicDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [domains, setDomains] = useState<Domain[]>([])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', domainId: '' },
  })

  useEffect(() => {
    if (open && currentTeamId) {
      query<Domain>(COLLECTIONS.DOMAINS, [{ field: 'teamId', op: '==', value: currentTeamId }])
        .then(setDomains)
    }
  }, [open, currentTeamId])

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      await addDoc<Topic>(COLLECTIONS.TOPICS, {
        teamId: currentTeamId,
        domainId: data.domainId,
        name: data.name,
        description: data.description || '',
        icon: 'Book',
        color: 'text-blue-500',
        status: 'active',
      } as any, 'topicId')

      toast({ title: 'Topic created', description: `${data.name} has been added.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create topic', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Create new topic</DialogTitle>
              <DialogDescription className="text-base mt-1">Organize learning resources and tasks under a topic.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="domainId">Domain</Label>
            <Select onValueChange={(val) => setValue('domainId', val)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map(d => (
                  <SelectItem key={d.domainId} value={d.domainId}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.domainId && <p className="text-sm text-destructive">{errors.domainId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Topic name</Label>
            <Input id="name" className="h-11" placeholder="e.g. React Patterns" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={3} className="resize-none" placeholder="What does this topic cover?" {...register('description')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create topic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
