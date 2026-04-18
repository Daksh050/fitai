import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import LandingPage from '@/components/pages/LandingPage'
import CinematicAuthPage from '@/components/pages/CinematicAuthPage'
import CinematicOnboardingPage from '@/components/pages/CinematicOnboardingPage'
import CinematicDashboardPage from '@/components/pages/CinematicDashboardPage'
import CinematicDietPlanPage from '@/components/pages/CinematicDietPlanPage'
import CinematicWorkoutPlanPage from '@/components/pages/CinematicWorkoutPlanPage'
import CinematicProgressPage from '@/components/pages/CinematicProgressPage'
import CinematicAppLayout from '@/components/layout/CinematicAppLayout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
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
              background: 'rgba(13,13,20,0.95)',
              color: '#fff',
              border: '1px solid rgba(0,255,136,0.2)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              borderRadius: 12,
            },
            success: { iconTheme: { primary: '#00ff88', secondary: '#050508' } },
            error: { iconTheme: { primary: '#ff6b35', secondary: '#050508' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth" element={<CinematicAuthPage />} />

          {/* Onboarding (needs auth) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <CinematicOnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* App shell (needs auth + onboarding) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <CinematicAppLayout />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<CinematicDashboardPage />} />
            <Route path="diet" element={<CinematicDietPlanPage />} />
            <Route path="workout" element={<CinematicWorkoutPlanPage />} />
            <Route path="progress" element={<CinematicProgressPage />} />
          </Route>

          {/* Root redirect: unauthenticated → landing, authenticated → dashboard */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
