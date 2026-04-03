import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, MoreHorizontal, Music, Play, Volume2, VolumeX, Film, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const TutorialReel = ({ reel, isActive }) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0);
  const [progress, setProgress] = useState(0);
  const requestRef = useRef();

  const animate = () => {
    if (videoRef.current && !videoRef.current.paused) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
      requestRef.current = requestAnimationFrame(animate);
    }
  };
  
  // Comment System States
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [fetchingComments, setFetchingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        requestRef.current = requestAnimationFrame(animate);
      }).catch(() => { });
    } else if (videoRef.current) {
      videoRef.current.pause();
      cancelAnimationFrame(requestRef.current);
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive]);

  useEffect(() => {
    if (reel && authUser) {
      setLikesCount(reel.likes_count || 0);
      checkIfLiked();
    }
  }, [reel, authUser]);

  const checkIfLiked = async () => {
    if (!authUser) return;
    try {
      const { data } = await supabase
        .from('tutorial_likes')
        .select('*')
        .match({ tutorial_id: reel.id, user_id: authUser.id })
        .maybeSingle();
      setIsLiked(!!data);

      // Check Follow Status
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', authUser.id)
        .eq('following_id', reel.user_id)
        .single();
      setIsFollowing(!!followData);
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const handleFollowToggle = async (e) => {
    if (e) e.stopPropagation();
    if (!authUser) {
      setShowJoinPrompt(true);
      return;
    }
    if (authUser.id === reel.user_id || followLoading) return;
    
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);

    try {
      if (prevFollowing) {
        await supabase.from('follows').delete().eq('follower_id', authUser.id).eq('following_id', reel.user_id);
      } else {
        await supabase.from('follows').insert({ follower_id: authUser.id, following_id: reel.user_id });
      }
    } catch (err) {
      console.error('Follow error:', err);
      setIsFollowing(prevFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchComments = async () => {
    setFetchingComments(true);
    try {
      const { data, error } = await supabase
        .from('tutorial_comments')
        .select('*, user:users(name, avatar_url, role)')
        .eq('tutorial_id', reel.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setFetchingComments(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authUser || postingComment) return;

    setPostingComment(true);
    try {
      const { data, error } = await supabase
        .from('tutorial_comments')
        .insert({
          tutorial_id: reel.id,
          user_id: authUser.id,
          text: newComment.trim()
        })
        .select('*, user:users(name, avatar_url, role)')
        .single();

      if (error) throw error;
      setComments(prev => [...prev, data]);
      setNewComment("");
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const toggleComments = () => {
    if (!authUser) {
      setShowJoinPrompt(true);
      return;
    }
    if (!isCommentsOpen) fetchComments();
    setIsCommentsOpen(!isCommentsOpen);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      cancelAnimationFrame(requestRef.current);
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const toggleLike = async () => {
    if (!authUser) {
      setShowJoinPrompt(true);
      return;
    }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    try {
      if (wasLiked) {
        await supabase.from('tutorial_likes').delete().match({ tutorial_id: reel.id, user_id: authUser.id });
      } else {
        await supabase.from('tutorial_likes').insert({ tutorial_id: reel.id, user_id: authUser.id });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleShare = () => {
    if (!authUser) {
      setShowJoinPrompt(true);
      return;
    }
    if (!reel.user_id) return;
    navigate('/messages', { state: { recipientId: reel.user_id } });
  };

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-transparent snap-start">
      <div className="relative h-full w-full overflow-hidden flex items-center justify-center group">
        <video
          ref={videoRef}
          src={reel.video_url}
          className="h-full w-full object-contain cursor-pointer"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlay}
        />

        {/* Video Controls Overlay */}
        <div
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity cursor-pointer ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="p-6 rounded-full bg-white/20 backdrop-blur-md scale-110">
            {isPlaying ? null : <Play className="w-12 h-12 text-white fill-current" />}
          </div>
        </div>

        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white z-20 hover:bg-black/60 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Right Sidebar Controls */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10 transition-transform duration-300" style={{ transform: isCommentsOpen ? 'translateY(-20px)' : 'none' }}>
          <button onClick={toggleLike} className="flex flex-col items-center group/btn">
            <div className={`p-3 rounded-full bg-white shadow-md mb-1 group-hover/btn:scale-110 transition-all active:scale-90 ${isLiked ? 'text-red-500' : 'text-pragya-green'}`}>
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-pragya-dark text-[10px] font-bold">{likesCount}</span>
          </button>

          <button onClick={toggleComments} className="flex flex-col items-center group/btn">
            <div className={`p-3 rounded-full bg-white shadow-md mb-1 group-hover/btn:scale-110 transition-all active:scale-90 ${isCommentsOpen ? 'bg-pragya-mint text-pragya-green' : 'text-pragya-green'}`}>
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-pragya-dark text-[10px] font-bold">{reel.comments_count || 0}</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center group/btn">
            <div className="p-3 rounded-full bg-white shadow-md mb-1 group-hover/btn:scale-110 transition-all active:scale-90">
              <Send className="w-6 h-6 text-pragya-green" />
            </div>
            <span className="text-pragya-dark text-[10px] font-bold italic">Message</span>
          </button>

          <div className="mt-2 p-1 rounded-lg border-2 border-pragya-green/20 overflow-hidden bg-white shadow-sm w-10 h-10 animate-spin-slow">
            {reel.user?.avatar_url ? (
              <img src={reel.user.avatar_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-pragya-sage rounded flex items-center justify-center text-[10px] text-white font-bold">{reel.user?.name?.charAt(0) || 'P'}</div>
            )}
          </div>
        </div>

        {/* Comments Drawer (Slide Up) */}
        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 h-[70%] bg-black/60 backdrop-blur-2xl z-50 rounded-t-[2.5rem] border-t border-white/10 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-serif italic text-lg">Comments</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/40 text-[10px] font-bold">{reel.comments_count || 0}</span>
                </div>
                <button 
                  onClick={() => setIsCommentsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              {/* Scrollable Comments */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                {fetchingComments ? (
                  <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-pragya-mint border-t-transparent rounded-full animate-spin" /></div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div className="flex gap-4 group">
                      <div 
                        onClick={() => navigate(`/profile/${comment.user_id}`)}
                        className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs uppercase cursor-pointer hover:border-white/40 transition-colors"
                      >
                        {comment.user?.avatar_url ? <img src={comment.user.avatar_url} className="w-full h-full object-cover" /> : (comment.user?.name?.charAt(0) || "?")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            onClick={() => navigate(`/profile/${comment.user_id}`)}
                            className="text-sm font-bold text-white leading-none cursor-pointer hover:text-pragya-mint transition-colors"
                          >{comment.user?.name}</span>
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-tighter ${comment.user?.role === 'Instructor' ? 'bg-pragya-green text-white' : 'bg-red-500 text-white'}`}>
                            {comment.user?.role}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{comment.text}</p>
                        <span className="text-[9px] text-white/20 mt-1 block">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-white/20 space-y-2">
                    <MessageCircle className="w-10 h-10 opacity-10" />
                    <p className="text-sm italic">No comments yet.<br/>Be the first to share!</p>
                  </div>
                )}
              </div>

              {/* Reflection Input */}
              <div className="p-6 pt-4 bg-white/5 border-t border-white/5">
                <form onSubmit={handlePostComment} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pragya-mint/20 border border-pragya-mint/20 flex items-center justify-center text-[10px] text-pragya-mint font-black">
                    {authUser?.user_metadata?.name?.charAt(0) || "Y"}
                  </div>
                  <input 
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || postingComment}
                    className="text-pragya-mint text-xs font-black uppercase tracking-widest disabled:opacity-30"
                  >
                    {postingComment ? "..." : "Post"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Info Overlay */}
        <div className={`absolute inset-x-0 bottom-0 p-6 pt-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white z-10 flex flex-col gap-3 pr-20 transition-opacity duration-300 ${isCommentsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => navigate(`/profile/${reel.user_id}`)}
              className="w-12 h-12 rounded-full border-2 border-white/40 p-0.5 overflow-hidden bg-pragya-sage flex items-center justify-center text-lg font-bold flex-shrink-0 cursor-pointer hover:border-white transition-all transform hover:scale-105 active:scale-95"
            >
              {reel.user?.avatar_url ? (<img src={reel.user.avatar_url} className="w-full h-full object-cover" />) : (reel.user?.name?.charAt(0) || 'P')}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span 
                  onClick={() => navigate(`/profile/${reel.user_id}`)}
                  className="font-serif italic text-xl font-black tracking-tight cursor-pointer hover:text-[#F7941D] transition-colors"
                >{reel.user?.name}</span>
                {authUser?.id !== reel.user_id && (
                  <button 
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all transform active:scale-95 shadow-lg ${
                      isFollowing 
                        ? 'bg-pragya-green border-pragya-green text-white shadow-pragya-green/20' 
                        : 'bg-[#F7941D] border-[#F7941D] text-white shadow-[#F7941D]/30 hover:brightness-110'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[8px] font-black uppercase tracking-widest text-[#F7941D] border border-[#F7941D]/20">
                  {reel.user?.role}
                </span>
              </div>
            </div>
          </div>

          <h3 className="font-serif text-xl leading-tight italic font-bold tracking-tight">{reel.title}</h3>
          <p className="text-sm text-white/90 leading-snug line-clamp-2 pr-12">{reel.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/20 z-10">
           <div
            className="h-full bg-pragya-mint"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Join School Prompt Overlay */}
        <AnimatePresence>
          {showJoinPrompt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm bg-white rounded-[2rem] p-10 text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-pragya-mint/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Film className="w-8 h-8 text-pragya-green" />
                </div>
                <h3 className="text-xl font-serif text-pragya-green mb-3 italic">Join the School</h3>
                <p className="text-pragya-dark/60 text-sm leading-relaxed mb-8 italic">
                  Join the Pragya Yog School to unlock all features.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.open('https://pyshk.com/', '_blank')}
                    className="w-full py-4 bg-[#F7941D] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#F7941D]/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Join the School
                  </button>
                  <button 
                    onClick={() => setShowJoinPrompt(false)}
                    className="w-full py-4 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-stone-200"
                  >
                    Continue Browsing
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Tutorials = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const containerRef = useRef(null);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*, user:users(name, avatar_url, role)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleScroll = (e) => {
    const container = e.target;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeReelIndex) {
      setActiveReelIndex(index);
    }
  };

  const scrollToIndex = (index) => {
    if (containerRef.current && index >= 0 && index < reels.length) {
      containerRef.current.scrollTo({
        top: index * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 lg:left-72 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pragya-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 lg:left-72 flex flex-col items-center justify-center text-center p-8 space-y-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Film className="w-12 h-12 text-pragya-green/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-pragya-dark italic">No tutorials yet</h2>
          <p className="text-pragya-dark/40 max-w-xs mx-auto">
            Be the first to upload a tutorial!
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/create'}
          className="px-8 py-3 bg-pragya-mint text-pragya-green rounded-xl font-bold hover:scale-105 transition-all text-sm"
        >
          Upload first tutorial
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-160px)] overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {reels.map((reel, index) => (
          <TutorialReel
            key={reel.id}
            reel={reel}
            isActive={index === activeReelIndex}
          />
        ))}
      </div>

    </div>
  );
};

export default Tutorials;
