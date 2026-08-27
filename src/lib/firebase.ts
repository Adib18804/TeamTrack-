import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:demo',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
}

const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key'

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let analytics: Analytics | undefined

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

auth = getAuth(app)
db = getFirestore(app)
storage = getStorage(app)

isSupported().then(supported => {
  if (supported && !isDemoMode) {
    analytics = getAnalytics(app)
  }
})

export { app, auth, db, storage, analytics, isDemoMode }

export const COLLECTIONS = {
  USERS: 'users',
  TEAMS: 'teams',
  TEAM_INVITES: 'team_invites',
  DOMAINS: 'domains',
  TOPICS: 'topics',
  SUBTOPICS: 'subtopics',
  TASKS: 'tasks',
  DAILY_LOGS: 'daily_logs',
  PROJECTS: 'projects',
  RESOURCES: 'resources',
  CONTESTS: 'contests',
  CONTEST_SUBMISSIONS: 'contest_submissions',
  RESEARCH: 'research',
  CHANNELS: 'channels',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  ROADMAPS: 'roadmaps',
  LEARNING_PROGRESS: 'learning_progress',
} as const
