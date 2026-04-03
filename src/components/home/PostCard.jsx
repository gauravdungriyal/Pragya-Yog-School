import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';

const PostCard = ({ post, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="relative break-inside-avoid group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] bg-stone-50/50 border border-white/10 shadow-sm group-hover:shadow-xl transition-all duration-500">
        <img
          src={post.media_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'}
          alt={post.caption}
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80';
          }}
        />
        
        {/* Simple Hover Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold backdrop-blur-[2px]">
          <div className="flex items-center gap-2 drop-shadow-md">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-sm">{post.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-2 drop-shadow-md">
            <MessageCircle className="w-5 h-5 fill-current" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Footer info (Subtle & Elegant) */}
      <div className="mt-3 px-3 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-pragya-mint border border-white/20 flex items-center justify-center text-pragya-green font-bold text-[8px] overflow-hidden flex-shrink-0">
             {post.user?.avatar_url ? <img src={post.user.avatar_url} className="w-full h-full object-cover" /> : (post.user?.name?.charAt(0) || 'P')}
          </div>
          <span className="text-[10px] font-bold text-pragya-dark/80 truncate max-w-[100px]">
            {post.user?.name || 'Yogi'}
          </span>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm ${post.user?.role === 'Instructor' ? 'bg-pragya-green text-white' : 'bg-red-500 text-white'}`}>
          {post.user?.role || 'Member'}
        </span>
      </div>
    </motion.div>
  );
};

export default PostCard;
