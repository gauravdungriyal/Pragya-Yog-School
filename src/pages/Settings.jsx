import React, { useState, useEffect } from 'react';
import { User, Bell, Lock, Globe, Moon, Shield, LogOut, ChevronRight, Camera, Check, X, Loader2, MapPin, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SettingsItem = ({ icon: Icon, title, description, toggle, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-pragya-mint/10 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="p-2.5 bg-stone-50 rounded-xl text-pragya-green group-hover:bg-pragya-mint/30 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="font-bold text-pragya-dark text-sm">{title}</p>
        <p className="text-xs text-pragya-dark/50">{description}</p>
      </div>
    </div>
    {toggle ? (
      <div className="w-10 h-5 bg-pragya-sage/30 rounded-full relative">
        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
      </div>
    ) : (
      <ChevronRight className="w-5 h-5 text-pragya-mint group-hover:text-pragya-green transition-colors" />
    )}
  </button>
);

const Settings = () => {
  const { signOut, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({ 
    name: '', 
    bio: '', 
    role: 'Learner',
    location: '',
    website: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditData({ 
        name: profile.name || '', 
        bio: profile.bio || '',
        role: profile.role || 'Learner',
        location: profile.location || '',
        website: profile.website || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editData.name,
          bio: editData.bio,
          role: editData.role,
          location: editData.location,
          website: editData.website
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      setIsEditing(false);
      navigate('/profile/me');
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, title: 'Profile Information', description: 'Update your name, bio, and presence', onClick: () => setIsEditing(true) },
      ]
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-serif font-black text-pragya-green mb-8 px-2 tracking-tight italic">Settings</h1>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-pragya-mint/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F7941D] to-pragya-green" />
            
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-serif font-bold text-pragya-green italic">Edit Profile</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-pragya-green/30 mt-1">Update your profile information</p>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-3 hover:bg-stone-50 rounded-full transition-colors border border-transparent hover:border-pragya-mint/10"
              >
                <X className="w-5 h-5 text-pragya-dark/40" />
              </button>
            </div>

            <div className="space-y-10">
              {/* Avatar Selection Area */}
              <div className="flex flex-col items-center gap-6 pb-6 border-b border-pragya-mint/5">
                <div className="relative group">
                  <div className="w-36 h-36 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-stone-100 p-1">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl font-serif text-pragya-green opacity-20 bg-pragya-mint/5 rounded-full">
                        {profile?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Change Photo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Identity Form Suite */}
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-pragya-green/40 mb-3 px-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full p-4 bg-stone-50/50 border-2 border-pragya-mint/5 rounded-2xl focus:ring-8 focus:ring-pragya-sage/5 focus:border-pragya-sage/40 transition-all outline-none text-sm font-bold placeholder:text-pragya-dark/20"
                      placeholder="Enter your name..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-pragya-green/40 mb-3 px-1">Website</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pragya-mint" />
                      <input 
                        type="url" 
                        value={editData.website}
                        onChange={(e) => setEditData({...editData, website: e.target.value})}
                        className="w-full p-4 pl-12 bg-stone-50/50 border-2 border-pragya-mint/5 rounded-2xl focus:ring-8 focus:ring-pragya-sage/5 focus:border-pragya-sage/40 transition-all outline-none text-sm font-bold placeholder:text-pragya-dark/20"
                        placeholder="www.wisdom.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-pragya-green/40 mb-3 px-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pragya-mint" />
                    <input 
                      type="text" 
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      className="w-full p-4 pl-12 bg-stone-50/50 border-2 border-pragya-mint/5 rounded-2xl focus:ring-8 focus:ring-pragya-sage/5 focus:border-pragya-sage/40 transition-all outline-none text-sm font-bold placeholder:text-pragya-dark/20"
                      placeholder="Ahmedabad, India..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-pragya-green/40 mb-3 px-1">Bio</label>
                  <textarea 
                    rows={4}
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full p-4 bg-stone-50/50 border-2 border-pragya-mint/5 rounded-2xl focus:ring-8 focus:ring-pragya-sage/5 focus:border-pragya-sage/40 transition-all outline-none text-sm font-bold resize-none placeholder:text-pragya-dark/20"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-5 bg-[#F7941D] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-[#F7941D]/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 shadow-sm" />}
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-5 bg-stone-100 text-pragya-green/40 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl overflow-hidden border border-pragya-mint/10">
            <div className="px-8 py-5 bg-stone-50/20 border-b border-pragya-mint/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-pragya-green/40 italic">
                {section.title}
              </h2>
            </div>
            <div className="divide-y divide-pragya-mint/5">
              {section.items.map((item, i) => (
                <SettingsItem key={i} {...item} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl overflow-hidden border border-pragya-mint/10">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-6 p-8 text-red-500 hover:bg-red-50/50 transition-all group"
          >
            <div className="p-4 bg-red-50 rounded-[1.5rem] group-hover:bg-red-100/50 transition-colors">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-black italic text-xl">Sign Out</p>
              <p className="text-xs font-medium text-red-400">Sign out of your account</p>
            </div>
            <ChevronRight className="w-6 h-6 text-red-200 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
        
        <div className="text-center py-10 opacity-30">
          <div className="w-10 h-10 bg-pragya-green/5 rounded-xl flex items-center justify-center text-pragya-green font-serif font-black mx-auto mb-4">
            P
          </div>
          <p className="text-[9px] font-black tracking-[0.3em] uppercase">Pragya Yog School — v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
