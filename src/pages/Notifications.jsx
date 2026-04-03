import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, Star, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        async (payload) => {
          // Fetch the actor details for the new notification
          const { data: actor } = await supabase
            .from('users')
            .select('name, avatar_url, role')
            .eq('id', payload.new.actor_id)
            .single();
          
          const enrichedNotif = { ...payload.new, actor };
          setNotifications(prev => [enrichedNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:users!notifications_actor_id_fkey(name, avatar_url, role)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read in DB if unread
    if (!notif.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id);
      
      setNotifications(prev => prev.map(n => 
        n.id === notif.id ? { ...n, is_read: true } : n
      ));
    }

    // 2. Navigate to appropriate sanctuary
    if (notif.type === 'follow') {
      navigate(`/profile/${notif.actor_id}`);
    } else if (notif.post_id) {
      navigate(`/profile/${user.id}`); // Simple redirect to profile where posts are visible
    } else if (notif.tutorial_id) {
      navigate('/tutorials');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return { Icon: Heart, color: 'text-red-500', bg: 'bg-red-50', label: 'appreciated' };
      case 'comment': return { Icon: MessageCircle, color: 'text-pragya-green', bg: 'bg-pragya-mint/20', label: 'reflected on' };
      case 'follow': return { Icon: UserPlus, color: 'text-[#F7941D]', bg: 'bg-[#F7941D]/10', label: 'followed' };
      default: return { Icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'engaged' };
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pragya-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-6 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-serif font-bold text-pragya-green mb-1 italic">Notifications</h1>
          <p className="text-[9px] uppercase tracking-[0.4em] font-black text-pragya-dark/30">Recent Activity</p>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-pragya-mint/20 text-pragya-green rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pragya-mint/40 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-pragya-mint/40 flex flex-col items-center justify-center space-y-6"
          >
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
               <Clock className="w-10 h-10" />
            </div>
            <p className="text-pragya-dark/40 italic font-serif text-lg leading-relaxed">
              No notifications yet.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, index) => {
              const { Icon, color, bg, label } = getIcon(notif.type);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative p-5 rounded-[2.5rem] flex items-start gap-4 transition-all cursor-pointer border shadow-sm ${
                    notif.is_read 
                      ? 'bg-white/40 border-pragya-mint/10 opacity-70 grayscale-[0.3]' 
                      : 'bg-white shadow-xl shadow-pragya-mint/5 border-pragya-mint/20 hover:scale-[1.02]'
                  }`}
                >
                  {/* Unread Indicator Glow */}
                  {!notif.is_read && (
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-8 bg-[#F7941D] rounded-full shadow-lg shadow-[#F7941D]/40" />
                  )}

                  {/* Actor Avatar Sanctuary */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-pragya-mint/20 bg-pragya-beige p-0.5 transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                      {notif.actor?.avatar_url ? (
                        <img src={notif.actor.avatar_url} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pragya-mint font-black text-xl bg-white rounded-xl uppercase">
                          {notif.actor?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg ${bg} ${color} flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Notification Essence */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif italic font-bold text-pragya-dark text-lg truncate leading-tight group-hover:text-pragya-green transition-colors">
                        {notif.actor?.name || 'Practitioner'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter shadow-sm ${notif.actor?.role === 'Instructor' ? 'bg-[#1F3E44] text-white' : 'bg-[#F7941D] text-white'}`}>
                        {notif.actor?.role}
                      </span>
                    </div>
                    
                    <p className="text-sm leading-relaxed text-pragya-dark/60 italic line-clamp-2">
                       {label} {notif.type === 'comment' ? 'your wisdom' : 'you'}:
                       {notif.content && (
                         <span className="block font-medium mt-1 text-pragya-dark not-italic bg-stone-50 p-2 rounded-xl border border-stone-100">
                           "{notif.content}"
                         </span>
                       )}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3 text-[9px] uppercase tracking-[0.2em] font-black text-pragya-dark/20 italic">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Pulsing Resonance Star */}
                  <div className={`self-center transition-opacity duration-300 ${notif.is_read ? 'opacity-0 group-hover:opacity-20' : 'opacity-100'}`}>
                    <Star className={`w-5 h-5 text-pragya-mint ${!notif.is_read ? 'animate-pulse' : ''}`} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-20 text-center">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-pragya-mint to-transparent mx-auto mb-6" />
        <p className="text-[9px] uppercase tracking-[0.4em] font-black text-pragya-dark/10 italic">
          Pragya Yog School Academy
        </p>
      </div>
    </div>
  );
};

export default Notifications;
