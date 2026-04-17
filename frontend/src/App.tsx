import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import AuthPage from '@/components/pages/AuthPage'
import OnboardingPage from '@/components/pages/OnboardingPage'
import DashboardPage from '@/components/pages/DashboardPage'
import DietPlanPage from '@/components/pages/DietPlanPage'
import WorkoutPlanPage from '@/components/pages/WorkoutPlanPage'
import ProgressPage from '@/components/pages/ProgressPage'
import AppLayout from '@/components/layout/AppLayout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user?.is_onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0c0c26',
              color: '#fff',
              border: '1px solid rgba(200,255,0,0.2)',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#c8ff00', secondary: '#0c0c26' } },
          }}
        />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <AppLayout />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="diet" element={<DietPlanPage />} />
            <Route path="workout" element={<WorkoutPlanPage />} />
            <Route path="progress" element={<ProgressPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
