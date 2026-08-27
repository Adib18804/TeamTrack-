export type GlobalRole = 'super_admin' | 'team_admin' | 'team_member'

export type TeamRole = 'team_admin' | 'team_member'

export type TeamStatus = 'active' | 'archived' | 'suspended'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'submitted' | 'under_review' | 'completed' | 'revision_required' | 'cancelled'

export type TaskReviewStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested'

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

export type ContestStatus = 'upcoming' | 'active' | 'completed' | 'archived'

export type ResearchStatus = 'idea' | 'planning' | 'literature_review' | 'data_collection' | 'experimentation' | 'analysis' | 'writing' | 'review' | 'completed'

export type ResourceType = 'course' | 'documentation' | 'video' | 'youtube_playlist' | 'lab' | 'ctf' | 'article' | 'research_paper' | 'dataset' | 'tool' | 'repository' | 'other'

export type ChannelType = 'general' | 'topic' | 'project' | 'research' | 'announcement'

export type NotificationType = 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'task_submitted' | 'task_approved' | 'revision_requested' | 'new_message' | 'mention' | 'new_announcement' | 'project_assigned' | 'research_update'

export interface TeamMembership {
  teamId: string
  role: TeamRole
  joinedAt: string
}

export interface User {
  userId: string
  fullName: string
  email: string
  avatar: string
  createdAt: string
  updatedAt: string
  globalRole: GlobalRole
  teamMemberships: TeamMembership[]
  emailVerified: boolean
}

export interface Team {
  teamId: string
  name: string
  slug: string
  description: string
  avatar: string
  banner: string
  domain: string
  topics: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  status: TeamStatus
}

export interface TeamInvite {
  inviteId: string
  teamId: string
  email: string
  token: string
  invitedBy: string
  createdAt: string
  expiresAt: string
  used: boolean
  usedBy?: string
  usedAt?: string
}

export interface Domain {
  domainId: string
  teamId: string
  name: string
  description: string
  icon: string
  color: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Topic {
  topicId: string
  teamId: string
  domainId: string
  name: string
  description: string
  icon: string
  color: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Subtopic {
  subtopicId: string
  teamId: string
  topicId: string
  name: string
  description: string
  icon: string
  color: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Task {
  taskId: string
  teamId: string
  projectId?: string
  title: string
  description: string
  topicId?: string
  subtopicId?: string
  priority: TaskPriority
  difficulty: TaskDifficulty
  status: TaskStatus
  assignedUsers: string[]
  createdBy: string
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  progressPercentage: number
  attachments: Attachment[]
  resources: ResourceRef[]
  proof: Attachment[]
  reviewStatus: TaskReviewStatus
  reviewComments: ReviewComment[]
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
}

export interface ResourceRef {
  resourceId: string
  title: string
}

export interface ReviewComment {
  commentId: string
  userId: string
  content: string
  createdAt: string
}

export interface DailyLog {
  logId: string
  teamId: string
  userId: string
  date: string
  relatedTaskId?: string
  topicId?: string
  plannedHours: number
  actualHours: number
  workSummary: string
  whatILearned: string
  challenges: string
  blockers: string
  nextSteps: string
  proof?: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  projectId: string
  teamId: string
  name: string
  description: string
  status: ProjectStatus
  members: string[]
  startDate?: string
  endDate?: string
  progress: number
  tags: string[]
  objectives: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Resource {
  resourceId: string
  teamId: string
  title: string
  description: string
  type: ResourceType
  url: string
  topicId?: string
  difficulty: TaskDifficulty
  estimatedDuration?: number
  tags: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Contest {
  contestId: string
  teamId: string
  name: string
  description: string
  startDate: string
  endDate: string
  participants: string[]
  categories: string[]
  status: ContestStatus
  points: Record<string, number>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ContestSubmission {
  submissionId: string
  contestId: string
  teamId: string
  userId: string
  challengeId?: string
  score: number
  writeup?: string
  evidence?: Attachment[]
  createdAt: string
}

export interface ResearchItem {
  researchId: string
  teamId: string
  title: string
  topicId?: string
  researchQuestion: string
  description: string
  assignedMembers: string[]
  relatedPapers: string[]
  resources: string[]
  hypothesis: string
  methodology: string
  datasetLinks: string[]
  findings: string
  researchGaps: string
  status: ResearchStatus
  notes: string
  attachments: Attachment[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ChatChannel {
  channelId: string
  teamId: string
  name: string
  description: string
  type: ChannelType
  topicId?: string
  projectId?: string
  isPrivate: boolean
  allowedRoles?: TeamRole[]
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  messageId: string
  channelId: string
  teamId: string
  userId: string
  content: string
  replyTo?: string
  editedAt?: string
  isPinned: boolean
  isImportant: boolean
  reactions: Record<string, string[]>
  mentions: string[]
  attachments: Attachment[]
  createdAt: string
}

export interface TypingIndicator {
  userId: string
  channelId: string
  startedAt: string
}

export interface Notification {
  notificationId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  teamId?: string
  taskId?: string
  projectId?: string
  channelId?: string
  messageId?: string
  researchId?: string
  isRead: boolean
  createdAt: string
}

export interface Roadmap {
  roadmapId: string
  teamId: string
  domainId: string
  name: string
  description: string
  stages: RoadmapStage[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface RoadmapStage {
  stageId: string
  name: string
  description: string
  order: number
  resources: string[]
  tasks: string[]
}

export interface LearningProgress {
  progressId: string
  userId: string
  teamId: string
  resourceId?: string
  roadmapId?: string
  stageId?: string
  topicId?: string
  completed: boolean
  progressPercentage: number
  startedAt?: string
  completedAt?: string
  updatedAt: string
}
