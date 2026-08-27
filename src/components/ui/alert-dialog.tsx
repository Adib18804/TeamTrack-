/**
 * AlertDialog — built on top of the existing Dialog primitive.
 * Provides the same API surface as shadcn/ui AlertDialog without
 * requiring @radix-ui/react-alert-dialog.
 */
import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog'
import { cn } from '@/lib/utils'

// ─── Context ──────────────────────────────────────────────────────────────────

interface AlertDialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const AlertDialogContext = React.createContext<AlertDialogContextType>({
  open: false,
  onOpenChange: () => {},
})

// ─── Root ─────────────────────────────────────────────────────────────────────

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function AlertDialog({ open = false, onOpenChange = () => {}, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </AlertDialogContext.Provider>
  )
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

function AlertDialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        const orig = (children as any).props?.onClick
        orig?.(e)
        onOpenChange(true)
      },
    })
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>
}

// ─── Content ──────────────────────────────────────────────────────────────────

function AlertDialogContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DialogContent className={cn('sm:max-w-md', className)}>
      {children}
    </DialogContent>
  )
}

// ─── Header / Title / Description ─────────────────────────────────────────────

function AlertDialogHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <DialogHeader className={className}>{children}</DialogHeader>
}

function AlertDialogTitle({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <DialogTitle className={className}>{children}</DialogTitle>
}

function AlertDialogDescription({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <DialogDescription className={className}>{children}</DialogDescription>
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function AlertDialogFooter({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <DialogFooter className={cn('gap-2', className)}>{children}</DialogFooter>
}

// ─── Cancel / Action ──────────────────────────────────────────────────────────

interface ButtonLikeProps {
  children?: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}

function AlertDialogCancel({ children, className, onClick }: ButtonLikeProps) {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  return (
    <button
      onClick={e => { onClick?.(e); onOpenChange(false) }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </button>
  )
}

function AlertDialogAction({ children, className, onClick, disabled }: ButtonLikeProps) {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  return (
    <button
      disabled={disabled}
      onClick={e => { onClick?.(e); onOpenChange(false) }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
}
