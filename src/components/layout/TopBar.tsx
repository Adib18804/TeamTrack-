import { Link, useLocation } from 'react-router-dom'
import { Search, Bell, Moon, Sun, Monitor, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/contexts/ThemeContext'
import { cn, getInitials, getAvatarColor, formatRelativeTime } from '@/lib/utils'
import { useEffect, useState as useReactState } from 'react'
import { query, markNotificationsRead, onSnapshot, COLLECTIONS } from '@/lib/dataService'
import type { Notification } from '@/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  onMobileMenuToggle: () => void
  mobileOpen: boolean
}

export default function TopBar({ onMobileMenuToggle, mobileOpen }: Props) {
  const { currentUser, currentTeamId, signOut, refreshCurrentUser } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useReactState<Notification[]>([])

  useEffect(() => {
    if (!currentUser) return
    let alive = true
    query<Notification>(COLLECTIONS.NOTIFICATIONS, [{ field: 'userId', op: '==', value: currentUser.userId }], { field: 'createdAt', direction: 'desc' }, 25)
      .then(list => { if (alive) setNotifications(list) })
    const unsub = onSnapshot<Notification>(COLLECTIONS.NOTIFICATIONS, data => {
      if (!alive) return
      setNotifications(data.filter(n => n.userId === currentUser.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25))
    })
    return () => { alive = false; unsub() }
  }, [currentUser])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const crumbs = location.pathname.split('/').filter(Boolean).map((seg, i, arr) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    to: '/' + arr.slice(0, i + 1).join('/')
  }))

  async function handleOpenNotifs() {
    if (currentUser) markNotificationsRead(currentUser.userId)
    const updated = notifications.map(n => ({ ...n, isRead: true }))
    setNotifications(updated)
  }

  return (
    <header className="sticky top-0 z-40 h-16 md:h-[72px] bg-background/80 backdrop-blur-xl border-b-2 border-border px-4 md:px-6 flex items-center gap-3">
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <nav className="hidden md:flex items-center gap-2 text-base min-w-0">
        {crumbs.length === 0 ? (
          <span className="font-semibold text-lg">Dashboard</span>
        ) : (
          crumbs.map((c, i) => (
            <span key={c.to} className="flex items-center gap-2 min-w-0">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <Link to={c.to} className={cn(
                'truncate hover:text-primary transition-colors',
                i === crumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}>
                {c.label}
              </Link>
            </span>
          ))
        )}
      </nav>

      <div className="flex-1" />

      <div className="hidden lg:flex items-center relative w-80 xl:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          placeholder="Search tasks, messages, resources…"
          className="w-full h-11 pl-11 pr-4 rounded-xl border-2 border-input bg-muted/30 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all hover:bg-background"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5">⌘K</span>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <TooltipProvider delayDuration={150}>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                    {theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')
                      ? <Moon className="h-5 w-5" />
                      : theme === 'light'
                        ? <Sun className="h-5 w-5" />
                        : <Monitor className="h-5 w-5" />
                    }
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Switch theme</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="!p-2 w-48">
              <DropdownMenuItem className="!rounded-lg" onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4 mr-2" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem className="!rounded-lg" onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4 mr-2" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem className="!rounded-lg" onClick={() => setTheme('system')}>
                <Monitor className="h-4 w-4 mr-2" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={notifOpen} onOpenChange={(o) => { setNotifOpen(o); if (o) handleOpenNotifs() }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-h-[18px] min-w-[18px] rounded-full bg-destructive text-destructive-foreground text-xs font-bold grid place-items-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-96 !p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border">
              <div>
                <div className="font-semibold text-lg">Notifications</div>
                <div className="text-sm text-muted-foreground">{unreadCount} unread</div>
              </div>
            </div>
            <ScrollArea className="max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-muted-foreground text-lg">All caught up 🎉</div>
                  <div className="text-sm text-muted-foreground/70 mt-1">No new notifications.</div>
                </div>
              ) : (
                notifications.map(n => (
                  <Link
                    key={n.notificationId}
                    to="/activity"
                    className={cn('block px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors', !n.isRead && 'bg-accent/40')}
                    onClick={() => setNotifOpen(false)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-base">{n.title}</div>
                      <div className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{formatRelativeTime(n.createdAt)}</div>
                    </div>
                    <div className="text-base text-muted-foreground mt-1 leading-snug">{n.message}</div>
                  </Link>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </header>
  )
}
