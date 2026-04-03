import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const LoginForm = ({ role, onLoginSuccess, onRoleChange }) => {
  const { selectRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Initial Authentication
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Please use the Login ID and Password provided by Pragya Yog School offices.');
        }
        throw authError;
      }

      if (!user) throw new Error('Authentication failed. Please try again.');

      // 2. Role Validation (Security Check)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('Could not verify account role. Please contact support.');
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error(`Access Denied: This account is registered as a ${profile.role}, not as an ${role}.`);
      }

      // 3. Success
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    onRoleChange('Guest');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 tracking-tight">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-pragya-sage py-8 px-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20"></div>
          <h2 className="text-3xl font-serif text-white mb-2 relative z-10">
            Welcome Back
          </h2>
          <p className="text-white/80 italic relative z-10">Accessing as {role}</p>
        </div>

        <div className="p-10 space-y-6">
          <div className="text-center">
            <p className="text-xs text-pragya-dark/50 leading-relaxed">
              Please enter the credentials provided to you at the 
              <strong> Pragya Yog School </strong> physical offices.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pragya-dark/40" />
              <input
                type="email"
                placeholder="Login ID (Email)"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-pragya-mint/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-pragya-green/5 transition-all font-medium"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pragya-dark/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-pragya-beige/30 border border-pragya-mint/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pragya-sage/50 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-pragya-dark/30 hover:text-pragya-green transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-pragya-green text-white rounded-xl font-bold shadow-lg shadow-pragya-green/20 hover:bg-pragya-dark transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating...</span>
                </div>
              ) : 'Sign In'}
            </button>
          </form>


          <div className="flex flex-col gap-3 pt-4 border-t border-pragya-mint/30">
            <button
              type="button"
              onClick={() => {
                selectRole(null);
                onRoleChange(null);
              }}
              className="text-pragya-dark/40 text-xs font-bold hover:text-pragya-green transition-colors flex items-center justify-center gap-1"
            >
              <span>←</span>
              <span>Back to Role Selection</span>
            </button>
            <button
              type="button"
              onClick={handleGuestContinue}
              className="text-pragya-green text-sm font-bold hover:underline"
            >
              No account? Explore as Guest
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
