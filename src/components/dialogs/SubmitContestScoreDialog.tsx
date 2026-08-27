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
import { Star } from 'lucide-react'
import type { ContestSubmission } from '@/types'

const schema = z.object({
  score: z.coerce.number().min(0).max(100, 'Score must be between 0 and 100'),
  writeup: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void; contestId: string }

export default function SubmitContestScoreDialog({ open, onOpenChange, contestId }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { score: 0, writeup: '' },
  })

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser || !contestId) return
    setBusy(true)
    try {
      await addDoc<ContestSubmission>(COLLECTIONS.CONTEST_SUBMISSIONS, {
        contestId,
        teamId: currentTeamId,
        userId: currentUser.userId,
        score: data.score,
        writeup: data.writeup || '',
        evidence: [],
      } as any, 'submissionId')

      toast({ title: 'Score submitted', description: `Your score of ${data.score} was recorded!`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to submit score', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/15 text-yellow-500 grid place-items-center">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Submit Score</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">Submit a score or writeup for this contest.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="score">Score (0-100)</Label>
            <Input id="score" type="number" className="h-11" placeholder="e.g. 95" {...register('score')} />
            {errors.score && <p className="text-sm text-destructive">{errors.score.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="writeup">Writeup / Feedback (optional)</Label>
            <Textarea id="writeup" rows={4} className="resize-none" placeholder="Provide feedback or a writeup of the submission..." {...register('writeup')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit score'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
