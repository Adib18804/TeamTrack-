import {
    User, Team, Task, Project, Resource, ChatChannel, ChatMessage,
    DailyLog, Contest, ResearchItem, Domain, Topic, Subtopic, Notification,
    TeamInvite
} from '@/types'

const now = new Date().toISOString()
const oneWeekAgo = new Date(Date.now() - 86400000 * 7).toISOString()

export const demoUserId1 = 'demo-user-adib'

export const demoUsers: User[] = [
    {
        userId: demoUserId1,
        fullName: 'Mohammad Adib Abtahi',
        email: 'adib@teamtrack.dev',
        avatar: '',
        createdAt: oneWeekAgo,
        updatedAt: now,
        globalRole: 'super_admin',
        teamMemberships: [],
        emailVerified: true,
    },
]

// Stored password for the superadmin in demo mode
export const demoPasswords: Record<string, string> = {
    [demoUserId1]: 'AdibAdmin123',
}

export const demoTeams: Team[] = []

export const demoDomains: Domain[] = []

export const demoTopics: Topic[] = []

export const demoSubtopics: Subtopic[] = []

export const demoProjects: Project[] = []

export const demoTasks: Task[] = []

export const demoResources: Resource[] = []

export const demoDailyLogs: DailyLog[] = []

export const demoChannels: ChatChannel[] = []

export const demoMessages: ChatMessage[] = []

export const demoContests: Contest[] = []

export const demoResearch: ResearchItem[] = []

export const demoNotifications: Notification[] = []

export const demoInvites: TeamInvite[] = []
