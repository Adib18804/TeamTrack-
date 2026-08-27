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
import { addDoc, listTeamMembers, COLLECTIONS } from '@/lib/dataService'
import { useToast } from '@/hooks/use-toast'
import { FolderKanban, Plus, X, Target } from 'lucide-react'
import type { Project, User } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Project name is required').max(80),
  description: z.string().max(500).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  tagsRaw: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CreateProjectDialog({ open, onOpenChange }: Props) {
  const { currentUser, currentTeamId } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [members, setMembers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [objectives, setObjectives] = useState<string[]>([])
  const [objInput, setObjInput] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', startDate: '', endDate: '', tagsRaw: '' },
  })

  useEffect(() => {
    if (open && currentTeamId) {
      listTeamMembers(currentTeamId).then(setMembers)
      setSelectedMembers(currentUser ? [currentUser.userId] : [])
      setObjectives([])
      setObjInput('')
    }
  }, [open, currentTeamId, currentUser])

  function addObjective() {
    if (!objInput.trim()) return
    setObjectives([...objectives, objInput.trim()])
    setObjInput('')
  }

  function removeObjective(idx: number) {
    setObjectives(objectives.filter((_, i) => i !== idx))
  }

  function toggleMember(uid: string) {
    setSelectedMembers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  async function onSubmit(data: FormData) {
    if (!currentTeamId || !currentUser) return
    setBusy(true)
    try {
      const tags = data.tagsRaw
        ? data.tagsRaw.split(/[\s,;]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const project = await addDoc<Project>(COLLECTIONS.PROJECTS, {
        teamId: currentTeamId,
        name: data.name,
        description: data.description || '',
        status: 'planning',
        members: selectedMembers,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        progress: 0,
        tags,
        objectives,
        createdBy: currentUser.userId,
      } as any, 'projectId')

      toast({ title: 'Project created', description: `${project.name} is now planning.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Failed to create project', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary grid place-items-center">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl md:text-3xl">Create new project</DialogTitle>
              <DialogDescription className="text-base mt-1">Organize work items, assign teams, and set milestones.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg">Project name</Label>
            <Input id="name" className="h-12 !text-lg" placeholder="e.g. AI Engine Integration" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-lg">Description</Label>
            <Textarea id="description" rows={3} className="!text-lg resize-none" placeholder="What is the scope of this project?" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-lg">Start date</Label>
              <Input id="startDate" type="date" className="h-11" {...register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-lg">End date</Label>
              <Input id="endDate" type="date" className="h-11" {...register('endDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-lg">Objectives / Goals</Label>
            <div className="flex gap-2">
              <Input
                className="h-11"
                placeholder="e.g. Design scoring API"
                value={objInput}
                onChange={e => setObjInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addObjective() } }}
              />
              <Button type="button" onClick={addObjective} className="h-11 shrink-0"><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-1.5 mt-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-sm">
                  <span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary shrink-0" />{obj}</span>
                  <button type="button" onClick={() => removeObjective(i)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagsRaw" className="text-lg">Tags (comma-separated)</Label>
            <Input id="tagsRaw" className="h-11" placeholder="ai, microservice, sprint-2" {...register('tagsRaw')} />
          </div>

          <div className="space-y-2">
            <Label className="text-lg">Project Members</Label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-border rounded-xl p-3 bg-muted/10">
              {members.map(m => {
                const isSelected = selectedMembers.includes(m.userId)
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleMember(m.userId)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg text-left text-sm transition-all border ${
                      isSelected ? 'border-primary bg-primary/5 font-semibold' : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                    }`}>
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </div>
                    <span className="truncate">{m.fullName}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="h-11">Cancel</Button>
            <Button type="submit" disabled={busy} className="h-11 px-6">
              {busy ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
