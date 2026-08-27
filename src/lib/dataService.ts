import { isDemoMode, COLLECTIONS } from './firebase'
import { generateId, generateSlug } from './utils'
import * as demo from './demoData'
import type {
    User, Team, Task, Project, Resource, ChatChannel, ChatMessage,
    DailyLog, Contest, ResearchItem, Domain, Topic, Subtopic, Notification,
    TeamInvite, ResearchStatus, ContestStatus, TaskStatus, TaskPriority, TaskDifficulty
} from '@/types'

type FirestoreOp = 'get' | 'set' | 'add' | 'update' | 'delete' | 'query'

const LS_PREFIX = 'teamtrack_local_'

function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(LS_PREFIX + key)
        return raw ? JSON.parse(raw) as T : fallback
    } catch { return fallback }
}

function writeLS<T>(key: string, value: T) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)) } catch { /* ignore */ }
}

function seedOnce() {
    const seeded = localStorage.getItem(LS_PREFIX + 'seeded_v1')
    if (seeded) return
    writeLS('users', demo.demoUsers)
    writeLS('teams', demo.demoTeams)
    writeLS('domains', demo.demoDomains)
    writeLS('topics', demo.demoTopics)
    writeLS('subtopics', demo.demoSubtopics)
    writeLS('projects', demo.demoProjects)
    writeLS('tasks', demo.demoTasks)
    writeLS('resources', demo.demoResources)
    writeLS('daily_logs', demo.demoDailyLogs)
    writeLS('channels', demo.demoChannels)
    writeLS('messages', demo.demoMessages)
    writeLS('contests', demo.demoContests)
    writeLS('research', demo.demoResearch)
    writeLS('notifications', demo.demoNotifications)
    writeLS('invites', demo.demoInvites)
    writeLS('currentUserId', demo.demoUserId1)
    writeLS('currentTeamId', demo.demoTeams[0].teamId)
    localStorage.setItem(LS_PREFIX + 'seeded_v1', 'true')
}

if (isDemoMode) seedOnce()

type Listener<T> = (data: T) => void
const listeners = new Map<string, Set<Listener<any>>>()

function emitChange<T>(key: string, data: T) {
    const set = listeners.get(key)
    if (set) set.forEach(fn => fn(data))
}

function all<T>(key: string): T[] { return readLS<T[]>(key, []) }
function saveAll<T>(key: string, list: T[]) { writeLS(key, list); emitChange(key, list) }

export interface QueryFilter { field: string; op: '==' | '!=' | 'in' | 'array-contains' | '>=' | '<=' | '>' | '<'; value: any }

async function wait(ms = 50) { return new Promise(r => setTimeout(r, ms)) }

export async function getUser(userId: string): Promise<User | null> {
    await wait()
    return all<User>('users').find(u => u.userId === userId) || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
    await wait()
    return all<User>('users').find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

export async function createUser(data: Omit<User, 'createdAt' | 'updatedAt' | 'teamMemberships' | 'emailVerified' | 'globalRole'> & Partial<Pick<User, 'globalRole' | 'emailVerified' | 'teamMemberships'>>): Promise<User> {
    await wait()
    const list = all<User>('users')
    const user: User = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teamMemberships: data.teamMemberships || [],
        globalRole: data.globalRole || 'team_member',
        emailVerified: data.emailVerified ?? true,
    }
    list.push(user)
    saveAll('users', list)
    writeLS('currentUserId', user.userId)
    return user
}

export async function updateUser(userId: string, patch: Partial<User>): Promise<User | null> {
    await wait()
    const list = all<User>('users')
    const idx = list.findIndex(u => u.userId === userId)
    if (idx < 0) return null
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() }
    saveAll('users', list)
    return list[idx]
}

export async function listTeamsForUser(userId: string): Promise<Team[]> {
    await wait()
    const user = await getUser(userId)
    if (!user) return []
    const teams = all<Team>('teams')
    if (user.globalRole === 'super_admin') return teams
    const ids = new Set(user.teamMemberships.map(m => m.teamId))
    return teams.filter(t => ids.has(t.teamId))
}

