import {
    User, Team, Task, Project, Resource, ChatChannel, ChatMessage,
    DailyLog, Contest, ResearchItem, Domain, Topic, Subtopic, Notification,
    TeamInvite
} from '@/types'
import { generateId, generateSlug } from './utils'

const now = new Date().toISOString()
const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString()
const oneWeekAgo = new Date(Date.now() - 86400000 * 7).toISOString()
const futureOneWeek = new Date(Date.now() + 86400000 * 7).toISOString()
const futureTwoWeeks = new Date(Date.now() + 86400000 * 14).toISOString()

export const demoUserId1 = 'demo-user-1'
export const demoUserId2 = 'demo-user-2'
export const demoUserId3 = 'demo-user-3'

export const demoUsers: User[] = [
    {
        userId: demoUserId1,
        fullName: 'Alex Morgan',
        email: 'alex@teamtrack.dev',
        avatar: '',
        createdAt: oneWeekAgo,
        updatedAt: now,
        globalRole: 'super_admin',
        teamMemberships: [
            { teamId: 'demo-team-1', role: 'team_admin', joinedAt: oneWeekAgo },
            { teamId: 'demo-team-2', role: 'team_member', joinedAt: twoDaysAgo },
        ],
        emailVerified: true,
    },
    {
        userId: demoUserId2,
        fullName: 'Jordan Lee',
        email: 'jordan@teamtrack.dev',
        avatar: '',
        createdAt: oneWeekAgo,
        updatedAt: now,
        globalRole: 'team_member',
        teamMemberships: [
            { teamId: 'demo-team-1', role: 'team_member', joinedAt: oneWeekAgo },
        ],
        emailVerified: true,
    },
    {
        userId: demoUserId3,
        fullName: 'Casey Kim',
        email: 'casey@teamtrack.dev',
        avatar: '',
        createdAt: twoDaysAgo,
        updatedAt: now,
        globalRole: 'team_admin',
        teamMemberships: [
            { teamId: 'demo-team-1', role: 'team_admin', joinedAt: twoDaysAgo },
            { teamId: 'demo-team-2', role: 'team_admin', joinedAt: twoDaysAgo },
        ],
        emailVerified: true,
    },
]

export const demoTeams: Team[] = [
    {
        teamId: 'demo-team-1',
        name: 'Cybersecurity Research',
        slug: generateSlug('Cybersecurity Research'),
        description: 'Offensive and defensive security research team focusing on web security, OSINT, cryptography, and ethical hacking.',
        avatar: '',
        banner: '',
        domain: 'Cybersecurity',
        topics: ['Web Security', 'OSINT', 'Cryptography', 'Digital Forensics'],
        createdBy: demoUserId1,
        createdAt: oneWeekAgo,
        updatedAt: now,
        status: 'active',
    },
    {
        teamId: 'demo-team-2',
        name: 'AI & Machine Learning',
        slug: generateSlug('AI & Machine Learning'),
        description: 'Exploring cutting-edge AI/ML from foundation models to production deployment. Research-focused and application-driven.',
        avatar: '',
        banner: '',
        domain: 'Artificial Intelligence',
        topics: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
        createdBy: demoUserId3,
        createdAt: oneWeekAgo,
        updatedAt: now,
        status: 'active',
    },
]

