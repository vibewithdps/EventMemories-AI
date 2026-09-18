import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FaceScanPage } from './pages/FaceScanPage';
import { MyGalleryPage } from './pages/MyGalleryPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const AppContent = () => {
  const { user, loading } = useAuth();
  
  // URL Hash synchronization for clean bookmarkable routes
  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '');
    if (['home', 'login', 'register', 'dashboard', 'scan', 'gallery', 'admin-login', 'admin-dashboard'].includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [currentView, setCurrentView] = useState(getInitialView);

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentView) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (['dashboard', 'scan', 'gallery'].includes(currentView) && !user) {
        handleNavigate('login');
      }
      if (currentView === 'admin-dashboard' && user?.role !== 'admin') {
        handleNavigate('admin-login');
      }
    }
  }, [currentView, user, loading]);

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-dark-900 dark:bg-dark-950 dark:text-zinc-100 transition-colors duration-300">
      <Navbar currentView={currentView} setCurrentView={handleNavigate} />
      
      <main className="flex-1">
        {currentView === 'home' && <LandingPage setCurrentView={handleNavigate} />}
        {currentView === 'login' && <LoginPage initialMode="login" setCurrentView={handleNavigate} />}
        {currentView === 'register' && <LoginPage initialMode="register" setCurrentView={handleNavigate} />}
        {currentView === 'dashboard' && <DashboardPage setCurrentView={handleNavigate} />}
        {currentView === 'scan' && <FaceScanPage setCurrentView={handleNavigate} />}
        {currentView === 'gallery' && <MyGalleryPage setCurrentView={handleNavigate} />}
        {currentView === 'admin-login' && <AdminLoginPage setCurrentView={handleNavigate} />}
        {currentView === 'admin-dashboard' && <AdminDashboardPage setCurrentView={handleNavigate} />}
      </main>

      <Footer setCurrentView={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
