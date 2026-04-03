import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(localStorage.getItem('pragya_role') || null);
  const [activePartnerId, setActivePartnerId] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const selectRole = (newRole) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem('pragya_role', newRole);
    } else {
      localStorage.removeItem('pragya_role');
    }
  };

  const refreshProfile = () => {
    if (user) fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('pragya_role');
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      session, user, profile, loading, role, selectRole, signOut, refreshProfile,
      activePartnerId, setActivePartnerId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
