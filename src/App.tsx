import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthInit } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import { PageShell } from '@/components/layout/PageShell';
import { ToastContainer } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { AuthCallbackPage } from '@/routes/auth-callback';

const HomePage = lazy(() => import('@/routes/home').then((m) => ({ default: m.HomePage })));
const ModelDetailPage = lazy(() =>
  import('@/routes/model-detail').then((m) => ({ default: m.ModelDetailPage })),
);
const UploadPage = lazy(() =>
  import('@/routes/admin/upload').then((m) => ({ default: m.UploadPage })),
);
const ModelsAdminPage = lazy(() =>
  import('@/routes/admin/models').then((m) => ({ default: m.ModelsAdminPage })),
);
const TagsAdminPage = lazy(() =>
  import('@/routes/admin/tags').then((m) => ({ default: m.TagsAdminPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

const pageLoader = (
  <div className="h-full flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuthStore();
  if (isLoading) return pageLoader;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/"
        element={
          <PageShell>
            <Suspense fallback={pageLoader}>
              <HomePage />
            </Suspense>
          </PageShell>
        }
      />
      <Route
        path="/models/:slug"
        element={
          <PageShell>
            <Suspense fallback={pageLoader}>
              <ModelDetailPage />
            </Suspense>
          </PageShell>
        }
      />
      <Route
        path="/admin/upload"
        element={
          <PageShell>
            <RequireAdmin>
              <Suspense fallback={pageLoader}>
                <UploadPage />
              </Suspense>
            </RequireAdmin>
          </PageShell>
        }
      />
      <Route
        path="/admin/models"
        element={
          <PageShell>
            <RequireAdmin>
              <Suspense fallback={pageLoader}>
                <ModelsAdminPage />
              </Suspense>
            </RequireAdmin>
          </PageShell>
        }
      />
      <Route
        path="/admin/tags"
        element={
          <PageShell>
            <RequireAdmin>
              <Suspense fallback={pageLoader}>
                <TagsAdminPage />
              </Suspense>
            </RequireAdmin>
          </PageShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
