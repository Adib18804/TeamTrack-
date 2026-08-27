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
import { addDoc, COLLECTIONS } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { Microscope } from 'lucide-react'
import type { ResearchItem } from '@/types'

const schema = z.object({
  title: z.string().min(2, 'Title is required').max(100),
  researchQuestion: z.string().min(10, 'Research question is required'),
  description: z.string().min(10, 'Description is required'),
  hypothesis: z.string().optional().or(z.literal('')),
  methodology: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateResearchDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', researchQuestion: '', description: '', hypothesis: '', methodology: '' },
  })

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      await addDoc<ResearchItem>(COLLECTIONS.RESEARCH, {
        teamId: currentTeamId,
        title: data.title,
        researchQuestion: data.researchQuestion,
        description: data.description,
        hypothesis: data.hypothesis || '',
        methodology: data.methodology || '',
        assignedMembers: [currentUser.userId],
        relatedPapers: [],
        resources: [],
        datasetLinks: [],
        findings: '',
        researchGaps: '',
        status: 'idea',
        notes: '',
        attachments: [],
        createdBy: currentUser.userId,
      } as any, 'researchId')

      toast({ title: 'Research created', description: `${data.title} has been added.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create research', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-500 grid place-items-center">
              <Microscope className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Start new research</DialogTitle>
              <DialogDescription className="text-base mt-1">Define your hypothesis, methodology, and tracking.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Research Title</Label>
            <Input id="title" className="h-11" placeholder="e.g. Evaluating Quantum Cryptography Algorithms" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="researchQuestion">Core Research Question</Label>
            <Input id="researchQuestion" className="h-11" placeholder="What specific problem are you solving?" {...register('researchQuestion')} />
            {errors.researchQuestion && <p className="text-sm text-destructive">{errors.researchQuestion.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Abstract / Description</Label>
            <Textarea id="description" rows={3} className="resize-none" placeholder="Provide a summary of the research..." {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hypothesis">Hypothesis (optional)</Label>
            <Textarea id="hypothesis" rows={2} className="resize-none" placeholder="What do you expect to find?" {...register('hypothesis')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="methodology">Methodology (optional)</Label>
            <Textarea id="methodology" rows={2} className="resize-none" placeholder="How will you conduct this research?" {...register('methodology')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Start research'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
