import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './hooks/useToast.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import AppShell from './components/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import AddPlantPage from './pages/AddPlantPage.jsx';
import EditPlantPage from './pages/EditPlantPage.jsx';
import PlantDetailPage from './pages/PlantDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CareHistoryPage from './pages/CareHistoryPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(92,122,92,0.2)',
          borderTopColor: '#5C7A5C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<InventoryPage />} />
              <Route path="plants/new" element={<AddPlantPage />} />
              <Route path="plants/:id" element={<PlantDetailPage />} />
              <Route path="plants/:id/edit" element={<EditPlantPage />} />
              <Route path="history" element={<CareHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