export async function getTeam(teamId: string, userId?: string): Promise<Team | null> {
    await wait()
    const team = all<Team>('teams').find(t => t.teamId === teamId) || null
    if (!team) return null
    if (!userId) return team
    const user = await getUser(userId)
    if (!user) return null
    if (user.globalRole === 'super_admin') return team
    const isMember = user.teamMemberships.some(m => m.teamId === teamId)
    return isMember ? team : null
}

export async function createTeam(data: Omit<Team, 'teamId' | 'slug' | 'createdAt' | 'updatedAt' | 'status' | 'topics' | 'avatar' | 'banner'> & Partial<Team>): Promise<Team> {
    await wait()
    const teams = all<Team>('teams')
    const users = all<User>('users')
    const teamId = data.teamId || generateId()
    const team: Team = {
        teamId,
        name: data.name,
        slug: data.slug || generateSlug(data.name),
        description: data.description || '',
        avatar: data.avatar || '',
        banner: data.banner || '',
        domain: data.domain || 'General',
        topics: data.topics || [],
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: data.status || 'active',
    }
    teams.push(team)
    saveAll('teams', teams)

    const creatorIdx = users.findIndex(u => u.userId === data.createdBy)
    if (creatorIdx >= 0) {
        users[creatorIdx] = {
            ...users[creatorIdx],
            teamMemberships: [
                ...users[creatorIdx].teamMemberships,
                { teamId, role: 'team_admin', joinedAt: new Date().toISOString() }
            ],
            updatedAt: new Date().toISOString(),
        }
        saveAll('users', users)
    }
    const generalId = generateId()
    const announceId = generateId()
    const channels = all<ChatChannel>('channels')
    channels.push(
        { channelId: generalId, teamId, name: 'general', description: 'Team general discussion', type: 'general', isPrivate: false, createdAt: team.createdAt, updatedAt: team.updatedAt },
        { channelId: announceId, teamId, name: 'announcements', description: 'Official team announcements', type: 'announcement', isPrivate: false, allowedRoles: ['team_admin'], createdAt: team.createdAt, updatedAt: team.updatedAt },
    )
    saveAll('channels', channels)
    return team
}

export async function updateTeam(teamId: string, patch: Partial<Team>): Promise<Team | null> {
    await wait()
    const list = all<Team>('teams')
    const idx = list.findIndex(t => t.teamId === teamId)
    if (idx < 0) return null
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() }
    saveAll('teams', list)
    return list[idx]
}

export async function listTeamMembers(teamId: string): Promise<User[]> {
    await wait()
    const users = all<User>('users')
    return users.filter(u =>
        u.globalRole === 'super_admin' ||
        u.teamMemberships.some(m => m.teamId === teamId)
    )
}

export async function getUserRoleInTeam(userId: string, teamId: string): Promise<'super_admin' | 'team_admin' | 'team_member' | null> {
    const user = await getUser(userId)
    if (!user) return null
    if (user.globalRole === 'super_admin') return 'super_admin'
    const mem = user.teamMemberships.find(m => m.teamId === teamId)
    if (!mem) return null
    return mem.role
}

export async function addTeamMember(teamId: string, userId: string, role: 'team_admin' | 'team_member' = 'team_member'): Promise<User | null> {
    await wait()
    const list = all<User>('users')
    const idx = list.findIndex(u => u.userId === userId)
    if (idx < 0) return null
    const existing = list[idx].teamMemberships.find(m => m.teamId === teamId)
    if (!existing) {
        list[idx].teamMemberships = [...list[idx].teamMemberships, { teamId, role, joinedAt: new Date().toISOString() }]
    } else {
        existing.role = role
    }
    list[idx].updatedAt = new Date().toISOString()
    saveAll('users', list)
    return list[idx]
}

