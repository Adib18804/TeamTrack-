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
import { Compass } from 'lucide-react'
import type { Domain } from '@/types'

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
]

const schema = z.object({
  name: z.string().min(2, 'Domain name is required').max(50),
  description: z.string().max(300).optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateDomainDialog({ open, onOpenChange }: Props) {
  const { currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [color, setColor] = useState(PRESET_COLORS[0])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  async function onSubmit(data: FormData) {
    if (!currentTeamId) return
    setBusy(true)
    try {
      const dom = await addDoc<Domain>(COLLECTIONS.DOMAINS, {
        teamId: currentTeamId,
        name: data.name,
        description: data.description || '',
        icon: 'compass',
        color,
        status: 'active',
      } as any, 'domainId')

      toast({ title: 'Domain created', description: `${dom.name} focus area is live.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create domain', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Create domain</DialogTitle>
              <DialogDescription className="text-base mt-1">Set up a dynamic focus area / sector for your team.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg">Domain name</Label>
            <Input id="name" className="h-11" placeholder="e.g. Artificial Intelligence" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-lg">Description</Label>
            <Textarea id="description" rows={3} className="resize-none" placeholder="Scope or general objectives of this domain…" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label className="text-lg">Color Theme</Label>
            <div className="flex flex-wrap gap-2.5 pt-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 border-background shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="h-11">Cancel</Button>
            <Button type="submit" disabled={busy} className="h-11 px-6">
              {busy ? 'Creating…' : 'Create domain'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
