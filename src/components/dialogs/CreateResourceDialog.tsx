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
import { useAuth } from '@/contexts/AuthContext'
import { addDoc, query, COLLECTIONS } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { Library } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import type { Resource, Topic } from '@/types'

const schema = z.object({
  title: z.string().min(2, 'Resource title is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  type: z.enum(['course', 'documentation', 'video', 'youtube_playlist', 'lab', 'ctf', 'article', 'research_paper', 'dataset', 'tool', 'repository', 'other']),
  url: z.string().url('Please enter a valid URL'),
  topicId: z.string().optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'easy', 'medium', 'hard', 'expert']),
  estimatedDuration: z.coerce.number().min(0).optional(),
  tagsRaw: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateResourceDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', type: 'documentation', url: '', topicId: '', difficulty: 'medium', estimatedDuration: undefined, tagsRaw: '' },
  })

  useEffect(() => {
    if (open && currentTeamId) {
      query<Topic>(COLLECTIONS.TOPICS, [{ field: 'teamId', op: '==', value: currentTeamId }]).then(setTopics)
    }
  }, [open, currentTeamId])

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      const tags = data.tagsRaw
        ? data.tagsRaw.split(/[\s,;]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const res = await addDoc<Resource>(COLLECTIONS.RESOURCES, {
        teamId: currentTeamId,
        title: data.title,
        description: data.description || '',
        type: data.type,
        url: data.url,
        topicId: data.topicId || undefined,
        difficulty: data.difficulty,
        estimatedDuration: data.estimatedDuration || undefined,
        tags,
        createdBy: currentUser.userId,
      } as any, 'resourceId')

      toast({ title: 'Resource added', description: `${res.title} is now in the library.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to add resource', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl md:text-3xl">Add resource</DialogTitle>
              <DialogDescription className="text-base mt-1">Add curated learning resources or references to the team library.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg">Title</Label>
            <Input id="title" className="h-11" placeholder="e.g. PortSwigger XSS Guide" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-lg">URL Link</Label>
            <Input id="url" className="h-11" placeholder="https://portswigger.net/web-security/cross-site-scripting" {...register('url')} />
            {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-lg">Description</Label>
            <Textarea id="description" rows={2} className="resize-none" placeholder="Provide a brief summary of what this covers." {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-lg">Type</Label>
              <Select defaultValue="documentation" onValueChange={v => register('type').onChange({ target: { value: v } })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="youtube_playlist">YouTube Playlist</SelectItem>
                  <SelectItem value="lab">Lab / Challenge</SelectItem>
                  <SelectItem value="ctf">CTF Challenge</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="research_paper">Research Paper</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                  <SelectItem value="tool">Tool / Utility</SelectItem>
                  <SelectItem value="repository">GitHub Repo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-lg">Difficulty</Label>
              <Select defaultValue="medium" onValueChange={v => register('difficulty').onChange({ target: { value: v } })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-lg">Associated Topic (optional)</Label>
              <Select onValueChange={v => register('topicId').onChange({ target: { value: v } })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Uncategorized" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Uncategorized)</SelectItem>
                  {topics.map(t => <SelectItem key={t.topicId} value={t.topicId}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration" className="text-lg">Duration (hours)</Label>
              <Input id="estimatedDuration" type="number" min="0" step="0.5" className="h-11" placeholder="e.g. 2.5" {...register('estimatedDuration')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagsRaw" className="text-lg">Tags (comma-separated)</Label>
            <Input id="tagsRaw" className="h-11" placeholder="xss, websec, portswigger" {...register('tagsRaw')} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="h-11">Cancel</Button>
            <Button type="submit" disabled={busy} className="h-11 px-6">
              {busy ? 'Adding…' : 'Add resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
