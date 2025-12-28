import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';

type AuthView = 'login' | 'signup';

function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <Signup onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <Login onNavigateToSignup={() => setAuthView('signup')} />;
  }

  if (user.role === 'patient') {
    return <PatientDashboard />;
  }

  if (user.role === 'doctor') {
    return <DoctorDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">Unknown user role</p>
    </div>
  );
}

export default App;