export async function removeTeamMember(teamId: string, userId: string): Promise<User | null> {
    await wait()
    const list = all<User>('users')
    const idx = list.findIndex(u => u.userId === userId)
    if (idx < 0) return null
    list[idx].teamMemberships = list[idx].teamMemberships.filter(m => m.teamId !== teamId)
    list[idx].updatedAt = new Date().toISOString()
    saveAll('users', list)
    return list[idx]
}

export async function getAllUsers(): Promise<User[]> {
    await wait()
    return all<User>('users')
}

export async function hasSuperAdmin(): Promise<boolean> {
    await wait()
    return all<User>('users').some(u => u.globalRole === 'super_admin')
}

export async function promoteToSuperAdmin(userId: string): Promise<User | null> {
    return updateUser(userId, { globalRole: 'super_admin' })
}

export async function demoteFromSuperAdmin(userId: string): Promise<User | null> {
    return updateUser(userId, { globalRole: 'team_member' })
}

export async function deleteTeam(teamId: string): Promise<boolean> {
    await wait()
    // Remove team
    const teams = all<Team>('teams')
    const filtered = teams.filter(t => t.teamId !== teamId)
    if (filtered.length === teams.length) return false
    saveAll('teams', filtered)
    // Strip memberships from all users
    const users = all<User>('users')
    const updated = users.map(u => ({
        ...u,
        teamMemberships: u.teamMemberships.filter(m => m.teamId !== teamId),
        updatedAt: new Date().toISOString(),
    }))
    saveAll('users', updated)
    // Remove related data
    const cleanup = ['tasks', 'projects', 'channels', 'messages', 'resources', 'daily_logs', 'contests', 'research', 'invites', 'domains', 'topics', 'subtopics', 'notifications']
    for (const col of cleanup) {
        const items = readLS<any[]>(col, [])
        saveAll(col, items.filter((x: any) => x.teamId !== teamId))
    }
    return true
}

export async function createTeamInvite(teamId: string, email: string, invitedBy: string): Promise<TeamInvite> {
    await wait()
    const list = all<TeamInvite>('invites')
    const invite: TeamInvite = {
        inviteId: generateId(), teamId, email,
        token: generateId() + generateId(),
        invitedBy,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        used: false,
    }
    list.push(invite)
    saveAll('invites', list)
    return invite
}

export async function getInviteByToken(token: string): Promise<TeamInvite | null> {
    return all<TeamInvite>('invites').find(i => i.token === token) || null
}

export async function acceptInvite(token: string, userId: string): Promise<void> {
    await wait()
    const invites = all<TeamInvite>('invites')
    const idx = invites.findIndex(i => i.token === token && !i.used)
    if (idx < 0) throw new Error('Invalid or used invite')
    invites[idx].used = true
    invites[idx].usedBy = userId
    invites[idx].usedAt = new Date().toISOString()
    saveAll('invites', invites)
    await addTeamMember(invites[idx].teamId, userId, 'team_member')
}

export async function query<T>(collection: string, filters: QueryFilter[] = [], orderBy?: { field: string; direction: 'asc' | 'desc' }, limit?: number): Promise<T[]> {
    await wait()
    let list = readLS<T[]>(collection, [])
    for (const f of filters) {
        list = list.filter(item => {
            const v = (item as any)[f.field]
            switch (f.op) {
                case '==': return Array.isArray(v) ? v.includes(f.value) : v === f.value
                case '!=': return v !== f.value
                case 'in': return Array.isArray(f.value) && f.value.includes(v)
                case 'array-contains': return Array.isArray(v) && v.includes(f.value)
                case '>=': return v >= f.value
                case '<=': return v <= f.value
                case '>': return v > f.value
                case '<': return v < f.value
            }
            return true
        })
    }
    if (orderBy) {
        const dir = orderBy.direction === 'asc' ? 1 : -1
        list.sort((a: any, b: any) => {
            const av = a[orderBy.field]; const bv = b[orderBy.field]
            if (av < bv) return -1 * dir
            if (av > bv) return 1 * dir
            return 0
        })
    }
    if (typeof limit === 'number') list = list.slice(0, limit)
    return list
}

