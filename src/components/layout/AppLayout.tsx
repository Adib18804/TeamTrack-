import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import SecondarySidebar from './SecondarySidebar'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import CreateTeamDialog from '@/components/dialogs/CreateTeamDialog'
import { cn } from '@/lib/utils'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background text-foreground flex">
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <div className="w-72 h-full bg-sidebar animate-in slide-in-from-left" onClick={e => e.stopPropagation()}>
              <Sidebar openCreateTeam={() => { setMobileOpen(false); setCreateOpen(true) }} />
            </div>
          </div>
        )}
        <Sidebar openCreateTeam={() => setCreateOpen(true)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar mobileOpen={mobileOpen} onMobileMenuToggle={() => setMobileOpen(v => !v)} />
          <div className="flex-1 flex min-h-0">
            <SecondarySidebar />
            <main className={cn(
              'flex-1 min-w-0 flex flex-col',
            )}>
              <div className="flex-1 w-full p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>
        <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
        <Toaster />
      </div>
    </TooltipProvider>
  )
}
