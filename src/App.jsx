import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/auth/SplashScreen';
import RoleSelection from './components/auth/RoleSelection';
import LoginForm from './components/auth/LoginForm';
import LoadingQuote from './components/auth/LoadingQuote';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Tutorials from './pages/Tutorials';
import Messages from './pages/Messages';

// Placeholder Pages (will be created later)
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const AppContent = () => {
  const { user, loading: authLoading, role } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleLoading, setShowRoleLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Reset state on logout
  useEffect(() => {
    if (!authLoading && !user && !role) {
      setSelectedRole(null);
      setIsReady(false);
      setShowRoleLoading(false);
    }
  }, [user, role, authLoading]);

  // Initial Splash Logic
  useEffect(() => {
    if (!authLoading && !user && !role && isReady) {
      setSelectedRole(null);
      setIsReady(false);
      setShowRoleLoading(false);
    }
  }, [user, role, authLoading, isReady]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // If no role selected yet
  if (!role && !selectedRole) {
    return <RoleSelection onSelect={(r) => setSelectedRole(r)} />;
  }

  // If role is guest, show quote and then proceed
  if (selectedRole === 'guest' && !isReady) {
    return <LoadingQuote role="guest" onFinish={() => setIsReady(true)} />;
  }

  // If role is Learner/Instructor and not logged in
  if ((selectedRole === 'Instructor' || selectedRole === 'Learner') && !user && !isReady) {
    return (
      <LoginForm 
        role={selectedRole} 
        onLoginSuccess={() => setShowRoleLoading(true)} 
        onRoleChange={(r) => setSelectedRole(r)}
      />
    );
  }

  // Show role-specific quote after login/guest access
  if (showRoleLoading && !isReady) {
    return <LoadingQuote role={selectedRole || role} onFinish={() => setIsReady(true)} />;
  }

  // Main App Layout (Authenticated or Guest Ready)
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:id" element={<Profile />} />
        
        {/* Protected Sanctuaries - Redirect Guests to Entry */}
        <Route path="/messages" element={user ? <Messages /> : <Navigate to="/" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/" />} />
        <Route path="/create" element={user ? <Create /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
