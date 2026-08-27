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
import { Trophy, Plus, X } from 'lucide-react'
import type { Contest } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required').max(80),
  description: z.string().min(10, 'Description needs to be at least 10 chars'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateContestDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [catInput, setCatInput] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', startDate: '', endDate: '' },
  })

  function addCategory() {
    if (!catInput.trim()) return
    setCategories([...categories, catInput.trim()])
    setCatInput('')
  }

  function removeCategory(idx: number) {
    setCategories(categories.filter((_, i) => i !== idx))
  }

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      await addDoc<Contest>(COLLECTIONS.CONTESTS, {
        teamId: currentTeamId,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        participants: [],
        categories: categories.length > 0 ? categories : ['General'],
        status: 'upcoming',
        points: {},
        createdBy: currentUser.userId,
      } as any, 'contestId')

      toast({ title: 'Contest created', description: `${data.name} is now upcoming.`, variant: 'success' })
      reset()
      setCategories([])
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create contest', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 grid place-items-center">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Create Contest / Hackathon</DialogTitle>
              <DialogDescription className="text-base mt-1">Host a challenge or hackathon for your team.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Contest Name</Label>
            <Input id="name" className="h-11" placeholder="e.g. Summer Hackathon 2026" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} className="resize-none" placeholder="What is this contest about?" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input type="datetime-local" className="h-11" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input type="datetime-local" className="h-11" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories / Tracks</Label>
            <div className="flex gap-2">
              <Input
                className="h-11"
                placeholder="e.g. Web3, AI, Best UI"
                value={catInput}
                onChange={e => setCatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
              />
              <Button type="button" onClick={addCategory} className="h-11 shrink-0"><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-xl border border-border">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-sm">
                    <span>{cat}</span>
                    <button type="button" onClick={() => removeCategory(i)} className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create contest'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