export async function getById<T>(collection: string, id: string, idField = `${collection.slice(0, -1)}Id`): Promise<T | null> {
    await wait()
    const list = readLS<T[]>(collection, [])
    return list.find((x: any) => x[idField] === id) || null
}

export async function addDoc<T extends { [k: string]: any }>(collection: string, data: T, idField: string): Promise<T> {
    await wait()
    const list = readLS<any[]>(collection, [])
    const now = new Date().toISOString()
    const id = (data as any)[idField] || generateId()
    const doc: any = { ...data, [idField]: id, createdAt: data.createdAt || now, updatedAt: data.updatedAt || now }
    list.push(doc)
    saveAll(collection, list)
    return doc as T
}

export async function updateDoc<T extends { [k: string]: any }>(collection: string, idField: string, id: string, patch: Partial<T>): Promise<T | null> {
    await wait()
    const list = readLS<any[]>(collection, [])
    const idx = list.findIndex((x: any) => x[idField] === id)
    if (idx < 0) return null
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() }
    saveAll(collection, list)
    return list[idx] as T
}

export async function deleteDoc(collection: string, idField: string, id: string): Promise<boolean> {
    await wait()
    const list = readLS<any[]>(collection, [])
    const next = list.filter((x: any) => x[idField] !== id)
    saveAll(collection, next)
    return next.length !== list.length
}

export function onSnapshot<T>(collection: string, cb: Listener<T[]>): () => void {
    const set = listeners.get(collection) || new Set()
    set.add(cb)
    listeners.set(collection, set)
    setTimeout(() => cb(readLS<T[]>(collection, [])), 0)
    return () => {
        const s = listeners.get(collection)
        if (s) s.delete(cb)
    }
}

export function setCurrentUser(userId: string | null) { writeLS('currentUserId', userId) }
export function getCurrentUserId(): string | null { return readLS<string | null>('currentUserId', null) }
export function setCurrentTeam(teamId: string | null) { writeLS('currentTeamId', teamId) }
export function getCurrentTeamId(): string | null { return readLS<string | null>('currentTeamId', null) }

export function markNotificationsRead(userId: string) {
    const list = all<Notification>('notifications')
    list.forEach(n => { if (n.userId === userId) n.isRead = true })
    saveAll('notifications', list)
}

export async function sendMessage(channelId: string, teamId: string, userId: string, content: string, replyTo?: string): Promise<ChatMessage> {
    const msg: ChatMessage = {
        messageId: generateId(), channelId, teamId, userId,
        content, replyTo, isPinned: false, isImportant: false,
        reactions: {}, mentions: [], attachments: [],
        createdAt: new Date().toISOString(),
    }
    const list = all<ChatMessage>('messages')
    list.push(msg)
    saveAll('messages', list)
    return msg
}

export async function toggleReaction(messageId: string, emoji: string, userId: string): Promise<ChatMessage | null> {
    const list = all<ChatMessage>('messages')
    const idx = list.findIndex(m => m.messageId === messageId)
    if (idx < 0) return null
    const current = list[idx].reactions[emoji] || []
    if (current.includes(userId)) {
        list[idx].reactions[emoji] = current.filter(u => u !== userId)
        if (list[idx].reactions[emoji].length === 0) delete list[idx].reactions[emoji]
    } else {
        list[idx].reactions[emoji] = [...current, userId]
    }
    saveAll('messages', list)
    return list[idx]
}

export async function togglePin(messageId: string): Promise<ChatMessage | null> {
    const list = all<ChatMessage>('messages')
    const idx = list.findIndex(m => m.messageId === messageId)
    if (idx < 0) return null
    list[idx].isPinned = !list[idx].isPinned
    saveAll('messages', list)
    return list[idx]
}

export { COLLECTIONS }
