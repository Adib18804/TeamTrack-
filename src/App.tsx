import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import ResetPassword from './pages/auth/ResetPassword'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import ProjectsPage from './pages/ProjectsPage'
import ChatPage from './pages/ChatPage'
import ResourcesPage from './pages/ResourcesPage'
import LearningPage from './pages/LearningPage'
import ResearchPage from './pages/ResearchPage'
import ContestsPage from './pages/ContestsPage'
import DailyLogsPage from './pages/DailyLogsPage'
import MembersPage from './pages/MembersPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import SuperAdminRoute from './components/SuperAdminRoute'
import {
  CalendarPage, ActivityPage, AnalyticsPage, KnowledgeBasePage, TaskDetailPage
} from './pages/PlaceholderPages'
import { Toaster } from './components/ui/toaster'
import { useEffect } from 'react'

function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/onboarding" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Onboarding />
                  <Toaster />
                </div>
              </ProtectedRoute>
            } />

            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="tasks/:id" element={<TaskDetailPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="projects/:id" element={<ProjectsPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="resources" element={<ResourcesPage />} />
                    <Route path="learning" element={<LearningPage />} />
                    <Route path="learning/domains/:id" element={<LearningPage />} />
                    <Route path="learning/topics/:id" element={<LearningPage />} />
                    <Route path="research" element={<ResearchPage />} />
                    <Route path="contests" element={<ContestsPage />} />
                    <Route path="daily-logs" element={<DailyLogsPage />} />
                    <Route path="members" element={<MembersPage />} />
                    <Route path="admin" element={<SuperAdminRoute><AdminPage /></SuperAdminRoute>} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="settings/*" element={<SettingsPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="knowledge" element={<KnowledgeBasePage />} />
                    <Route path="*" element={
                      <div className="py-20 text-center max-w-xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-bold mb-3">404</h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-6">Page not found or still under construction.</p>
                        <a className="btn-primary inline-flex" href="/dashboard">Back to dashboard</a>
                      </div>
                    } />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
