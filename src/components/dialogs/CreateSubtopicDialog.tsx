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
import { Layers } from 'lucide-react'
import type { Subtopic, Topic } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required').max(80),
  description: z.string().max(500).optional().or(z.literal('')),
  topicId: z.string().min(1, 'Topic is required'),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateSubtopicDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', topicId: '' },
  })

  useEffect(() => {
    if (open && currentTeamId) {
      query<Topic>(COLLECTIONS.TOPICS, [{ field: 'teamId', op: '==', value: currentTeamId }])
        .then(setTopics)
    }
  }, [open, currentTeamId])

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      await addDoc<Subtopic>(COLLECTIONS.SUBTOPICS, {
        teamId: currentTeamId,
        topicId: data.topicId,
        name: data.name,
        description: data.description || '',
        icon: 'Layers',
        color: 'text-indigo-500',
        status: 'active',
      } as any, 'subtopicId')

      toast({ title: 'Subtopic created', description: `${data.name} has been added.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create subtopic', description: e?.message || 'Please try again.', variant: 'destructive' })
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
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Create new subtopic</DialogTitle>
              <DialogDescription className="text-base mt-1">Break down a topic into smaller sections.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="topicId">Parent Topic</Label>
            <Select onValueChange={(val) => setValue('topicId', val)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map(t => (
                  <SelectItem key={t.topicId} value={t.topicId}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.topicId && <p className="text-sm text-destructive">{errors.topicId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Subtopic name</Label>
            <Input id="name" className="h-11" placeholder="e.g. State Management" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={3} className="resize-none" placeholder="What does this subtopic cover?" {...register('description')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create subtopic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
