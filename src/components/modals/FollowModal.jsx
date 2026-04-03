import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const FollowModal = ({ isOpen, onClose, type, userId, currentUserId }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchFollowUsers();
    }
  }, [isOpen, type, userId]);

  const fetchFollowUsers = async () => {
    setLoading(true);
    try {
      // Fetch either followers or following names
      const column = type === 'followers' ? 'follower_id' : 'following_id';
      const targetColumn = type === 'followers' ? 'following_id' : 'follower_id';

      // We want the identities of the users in this list
      // If type is 'followers', we are looking for rows where 'following_id' is the profile owner
      // and we want the 'follower_id' profiles.
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower:follower_id (id, name, avatar_url, role, bio),
          following:following_id (id, name, avatar_url, role, bio)
        `)
        .eq(targetColumn, userId);

      if (error) throw error;

      const formattedUsers = data.map(row => type === 'followers' ? row.follower : row.following);
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching follow list:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header Area */}
          <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
            <h2 className="text-2xl font-serif italic font-black text-white capitalize tracking-tight">
              {type}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors group"
            >
              <X className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Search Sanctuary */}
          <div className="px-8 py-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#F7941D] transition-colors" />
              <input 
                type="text"
                placeholder={`Discover within ${type}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-[#F7941D]/40 focus:ring-4 focus:ring-[#F7941D]/5 transition-all"
              />
            </div>
          </div>

          {/* List Area */}
          <div className="px-8 pb-10 max-h-[460px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-[#F7941D] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Manifesting Circles...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-3xl hover:bg-white/5 transition-all group cursor-pointer"
                    onClick={() => { navigate(`/profile/${user.id}`); onClose(); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-lg bg-white/5">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-serif text-white/20">
                            {user.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-sm group-hover:text-[#F7941D] transition-colors">{user.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{user.role}</p>
                      </div>
                    </div>
                    {user.id !== currentUserId && (
                       <button className="p-2.5 bg-white/5 text-white/40 rounded-xl hover:bg-[#F7941D] hover:text-white transition-all transform active:scale-95">
                        <UserPlus className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                  <UserPlus className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-xl font-serif italic font-black text-white mb-2">{type.charAt(0).toUpperCase() + type.slice(1)} Sanctuary</h3>
                <p className="text-xs text-white/30 max-w-[240px] leading-relaxed">
                  {search 
                    ? "Your search reveals no matches within this circle." 
                    : `Your ${type} list is currently a canvas of quiet. Once bonds are forged, they will appear here.`}
                </p>
                {type === 'following' && !search && (
                   <button 
                    onClick={() => { navigate('/search'); onClose(); }}
                    className="mt-8 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                  >
                    Forge New Bonds
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
             <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Pragya Community Circles</p>
             <div className="w-1.5 h-1.5 rounded-full bg-[#F7941D]/40" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FollowModal;
