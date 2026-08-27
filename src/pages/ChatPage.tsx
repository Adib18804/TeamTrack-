import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MessageSquare, Send, Smile, Paperclip, Hash, Megaphone, Search,
  Pin, MoreHorizontal, Users as UsersIcon, Plus, X, ChevronDown, CornerUpLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import {
  COLLECTIONS, getCurrentTeamId, listTeamMembers, onSnapshot, query, sendMessage, toggleReaction
} from '@/lib/dataService'
import type { ChatChannel, ChatMessage, User } from '@/types'
import { cn, formatRelativeTime, formatDateTime, getInitials, getAvatarColor } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import CreateChannelDialog from '@/components/dialogs/CreateChannelDialog'

export default function ChatPage() {
  const { currentUser } = useAuth()
  const teamId = getCurrentTeamId()
  const [params, setParams] = useSearchParams()
  const currentChannelId = params.get('channel')
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)

  useEffect(() => {
    if (!teamId) return
    let alive = true
    Promise.all([
      query<ChatChannel>(COLLECTIONS.CHANNELS, [{ field: 'teamId', op: '==', value: teamId }], { field: 'createdAt', direction: 'asc' }),
      listTeamMembers(teamId),
    ]).then(([c, m]) => {
      if (!alive) return
      setChannels(c); setMembers(m); setLoading(false)
      if (!currentChannelId && c.length > 0) setChannel(c[0].channelId)
    })
    const u1 = onSnapshot<ChatChannel>(COLLECTIONS.CHANNELS, d => setChannels(d.filter(x => x.teamId === teamId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))))
    const u2 = onSnapshot<ChatMessage>(COLLECTIONS.MESSAGES, d => setMessages(d.filter(x => x.teamId === teamId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))))
    return () => { alive = false; u1(); u2() }
  }, [teamId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentChannelId])

  function setChannel(id: string) {
    const next = new URLSearchParams(params); next.set('channel', id); setParams(next)
  }

  const currentChannel = channels.find(c => c.channelId === currentChannelId)
  const channelMessages = useMemo(() => messages.filter(m => m.channelId === currentChannelId), [messages, currentChannelId])
  const messagesById = useMemo(() => { const m: Record<string, ChatMessage> = {}; messages.forEach(x => m[x.messageId] = x); return m }, [messages])
  const pinned = channelMessages.filter(m => m.isPinned)

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || !teamId || !currentChannel || !currentUser) return
    await sendMessage(currentChannel.channelId, teamId, currentUser.userId, input.trim(), replyTo?.messageId)
    setInput(''); setReplyTo(null); inputRef.current?.focus()
  }

  async function handleReact(message: ChatMessage, emoji: string) {
    if (!currentUser) return
    await toggleReaction(message.messageId, emoji, currentUser.userId)
  }

  const memberMap = useMemo(() => { const m: Record<string, User> = {}; members.forEach(x => m[x.userId] = x); return m }, [members])

  if (!teamId) return <NoTeamHint />

  return (
    <div className="flex gap-5 h-[calc(100vh-72px-4rem)] -mt-2 mb-[-2rem]">
      <div className="hidden md:flex w-64 shrink-0 flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Channels</h2>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setIsCreateChannelOpen(true)}><Plus className="h-4 w-4" /></Button>
        </div>
        <ScrollArea className="flex-1 -mr-2 pr-2">
          <div className="space-y-0.5">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />) :
              channels.map(ch => {
                const unread = 0
                const Icon = ch.type === 'announcement' ? Megaphone : Hash
                const active = currentChannelId === ch.channelId
                return (
                  <button
                    key={ch.channelId}
                    onClick={() => setChannel(ch.channelId)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all group text-left',
                      active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" style={{ width: 18, height: 18 }} />
                    <span className="flex-1 truncate">{ch.name}</span>
                    {unread > 0 && <Badge className="text-[10px] px-1.5 h-5 min-w-5">{unread}</Badge>}
                  </button>
                )
              })
            }
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 min-w-0 flex flex-col border-2 border-border rounded-2xl bg-card overflow-hidden">
        {!currentChannel ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center space-y-3 max-w-md">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-muted text-muted-foreground grid place-items-center"><MessageSquare className="h-8 w-8" /></div>
              <h3 className="text-2xl font-bold">Select a channel</h3>
              <p className="text-muted-foreground leading-relaxed">Pick a channel from the sidebar to start chatting with your team.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between px-5 py-4 border-b-2 border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2">
                  {currentChannel.type === 'announcement' ? <Megaphone className="h-5 w-5 text-primary" /> : <Hash className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <div className="font-bold text-lg md:text-xl truncate">{currentChannel.name}</div>
                    {currentChannel.description && <div className="text-xs md:text-sm text-muted-foreground truncate max-w-lg">{currentChannel.description}</div>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input placeholder="Search channel" className="bg-transparent outline-none text-sm w-36" />
                </div>
                <Badge variant="outline" className="text-sm hidden sm:inline-flex"><UsersIcon className="h-3.5 w-3.5 mr-1" />{members.length}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><MoreHorizontal className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="!rounded-lg"><Pin className="h-4 w-4 mr-2" />View pinned ({pinned.length})</DropdownMenuItem>
                    <DropdownMenuItem className="!rounded-lg">Notification preferences</DropdownMenuItem>
                    <DropdownMenuItem className="!rounded-lg">Channel settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {pinned.length > 0 && (
              <div className="px-5 py-2.5 bg-primary/5 border-b border-border flex items-center gap-2 text-sm">
                <Pin className="h-4 w-4 text-primary shrink-0" />
                <div className="truncate font-medium">📌 {pinned[0].content}</div>
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </div>
            )}

            <ScrollArea ref={scrollRef as any} className="flex-1">
              <div className="px-4 md:px-6 py-5 space-y-0.5">
                {channelMessages.length === 0 ? (
                  <div className="py-20 text-center max-w-md mx-auto space-y-3">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                      {currentChannel.type === 'announcement' ? <Megaphone className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                    </div>
                    <h3 className="text-2xl font-bold">Welcome to #{currentChannel.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{currentChannel.description || 'This is the start of the channel. Post something to kick things off!'}</p>
                  </div>
                ) : channelMessages.map((m, i) => {
                  const prev = channelMessages[i - 1]
                  const grouped = prev && prev.userId === m.userId && (new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 5 * 60 * 1000 && !m.replyTo
                  const author = memberMap[m.userId]
                  const replyingTo = m.replyTo ? messagesById[m.replyTo] : undefined
                  return (
                    <MessageRow
                      key={m.messageId}
                      message={m}
                      author={author}
                      grouped={!!grouped}
                      replyingTo={replyingTo ? { message: replyingTo, author: memberMap[replyingTo.userId] } : undefined}
                      isMine={currentUser?.userId === m.userId}
                      onReply={() => setReplyTo(m)}
                      onReact={(e) => handleReact(m, e)}
                      onQuote={(content) => setInput(content)}
                    />
                  )
                })}
              </div>
            </ScrollArea>

            {replyTo && (
              <div className="px-4 md:px-6 py-2.5 bg-muted/50 border-t border-border flex items-center gap-3">
                <CornerUpLeft className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Replying to <span className="font-semibold text-foreground">{memberMap[replyTo.userId]?.fullName || 'Unknown'}</span></div>
                  <div className="text-sm truncate">{replyTo.content}</div>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1.5 rounded-lg hover:bg-background"><X className="h-4 w-4" /></button>
              </div>
            )}

            <form onSubmit={handleSend} className="px-4 md:px-6 py-4 border-t-2 border-border">
              <div className="flex items-end gap-2 p-2 rounded-2xl border-2 border-border focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-background">
                <div className="flex items-center gap-1 pl-1 pb-2 md:pb-0">
                  <button type="button" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Attach"><Paperclip className="h-5 w-5" /></button>
                </div>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={`Message #${currentChannel.name}…`}
                  className="!border-0 !shadow-none !ring-0 !px-2 !py-2 !h-auto min-h-[40px] resize-none bg-transparent"
                />
                <div className="flex items-center gap-1 pb-2 md:pb-0">
                  <button type="button" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Emoji" onClick={() => handleReact(({ messageId: 'emoji' } as any), '👍')}><Smile className="h-5 w-5" /></button>
                  <Button type="submit" disabled={!input.trim()} variant={input.trim() ? 'default' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl shrink-0">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      <CreateChannelDialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen} />
    </div>
  )
}

function MessageRow({ message, author, grouped, replyingTo, isMine, onReply, onReact, onQuote }: {
  message: ChatMessage; author?: User; grouped: boolean; replyingTo?: { message: ChatMessage; author?: User };
  isMine: boolean; onReply: () => void; onReact: (emoji: string) => void; onQuote: (s: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const emojis = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅']
  return (
    <div
      className={cn('group relative flex gap-3 md:gap-4 px-2 py-1 rounded-xl hover:bg-muted/30 transition-colors', grouped ? 'mt-0' : 'mt-5')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {grouped ? (
        <div className="w-10 shrink-0 text-[10px] text-right pr-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.createdAt)}
        </div>
      ) : (
        <Avatar className="h-10 w-10 md:h-11 md:w-11 shrink-0 border-2 border-border">
          <AvatarFallback style={{ backgroundColor: author ? getAvatarColor(author.fullName) : '#64748b', color: 'white' }}>
            {author ? getInitials(author.fullName) : '?'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        {!grouped && (
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-bold text-base md:text-lg">{author?.fullName || 'Unknown User'}</span>
            <span className="text-xs md:text-sm text-muted-foreground">{formatDateTime(message.createdAt)}</span>
            {message.isPinned && <Badge className="text-[10px]"><Pin className="h-3 w-3 mr-0.5" />Pinned</Badge>}
          </div>
        )}
        {replyingTo && (
          <div className="my-1.5 p-2.5 pl-3 rounded-xl bg-muted/60 border-l-4 border-primary text-sm max-w-lg">
            <div className="text-xs text-muted-foreground font-semibold">{replyingTo.author?.fullName || 'Unknown'}</div>
            <div className="line-clamp-2 text-muted-foreground leading-snug">{replyingTo.message.content}</div>
          </div>
        )}
        <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
        {Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(message.reactions).map(([e, users]) => (
              <button
                key={e}
                onClick={() => onReact(e)}
                className="px-2 py-1 rounded-full text-xs md:text-sm bg-muted hover:bg-accent border border-border hover:border-primary/40 transition-all inline-flex items-center gap-1.5"
              >
                <span>{e}</span>
                <span className="font-semibold">{users.length}</span>
              </button>
            ))}
            <button
              onClick={() => onReact('👍')}
              className="px-2 py-1 rounded-full text-xs text-muted-foreground hover:bg-muted border border-dashed border-border transition-all opacity-0 group-hover:opacity-100"
              title="Add reaction"
            >+ 😊</button>
          </div>
        )}
      </div>

      {showActions && (
        <div className="absolute right-2 -top-3 bg-card border-2 border-border rounded-xl shadow-lg flex items-center gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {emojis.slice(0, 5).map(e => (
            <button key={e} onClick={() => onReact(e)} className="h-8 w-8 rounded-lg hover:bg-muted text-lg">{e}</button>
          ))}
          <div className="w-px h-6 bg-border mx-0.5" />
          <button onClick={onReply} className="h-8 px-2 rounded-lg hover:bg-muted inline-flex items-center gap-1 text-xs font-medium"><CornerUpLeft className="h-3.5 w-3.5" />Reply</button>
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function NoTeamHint() {
  return (
    <Card className="border-2">
      <CardContent className="p-16 text-center max-w-xl mx-auto">
        <MessageSquare className="h-14 w-14 text-muted-foreground mx-auto mb-5" />
        <h2 className="text-3xl font-bold mb-2">No team selected</h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-6">Choose a team from the sidebar to access your team chat channels.</p>
      </CardContent>
    </Card>
  )
}
