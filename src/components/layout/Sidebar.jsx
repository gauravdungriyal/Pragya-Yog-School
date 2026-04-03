import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  PlayCircle, 
  MessageSquare, 
  Search, 
  Bell, 
  PlusSquare, 
  User, 
  Settings,
  LogOut,
  Sparkles,
  Ghost
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const SidebarItem = ({ to, icon: Icon, label, badgeCount }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group mx-2 relative ${
        isActive 
          ? 'bg-pragya-green text-white shadow-lg shadow-pragya-green/20' 
          : 'text-pragya-dark/60 hover:bg-stone-100/50 hover:text-pragya-green'
      }`
    }
  >
    <div className="relative">
      <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
      {badgeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </div>
    <span className="font-semibold hidden lg:block tracking-tight">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { signOut, user, profile, role, activePartnerId, setActivePartnerId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();
    fetchUnreadMessagesCount();

    // Listen for new notifications OR read status updates
    const notificationsChannel = supabase
      .channel('sidebar_notifs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .subscribe();

    // Listen for new messages (Intelligent Filtering)
    const messagesChannel = supabase
      .channel('sidebar_messages')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          // INTELLIGENCE: 
          // 1. If it's an UPDATE (marking as read), we ALWAYS want to re-fetch to clear the badge.
          // 2. If it's an INSERT (new message), we only re-fetch if it's from someone ELSE.
          if (payload.eventType === 'UPDATE' || payload.new.sender_id !== activePartnerId) {
            fetchUnreadMessagesCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, activePartnerId]); // ADDED activePartnerId to dependency to ensure logic is current

  // Clear counts locally when on respective pages
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
    if (location.pathname === '/messages') {
      setUnreadMessagesCount(0);
    }
  }, [location.pathname]);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setUnreadCount(count || 0);
  };

  const fetchUnreadMessagesCount = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    
    setUnreadMessagesCount(count || 0);
  };

  const allNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/tutorials', icon: PlayCircle, label: 'Tutorials' },
    { to: '/messages', icon: MessageSquare, label: 'Messages', protected: true },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/notifications', icon: Bell, label: 'Notifications', protected: true },
    { to: '/create', icon: PlusSquare, label: 'Create', protected: true },
    { to: `/profile/${user?.id}`, icon: User, label: 'Profile', protected: true },
    { to: '/settings', icon: Settings, label: 'Settings', protected: true },
  ];

  // Filter items if user is a Guest
  const filteredNavItems = allNavItems.filter(item => {
    if (!user && item.protected) return false;
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-72 bg-white border-r border-pragya-mint/20 flex flex-col pt-4 pb-8 z-40">
      <div className="px-6 mb-8">
        <div className="w-18 h-auto flex items-center justify-start">
          <img src="/pragyalogo.webp" alt="Pragya Yog School" className="h-12 w-auto object-contain" />
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        {filteredNavItems.map((item) => (
          <SidebarItem 
            key={item.label} 
            to={item.to} 
            icon={item.icon} 
            label={item.label} 
            badgeCount={
              item.label === 'Notifications' ? unreadCount : 
              item.label === 'Messages' ? unreadMessagesCount : 0
            }
          />
        ))}
      </nav>

      <div className="mt-auto px-2 space-y-4">
        {user ? (
          <div className="px-2 hidden lg:block">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-pragya-mint/10 shadow-sm border-dashed">
              <div className="w-10 h-10 rounded-full bg-pragya-mint flex items-center justify-center text-white font-bold shadow-sm overflow-hidden border border-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || 'P'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-pragya-dark truncate">
                  {profile?.name || 'Sanctuary Member'}
                </p>
                <p className="text-[10px] text-pragya-green/80 uppercase tracking-widest font-black leading-none mt-1">
                  {role}
                </p>
              </div>
              <button 
                onClick={signOut}
                className="p-2 text-pragya-dark/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95 group/logout"
                title="Sign Out of Sanctuary"
              >
                <LogOut className="w-4.5 h-4.5 group-hover/logout:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        ) : null}
        {!user && (
          <div className="px-2 hidden lg:block">
            <div className="w-full flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-pragya-mint/5 shadow-sm">
              {/* Profile Info - Non Interactive */}
              <div className="flex items-center gap-3 flex-1 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold shadow-sm overflow-hidden border border-white">
                   <img src="/guest.webp" alt="Guest" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-pragya-dark truncate">Guest</p>
                  <p className="text-[10px] text-pragya-green/40 uppercase tracking-widest font-black leading-none mt-1">
                    Browse Mode
                  </p>
                </div>
              </div>

              {/* Sign Out Action - Interactive */}
              <button 
                onClick={signOut}
                className="p-2 text-pragya-dark/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95 group/logout"
                title="Exit Browse Mode"
              >
                <LogOut className="w-4.5 h-4.5 group-hover/logout:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
