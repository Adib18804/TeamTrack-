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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { addDoc, COLLECTIONS } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { Hash } from 'lucide-react'
import type { ChatChannel } from '@/types'
import { generateSlug } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name is required').max(40),
  description: z.string().max(200).optional().or(z.literal('')),
  type: z.enum(['general', 'topic', 'project', 'research', 'announcement']),
  isPrivate: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateChannelDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', type: 'general', isPrivate: false },
  })
  
  const isPrivate = watch('isPrivate')

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      await addDoc<ChatChannel>(COLLECTIONS.CHANNELS, {
        teamId: currentTeamId,
        name: generateSlug(data.name).replace(/-[a-z0-9]{6}$/, ''), // basic slug without random suffix for channels
        description: data.description || '',
        type: data.type,
        isPrivate: data.isPrivate,
      } as any, 'channelId')

      toast({ title: 'Channel created', description: `#${data.name} is ready.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create channel', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Create channel</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">Channels are where your team communicates.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Channel name</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" className="h-11 pl-9" placeholder="e.g. frontend-team" {...register('name')} />
            </div>
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={2} className="resize-none" placeholder="What is this channel about?" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select onValueChange={(val: any) => setValue('type', val)} defaultValue="general">
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="topic">Topic-specific</SelectItem>
                <SelectItem value="project">Project-specific</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="announcement">Announcement (Read-only for members)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
                type="checkbox" 
                id="isPrivate" 
                className="h-4 w-4 rounded border-input"
                checked={isPrivate}
                onChange={(e) => setValue('isPrivate', e.target.checked)}
            />
            <Label htmlFor="isPrivate" className="font-normal cursor-pointer">Make private (only invited members can view)</Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
