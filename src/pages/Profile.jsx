import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Heart, MessageCircle, Edit3, Settings as SettingsIcon, MapPin, Link as LinkIcon, Calendar, Film, PlayCircle, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import FollowModal from '../components/modals/FollowModal';
import PostModal from '../components/home/PostModal';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const targetId = id === 'me' ? authUser?.id : id || authUser?.id;
  const isOwnProfile = targetId === authUser?.id;
  
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('followers');
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetId) return;
      setLoading(true);
      try {
        // 1. Fetch User Profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', targetId)
          .single();

        if (userError) throw userError;
        
        // 2. Fetch User Stats (Posts, Followers, Following)
        const [postRes, followerRes, followingRes, followCheck, tutorialRes] = await Promise.all([
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', targetId),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetId),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetId),
          isOwnProfile ? { data: null } : supabase.from('follows').select('*').eq('follower_id', authUser?.id).eq('following_id', targetId).single(),
          supabase.from('tutorials').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
        ]);
        
        setStats({
          posts: postRes.count || 0,
          followers: followerRes.count || 0,
          following: followingRes.count || 0
        });

        if (followCheck.data) setIsFollowing(true);
        setTutorials(tutorialRes.data || []);

        setProfile(userData);

        // 3. Fetch User Posts
        const { data: userPosts, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetId)
          .order('created_at', { ascending: false });

        if (postError) throw postError;
        setPosts(userPosts || []);

      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetId, authUser?.id, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!authUser || isOwnProfile || followLoading) return;
    
    setFollowLoading(true);
    // Optimistic UI
    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);
    setStats(prev => ({ 
      ...prev, 
      followers: prevFollowing ? prev.followers - 1 : prev.followers + 1 
    }));

    try {
      if (prevFollowing) {
        await supabase.from('follows').delete().eq('follower_id', authUser.id).eq('following_id', targetId);
      } else {
        await supabase.from('follows').insert({ follower_id: authUser.id, following_id: targetId });
      }
    } catch (err) {
      console.error('Follow error:', err);
      // Revert on error
      setIsFollowing(prevFollowing);
      setStats(prev => ({ 
        ...prev, 
        followers: prevFollowing ? prev.followers + 1 : prev.followers - 1 
      }));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !authUser) return;

    setBannerLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}/banner-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('users')
        .update({ banner_url: publicUrl })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, banner_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading banner:', err);
    } finally {
      setBannerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-pragya-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif text-pragya-green italic">Souls not found...</h2>
        <p className="text-pragya-dark/50">This user hasn't joined the sanctuary yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header Section */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-pragya-mint/20">
        <div 
          className="h-48 bg-[#F7941D] relative group/banner rounded-t-3xl"
          style={profile.banner_url ? {
            backgroundImage: `url(${profile.banner_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {isOwnProfile && (
            <label className="absolute inset-0 bg-black/0 group-hover/banner:bg-black/20 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 group-hover/banner:opacity-100 backdrop-blur-0 group-hover/banner:backdrop-blur-[2px]">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={bannerLoading}
              />
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 flex items-center gap-2 text-white scale-90 group-hover/banner:scale-100 transition-transform">
                {bannerLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Edit Horizon</span>
                  </>
                )}
              </div>
            </label>
          )}

          <div className="absolute -bottom-16 left-10 z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-[#F7941D] flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden group/avatar relative">
               {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
            </div>
          </div>
        </div>
        
        <div className="pt-20 pb-10 px-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-pragya-green mb-1">{profile.name}</h1>
              <p className="text-pragya-dark/60 font-medium mb-4">{profile.role} @ Pragya Yog School</p>
              
              <div className="flex flex-wrap gap-6 text-sm text-pragya-dark/50 mb-6">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{profile.location || 'Sanctuary Roots'}</span></div>
                <div className="flex items-center gap-1.5"><LinkIcon className="w-4 h-4" /><span>{profile.website || 'pragya-yog.com'}</span></div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>Joined March 2026</span></div>
              </div>
              
              <p className="max-w-2xl text-pragya-dark/70 leading-relaxed italic border-l-4 border-pragya-sage/30 pl-4">
                "{profile.bio}"
              </p>
            </div>
            
            <div className="flex gap-4">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => navigate('/settings?edit=true')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-pragya-beige text-pragya-green rounded-full font-bold hover:bg-pragya-mint/30 transition-all font-sans"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="p-2.5 bg-pragya-beige text-pragya-green rounded-full hover:bg-pragya-mint/30 transition-all"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-10 py-2.5 rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                    isFollowing 
                      ? 'bg-pragya-green text-white shadow-pragya-green/20' 
                      : 'bg-[#F7941D] text-white shadow-[#F7941D]/30 hover:brightness-110'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-10 mt-10 p-8 bg-stone-50/50 rounded-[2rem] border border-pragya-mint/10">
            <div className="text-center">
              <p className="text-2xl font-serif italic font-black text-pragya-green">{stats.posts}</p>
              <p className="text-[10px] text-pragya-green/30 uppercase tracking-widest font-black">Posts</p>
            </div>
            <div 
              onClick={() => { setModalType('followers'); setModalOpen(true); }}
              className="text-center group cursor-pointer"
            >
              <p className="text-2xl font-serif italic font-black text-pragya-green group-hover:text-[#F7941D] transition-colors">{stats.followers}</p>
              <p className="text-[10px] text-pragya-green/30 uppercase tracking-widest font-black">Followers</p>
            </div>
            <div 
              onClick={() => { setModalType('following'); setModalOpen(true); }}
              className="text-center group cursor-pointer"
            >
              <p className="text-2xl font-serif italic font-black text-pragya-green group-hover:text-[#F7941D] transition-colors">{stats.following}</p>
              <p className="text-[10px] text-pragya-green/30 uppercase tracking-widest font-black">Following</p>
            </div>
          </div>

          <FollowModal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            type={modalType} 
            userId={targetId}
            currentUserId={authUser?.id}
          />
        </div>
      </div>

      {/* Tabs & Content Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-8 border-b border-pragya-mint/10">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === 'posts' ? 'text-pragya-green' : 'text-pragya-green/30 hover:text-pragya-green/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5" />
                Posts
              </div>
              {activeTab === 'posts' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#F7941D] rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('tutorials')}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === 'tutorials' ? 'text-pragya-green' : 'text-pragya-green/30 hover:text-pragya-green/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                Tutorials
              </div>
              {activeTab === 'tutorials' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#F7941D] rounded-t-full" />
              )}
            </button>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-pragya-green/30 italic pb-4">
            {activeTab === 'posts' ? `${posts.length} ripples` : `${tutorials.length} lessons`}
          </span>
        </div>

        {activeTab === 'posts' ? (
          <div className="columns-2 md:columns-3 gap-6 space-y-6 px-2">
            {posts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedPostIndex(index)}
                className="relative group cursor-pointer overflow-hidden rounded-[2rem] border border-pragya-mint/10 bg-white shadow-xl hover:shadow-2xl transition-all"
              >
                <img 
                  src={post.media_url} 
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-10 text-white backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Heart className="w-6 h-6 fill-current text-[#F7941D]" />
                    <span className="font-serif italic font-black text-xl">{post.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 fill-current text-white/50" />
                    <span className="font-serif italic font-black text-xl">{post.comments_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate('/tutorials')}
                className="relative aspect-[9/16] rounded-[2rem] overflow-hidden group cursor-pointer border border-pragya-mint/10 bg-black"
              >
                <video 
                  src={tutorial.video_url} 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" 
                  muted
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 transition-opacity flex flex-col justify-end p-6">
                   <div className="flex items-center gap-2 mb-2">
                      <PlayCircle className="w-5 h-5 text-[#F7941D]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#F7941D]">Tutorial</span>
                   </div>
                   <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{tutorial.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {(activeTab === 'posts' ? posts.length === 0 : tutorials.length === 0) && (
        <div className="py-32 text-center bg-pragya-beige/10 rounded-[3rem] border-2 border-dashed border-pragya-mint/20 mt-10">
          <p className="text-pragya-green/20 italic font-serif text-3xl">No {activeTab} shared yet...</p>
        </div>
      )}

      <AnimatePresence>
        {selectedPostIndex !== null && (
          <PostModal 
            posts={posts}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
