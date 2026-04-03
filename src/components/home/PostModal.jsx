import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, X, MoreHorizontal, ChevronLeft, ChevronRight, MapPin, Smile } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import GuestPromptModal from '../modals/GuestPromptModal';

const PostModal = ({ posts, initialIndex, onClose }) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [postingComment, setPostingComment] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const commentInputRef = useRef(null);
  const post = posts[currentIndex];

  useEffect(() => {
    if (post?.id && authUser?.id) {
      setLikesCount(post.likes_count || 0);
      checkIfLiked();
      fetchComments();
    }
  }, [post?.id, authUser?.id, currentIndex]);

  const checkIfLiked = async () => {
    if (!post?.id || !authUser?.id) return;
    try {
      // 1. Check Like Status
      const { data: likeData } = await supabase
        .from('likes')
        .select('*')
        .match({ post_id: post.id, user_id: authUser.id })
        .maybeSingle(); 
      setIsLiked(!!likeData);

      // 2. Check Follow Status
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', authUser.id)
        .eq('following_id', post.user_id)
        .single();
      setIsFollowing(!!followData);
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const handleFollowToggle = async (e) => {
    if (e) e.stopPropagation();
    if (!authUser) {
      setShowGuestPrompt(true);
      return;
    }
    if (authUser.id === post.user_id || followLoading) return;
    
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);

    try {
      if (prevFollowing) {
        await supabase.from('follows').delete().eq('follower_id', authUser.id).eq('following_id', post.user_id);
      } else {
        await supabase.from('follows').insert({ follower_id: authUser.id, following_id: post.user_id });
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
        .from('comments')
        .select('*, user:users(name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setFetchingComments(false);
    }
  };
/* ... next/prev and toggle logic ... */
  const toggleLike = async () => {
    if (!authUser) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    try {
      if (wasLiked) {
        await supabase.from('likes').delete().match({ post_id: post.id, user_id: authUser.id });
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: authUser.id });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleMessage = () => {
    if (!post.user_id) return;
    navigate('/messages', { state: { recipientId: post.user_id } });
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !authUser || postingComment) return;
    const newCommentText = comment.trim();
    setPostingComment(true);
    try {
      const { data, error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: authUser.id,
        text: newCommentText
      }).select('*, user:users(name, avatar_url)').single();
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      setComments([]);
      setCurrentIndex(prev => prev + 1);
      setComment(''); 
      setIsCommentsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setComments([]);
      setCurrentIndex(prev => prev - 1);
      setComment(''); 
      setIsCommentsOpen(false);
    }
  };

  if (!post) return null;

  return (
    <motion.div 
/* ... standard outer modal wrappers ... */
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 flex items-center px-4 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          disabled={currentIndex === 0}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md disabled:opacity-20 transition-all active:scale-90"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center px-4 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          disabled={currentIndex === posts.length - 1}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md disabled:opacity-20 transition-all active:scale-90"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md z-20 transition-all active:scale-90"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Modal Container - Expanded for Imagery */}
      <motion.div 
        key={post.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-black/40 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[92vh]"
      >
        {/* Compact Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-white/5">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.user_id}`} className="w-9 h-9 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-white font-bold group">
               {post.user?.avatar_url ? (
                 <img src={post.user.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
               ) : (post.user?.name?.charAt(0) || 'P')}
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">{post.user?.name || 'Pragya Yogi'}</span>
                <span className="text-[10px] text-white/30 font-medium">• {new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-tighter">
                <MapPin className="w-2.5 h-2.5" />
                <span>Pragya Sanctuary</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {authUser?.id !== post.user_id && (
               <button 
                onClick={handleFollowToggle}
                disabled={followLoading}
                className="text-[#F7941D] hover:text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-[#F7941D] transition-all transform active:scale-95 disabled:opacity-50"
               >
                 {isFollowing ? 'Following' : 'Follow'}
               </button>
             )}
          </div>
        </div>

        {/* Expansive Content Area - Full Bleed Imagery */}
        <div className="flex-1 relative bg-black/20 overflow-hidden flex items-center justify-center">
          <img 
            src={post.media_url} 
            alt={post.caption} 
            className="w-full h-full object-contain" 
          />

          {/* High-Fidelity Reflections Drawer (Instagram Style) */}
          <AnimatePresence>
            {isCommentsOpen && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute inset-0 z-30 bg-black/85 backdrop-blur-3xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-serif italic text-lg leading-none">Reflections</h3>
                    <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold">{comments.length}</span>
                  </div>
                  <button 
                    onClick={() => setIsCommentsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                {/* Scrollable Conversation */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                  {/* The Original Caption as the Root reflection */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center text-white font-bold">
                      {post.user?.avatar_url ? <img src={post.user.avatar_url} className="w-full h-full object-cover" /> : (post.user?.name?.charAt(0) || "P")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white leading-none">{post.user?.name}</span>
                        <span className="text-[10px] text-white/20">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{post.caption}</p>
                    </div>
                  </div>

                  <div className="space-y-8 pt-6 border-t border-white/5">
                    {fetchingComments ? (
                      <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-pragya-mint border-t-transparent rounded-full animate-spin" /></div>
                    ) : comments.length > 0 ? (
                      comments.map((c) => (
                        <div key={c.id} className="flex gap-4 group animate-fade-in">
                          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center text-white font-bold">
                            {c.user?.avatar_url ? <img src={c.user.avatar_url} className="w-full h-full object-cover" /> : (c.user?.name?.charAt(0) || "P")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white leading-none">{c.user?.name}</span>
                              <span className="text-[10px] text-white/20">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-white/10 text-center gap-2">
                        <MessageCircle className="w-12 h-12 opacity-5" />
                        <p className="text-sm italic">Share your mindful resonance.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Area (Bottom) */}
                <div className="p-6 bg-white/5 border-t border-white/5 pb-8">
                  <form onSubmit={handlePostComment} className="flex items-center gap-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-pragya-mint/20 border border-pragya-mint/20 flex items-center justify-center text-[10px] text-pragya-mint font-black">
                      {authUser?.user_metadata?.name?.charAt(0) || "Y"}
                    </div>
                    <input 
                      type="text"
                      placeholder="Add a mindful comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      disabled={!comment.trim() || postingComment}
                      className="text-pragya-mint text-xs font-black uppercase tracking-widest disabled:opacity-30 transition-opacity"
                    >
                      {postingComment ? "..." : "Post"}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Micro-Minimalist Engagement Footer */}
        <div className="p-4 pt-2 backdrop-blur-md bg-white/5 border-t border-white/10">
          {/* Action Row - Smaller Icons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-5 text-white">
              <button 
                onClick={(e) => {
                  if (!authUser) setShowGuestPrompt(true);
                  else toggleLike();
                }}
                className={`flex flex-col items-center gap-1 transition-all active:scale-90 group ${isLiked ? 'text-red-500' : 'text-white'}`}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[12px] font-black tracking-widest">{likesCount}</span>
              </button>
              
              <button 
                onClick={() => {
                  if (!authUser) setShowGuestPrompt(true);
                  else setIsCommentsOpen(true);
                }}
                className="flex flex-col items-center gap-1 transition-all active:scale-90 group text-white"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-[12px] font-black tracking-widest">{comments.length}</span>
              </button>
              
              <button 
                onClick={() => {
                  if (!authUser) setShowGuestPrompt(true);
                  else handleMessage();
                }}
                className="flex flex-col items-center gap-1 transition-all active:scale-90 group text-white"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                  <Send className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Message</span>
              </button>
            </div>
          </div>

          {/* Compressed Caption Block */}
          <div className="mb-3">
            <div className="text-[13px] text-white leading-relaxed">
              <span className="font-bold mr-1.5">{post.user?.name || 'Pragya Yogi'}</span>
              <span className="text-white/80">{post.caption}</span>
            </div>
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mt-1">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>

      <GuestPromptModal 
        isOpen={showGuestPrompt} 
        onClose={() => setShowGuestPrompt(null)} 
        message="Sign in to share your resonance and grow with the school."
      />
    </motion.div>
  );
};

export default PostModal;