export const demoDomains: Domain[] = [
    { domainId: 'd-1', teamId: 'demo-team-1', name: 'Cybersecurity', description: 'Information security domain', icon: 'Shield', color: '#EF4444', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
    { domainId: 'd-2', teamId: 'demo-team-2', name: 'Artificial Intelligence', description: 'AI and ML domain', icon: 'Brain', color: '#8B5CF6', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
    { domainId: 'd-3', teamId: 'demo-team-1', name: 'Software Engineering', description: 'General software dev', icon: 'Code2', color: '#3B82F6', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
]

export const demoTopics: Topic[] = [
    { topicId: 't-1', teamId: 'demo-team-1', domainId: 'd-1', name: 'Web Security', description: 'Web application attacks and defenses', icon: 'Globe', color: '#EF4444', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
    { topicId: 't-2', teamId: 'demo-team-1', domainId: 'd-1', name: 'Cryptography', description: 'Applied cryptography', icon: 'Lock', color: '#F59E0B', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
    { topicId: 't-3', teamId: 'demo-team-2', domainId: 'd-2', name: 'Deep Learning', description: 'Neural networks', icon: 'Network', color: '#8B5CF6', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
    { topicId: 't-4', teamId: 'demo-team-2', domainId: 'd-2', name: 'NLP', description: 'Natural language processing', icon: 'MessageSquare', color: '#EC4899', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
]

export const demoSubtopics: Subtopic[] = [
    { subtopicId: 's-1', teamId: 'demo-team-1', topicId: 't-1', name: 'XSS Attacks', description: 'Cross-site scripting', icon: 'Zap', color: '#EF4444', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
    { subtopicId: 's-2', teamId: 'demo-team-1', topicId: 't-1', name: 'SQL Injection', description: 'Database injection attacks', icon: 'Database', color: '#F59E0B', status: 'active', createdAt: oneWeekAgo, updatedAt: now },
]

export const demoProjects: Project[] = [
    {
        projectId: 'p-1', teamId: 'demo-team-1',
        name: 'CTF Platform Build',
        description: 'Building an internal Capture The Flag platform for team practice and skill evaluation.',
        status: 'active', members: [demoUserId1, demoUserId2, demoUserId3],
        startDate: oneWeekAgo, endDate: futureTwoWeeks, progress: 42,
        tags: ['web', 'challenge', 'practice'],
        objectives: ['Create challenge authoring framework', 'Build scoring engine', 'Implement leaderboard'],
        createdBy: demoUserId1, createdAt: oneWeekAgo, updatedAt: now,
    },
    {
        projectId: 'p-2', teamId: 'demo-team-2',
        name: 'Document Q&A System',
        description: 'RAG-based document Q&A with local LLM for knowledge base retrieval.',
        status: 'active', members: [demoUserId3],
        startDate: twoDaysAgo, endDate: futureOneWeek, progress: 25,
        tags: ['rag', 'llm', 'nlp'],
        objectives: ['Vector DB ingestion', 'Retriever tuning', 'Streamlit UI'],
        createdBy: demoUserId3, createdAt: twoDaysAgo, updatedAt: now,
    },
]

export const demoTasks: Task[] = [
    {
        taskId: 'tk-1', teamId: 'demo-team-1', projectId: 'p-1',
        title: 'Design challenge data model',
        description: 'Create Firestore schema for challenges, categories, solves, and hints.',
        topicId: 't-1', subtopicId: 's-2',
        priority: 'high', difficulty: 'medium', status: 'completed',
        assignedUsers: [demoUserId1],
        createdBy: demoUserId1,
        startDate: oneWeekAgo, dueDate: twoDaysAgo,
        estimatedHours: 6, actualHours: 5.5, progressPercentage: 100,
        attachments: [], resources: [], proof: [],
        reviewStatus: 'approved', reviewComments: [],
        createdAt: oneWeekAgo, updatedAt: twoDaysAgo,
    },
    {
        taskId: 'tk-2', teamId: 'demo-team-1', projectId: 'p-1',
        title: 'Implement scoring REST API',
        description: 'Build endpoints for flag submission, solve tracking, and leaderboard aggregation.',
        topicId: 't-1', priority: 'urgent', difficulty: 'hard', status: 'in_progress',
        assignedUsers: [demoUserId2, demoUserId3],
        createdBy: demoUserId1,
        startDate: twoDaysAgo, dueDate: futureOneWeek,
        estimatedHours: 16, actualHours: 8, progressPercentage: 50,
        attachments: [], resources: [], proof: [],
        reviewStatus: 'pending', reviewComments: [],
        createdAt: twoDaysAgo, updatedAt: oneDayAgo,
    },
    {
        taskId: 'tk-3', teamId: 'demo-team-1', projectId: 'p-1',
        title: 'Author 5 beginner web challenges',
        description: 'Create starter challenges covering XSS, SQLi, CSRF, LFI, and redirects.',
        topicId: 't-1', priority: 'medium', difficulty: 'easy', status: 'submitted',
        assignedUsers: [demoUserId1],
        createdBy: demoUserId3,
        startDate: twoDaysAgo, dueDate: futureTwoWeeks,
        estimatedHours: 12, actualHours: 10, progressPercentage: 100,
        attachments: [], resources: [], proof: [],
        reviewStatus: 'pending', reviewComments: [],
        createdAt: twoDaysAgo, updatedAt: now,
    },
    {
        taskId: 'tk-4', teamId: 'demo-team-2', projectId: 'p-2',
        title: 'Set up vector DB pipeline',
        description: 'Chunk, embed, and ingest research documents into Pinecone/Weaviate.',
        topicId: 't-3', priority: 'high', difficulty: 'medium', status: 'not_started',
        assignedUsers: [demoUserId3],
        createdBy: demoUserId3,
        dueDate: futureOneWeek, estimatedHours: 8, actualHours: 0, progressPercentage: 0,
        attachments: [], resources: [], proof: [],
        reviewStatus: 'pending', reviewComments: [],
        createdAt: oneDayAgo, updatedAt: oneDayAgo,
    },
    {
        taskId: 'tk-5', teamId: 'demo-team-1',
        title: 'Read PortSwigger XSS chapter',
        description: 'Complete the XSS module and take notes.',
        topicId: 't-1', subtopicId: 's-1',
        priority: 'low', difficulty: 'beginner', status: 'in_progress',
        assignedUsers: [demoUserId2],
        createdBy: demoUserId1,
        estimatedHours: 3, actualHours: 1, progressPercentage: 33,
        attachments: [], resources: [], proof: [],
        reviewStatus: 'pending', reviewComments: [],
        createdAt: oneWeekAgo, updatedAt: oneDayAgo,
    },
    {
        taskId: 'tk-6', teamId: 'demo-team-2',
        title: 'Fine-tune LoRA adapter',
        description: 'Train a small LoRA on custom dataset for domain adaptation.',
        topicId: 't-3', priority: 'medium', difficulty: 'expert', status: 'blocked',
        assignedUsers: [demoUserId3],
        createdBy: demoUserId3,
        estimatedHours: 20, actualHours: 4, progressPercentage: 20,
        attachments: [], resources: [], proof: [],
        reviewStatus: 'pending', reviewComments: [],
        createdAt: twoDaysAgo, updatedAt: oneDayAgo,
    },
]

export const demoResources: Resource[] = [
    { resourceId: 'r-1', teamId: 'demo-team-1', title: 'PortSwigger Web Security Academy', description: 'Free interactive web security labs', type: 'course', url: 'https://portswigger.net/web-security', topicId: 't-1', difficulty: 'beginner', estimatedDuration: 40, tags: ['web', 'free', 'labs'], createdBy: demoUserId1, createdAt: oneWeekAgo, updatedAt: now },
    { resourceId: 'r-2', teamId: 'demo-team-1', title: 'OWASP Top 10', description: 'Official OWASP Top 10 documentation', type: 'documentation', url: 'https://owasp.org/www-project-top-ten/', topicId: 't-1', difficulty: 'medium', tags: ['reference', 'standards'], createdBy: demoUserId1, createdAt: oneWeekAgo, updatedAt: now },
    { resourceId: 'r-3', teamId: 'demo-team-2', title: 'Deep Learning Specialization', description: 'Andrew Ng deep learning courses', type: 'course', url: 'https://www.coursera.org/specializations/deep-learning', topicId: 't-3', difficulty: 'medium', estimatedDuration: 60, tags: ['ml', 'foundations'], createdBy: demoUserId3, createdAt: oneWeekAgo, updatedAt: now },
    { resourceId: 'r-4', teamId: 'demo-team-2', title: 'Attention Is All You Need', description: 'Original transformer paper', type: 'research_paper', url: 'https://arxiv.org/abs/1706.03762', topicId: 't-4', difficulty: 'hard', tags: ['paper', 'classic'], createdBy: demoUserId3, createdAt: oneWeekAgo, updatedAt: now },
    { resourceId: 'r-5', teamId: 'demo-team-1', title: 'CryptoHack', description: 'Fun cryptography challenges', type: 'ctf', url: 'https://cryptohack.org/', topicId: 't-2', difficulty: 'easy', tags: ['crypto', 'practice'], createdBy: demoUserId1, createdAt: oneWeekAgo, updatedAt: now },
]

export const demoDailyLogs: DailyLog[] = [
    {
        logId: 'l-1', teamId: 'demo-team-1', userId: demoUserId2, date: new Date().toISOString().split('T')[0],
        relatedTaskId: 'tk-2', topicId: 't-1',
        plannedHours: 6, actualHours: 5.5,
        workSummary: 'Implemented POST /submit endpoint with JWT auth and basic solve validation. Wrote unit tests for 3 scenarios.',
        whatILearned: 'Learned how to use Firestore transactions for atomic score updates to prevent race conditions.',
        challenges: 'CORS preflight was rejecting requests from the frontend — resolved by extending hosting config.',
        blockers: 'None currently',
        nextSteps: 'Finish leaderboard aggregation endpoint with caching.',
        createdAt: now, updatedAt: now,
    },
    {
        logId: 'l-2', teamId: 'demo-team-1', userId: demoUserId1, date: new Date().toISOString().split('T')[0],
        relatedTaskId: 'tk-3',
        plannedHours: 4, actualHours: 4,
        workSummary: 'Finished XSS, SQLi, CSRF, and LFI challenges. Working on the redirect challenge.',
        whatILearned: 'Better understanding of SameSite cookies and how they impact CSRF exploitability.',
        challenges: 'Challenge isolation via Docker networking took a few iterations.',
        blockers: 'Waiting for DNS entries for subdomain wildcard.',
        nextSteps: 'Wrap up redirect challenge and deploy all 5 to staging.',
        createdAt: now, updatedAt: now,
    },
    {
        logId: 'l-3', teamId: 'demo-team-2', userId: demoUserId3, date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        relatedTaskId: 'tk-4', topicId: 't-3',
        plannedHours: 5, actualHours: 3,
        workSummary: 'Researched chunking strategies. Evaluated recursive vs semantic chunking on sample docs.',
        whatILearned: 'Semantic chunking improves retrieval quality on Q&A benchmarks but is slower.',
        challenges: 'Embedding API latency is high — need to batch calls.',
        blockers: 'GPU quota for local embeddings is pending approval.',
        nextSteps: 'Run full pipeline with batching and log recall.',
        createdAt: oneDayAgo, updatedAt: oneDayAgo,
    },
]

export const demoChannels: ChatChannel[] = [
    { channelId: 'c-1', teamId: 'demo-team-1', name: 'general', description: 'Team general discussion', type: 'general', isPrivate: false, createdAt: oneWeekAgo, updatedAt: now },
    { channelId: 'c-2', teamId: 'demo-team-1', name: 'announcements', description: 'Official team announcements', type: 'announcement', isPrivate: false, allowedRoles: ['team_admin'], createdAt: oneWeekAgo, updatedAt: now },
    { channelId: 'c-3', teamId: 'demo-team-1', name: 'web-security', description: 'Web application security discussions', type: 'topic', topicId: 't-1', isPrivate: false, createdAt: oneWeekAgo, updatedAt: now },
    { channelId: 'c-4', teamId: 'demo-team-1', name: 'ctf-platform', description: 'CTF platform project coordination', type: 'project', projectId: 'p-1', isPrivate: false, createdAt: oneWeekAgo, updatedAt: now },
    { channelId: 'c-5', teamId: 'demo-team-2', name: 'general', description: 'AI team general chat', type: 'general', isPrivate: false, createdAt: oneWeekAgo, updatedAt: now },
    { channelId: 'c-6', teamId: 'demo-team-2', name: 'research', description: 'Research and paper discussions', type: 'research', isPrivate: false, createdAt: oneWeekAgo, updatedAt: now },
]

export const demoMessages: ChatMessage[] = [
    { messageId: 'm-1', channelId: 'c-1', teamId: 'demo-team-1', userId: demoUserId1, content: 'Good morning team 👋 Hope everyone had a great weekend!', isPinned: false, isImportant: false, reactions: { '👋': [demoUserId2, demoUserId3] }, mentions: [], attachments: [], createdAt: twoDaysAgo },
    { messageId: 'm-2', channelId: 'c-1', teamId: 'demo-team-1', userId: demoUserId2, content: 'Morning! Ready to crush the scoring API today.', isPinned: false, isImportant: false, reactions: { '💪': [demoUserId1] }, mentions: [], attachments: [], createdAt: twoDaysAgo },
    { messageId: 'm-3', channelId: 'c-2', teamId: 'demo-team-1', userId: demoUserId3, content: '📢 Reminder: Team sync this Thursday at 3PM UTC. Please submit your daily logs beforehand.', isPinned: true, isImportant: true, reactions: { '✅': [demoUserId1, demoUserId2] }, mentions: [], attachments: [], createdAt: oneDayAgo },
    { messageId: 'm-4', channelId: 'c-3', teamId: 'demo-team-1', userId: demoUserId1, content: 'Anyone struggled with DOM-based XSS in the PortSwigger labs? I just finished the advanced section — wild how sinks work.', isPinned: false, isImportant: false, reactions: {}, mentions: [], attachments: [], createdAt: oneDayAgo },
    { messageId: 'm-5', channelId: 'c-3', teamId: 'demo-team-1', userId: demoUserId2, content: 'Yeah — the client-side redirect sink took me a while. Happy to walk through my solution later.', isPinned: false, isImportant: false, reactions: {}, mentions: [demoUserId1], attachments: [], createdAt: oneDayAgo },
    { messageId: 'm-6', channelId: 'c-4', teamId: 'demo-team-1', userId: demoUserId2, content: 'Scoring API PR is up for review: implemented flag submit and basic leaderboard. Still need caching on the aggregation route.', isPinned: false, isImportant: false, reactions: { '👀': [demoUserId1, demoUserId3] }, mentions: [], attachments: [], createdAt: now },
    { messageId: 'm-7', channelId: 'c-5', teamId: 'demo-team-2', userId: demoUserId3, content: 'Transformer deep dive happening tonight — starting with the original Attention paper. Drop any resources that helped you!', isPinned: false, isImportant: false, reactions: { '🔥': [] }, mentions: [], attachments: [], createdAt: oneDayAgo },
]

export const demoContests: Contest[] = [
    {
        contestId: 'co-1', teamId: 'demo-team-1',
        name: 'Summer Security CTF',
        description: 'Internal 48-hour CTF with web, crypto, and forensics challenges.',
        startDate: futureOneWeek, endDate: futureTwoWeeks,
        participants: [demoUserId1, demoUserId2, demoUserId3],
        categories: ['web', 'crypto', 'forensics', 'osint'],
        status: 'upcoming', points: {},
        createdBy: demoUserId1, createdAt: oneWeekAgo, updatedAt: now,
    },
]

export const demoResearch: ResearchItem[] = [
    {
        researchId: 'res-1', teamId: 'demo-team-1',
        title: 'Modern CSRF Bypass Techniques',
        topicId: 't-1',
        researchQuestion: 'Which CSRF bypass techniques remain effective against modern browsers and frameworks?',
        description: 'Survey of CSRF defenses and research into practical bypasses on contemporary stacks.',
        assignedMembers: [demoUserId1, demoUserId2],
        relatedPapers: ['https://example.com/csrf-survey'],
        resources: ['r-2'],
        hypothesis: 'SameSite Lax remains the most impactful control but still has edge cases around unsafe HTTP methods.',
        methodology: 'Literature review → PoC verification → write-up',
        datasetLinks: [],
        findings: 'Early findings show ~12% of tested frameworks still exhibit CSRF-prone patterns.',
        researchGaps: 'Mobile/webview behavior remains understudied.',
        status: 'literature_review',
        notes: 'Schedule testing marathon once Lit Review is complete.',
        attachments: [],
        createdBy: demoUserId1, createdAt: oneWeekAgo, updatedAt: now,
    },
]

export const demoNotifications: Notification[] = [
    { notificationId: 'n-1', userId: demoUserId2, type: 'task_assigned', title: 'New task assigned', message: 'You were assigned to "Implement scoring REST API"', teamId: 'demo-team-1', taskId: 'tk-2', isRead: false, createdAt: twoDaysAgo },
    { notificationId: 'n-2', userId: demoUserId1, type: 'task_submitted', title: 'Task submitted', message: 'Task "Author 5 beginner web challenges" has been submitted for review', teamId: 'demo-team-1', taskId: 'tk-3', isRead: false, createdAt: now },
    { notificationId: 'n-3', userId: demoUserId2, type: 'mention', title: 'You were mentioned', message: 'Casey mentioned you in #web-security', teamId: 'demo-team-1', channelId: 'c-3', isRead: true, createdAt: oneDayAgo },
    { notificationId: 'n-4', userId: demoUserId3, type: 'new_announcement', title: 'New announcement', message: 'Reminder: Team sync this Thursday at 3PM UTC.', teamId: 'demo-team-1', channelId: 'c-2', isRead: false, createdAt: oneDayAgo },
]

export const demoInvites: TeamInvite[] = []
