import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { Dashboard } from './modules/lab/Dashboard';
import { ClinicDashboard } from './modules/clinic/ClinicDashboard';
import { OrderForm } from './modules/public/OrderForm';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const isOrderForm = window.location.pathname === '/order';
  const isRegister = window.location.pathname === '/register';

  if (isOrderForm) {
    return <OrderForm />;
  }

  if (isRegister) {
    return <RegisterPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (profile?.global_role === 'clinic_admin' || profile?.global_role === 'clinic_staff') {
    return <ClinicDashboard />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
