import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from '../components/home/PostCard';
import PostModal from '../components/home/PostModal';
import { supabase } from '../lib/supabase';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user: authUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const observer = useRef();

  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(name, avatar_url, role)
        `);

      if (authUser) {
        query = query.neq('user_id', authUser.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setPosts(data || []);
      if ((data?.length || 0) < 15) setHasMore(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(name, avatar_url, role)
        `);

      if (authUser) {
        query = query.neq('user_id', authUser.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(posts.length, posts.length + 14);

      if (error) throw error;
      if (data) {
        setPosts(prev => [...prev, ...data]);
        if (data.length < 15) setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [authUser]);

  if (!loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-32 h-auto flex items-center justify-center">
          <img src="/pragyalogo.webp" alt="Pragya Yog School" className="max-w-full h-auto object-contain opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-pragya-green italic">No posts yet</h2>
          <p className="text-pragya-dark/50 max-w-xs mx-auto">
            Start your journey by sharing your first post.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/create'}
          className="px-8 py-3 bg-pragya-green text-white rounded-xl font-bold shadow-lg shadow-pragya-green/20 hover:scale-105 transition-all"
        >
          Share your first post
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-5 gap-4 space-y-4 px-2">
        {posts.map((post, index) => {
          const isLastElement = posts.length === index + 1;
          return (
            <div 
              ref={isLastElement ? lastPostRef : null} 
              key={post.id}
            >
              <PostCard 
                post={post} 
                onClick={() => setSelectedPostIndex(index)} 
              />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPostIndex !== null && (
          <PostModal 
            posts={posts}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-pragya-sage border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && (
        <div className="text-center py-10 text-pragya-dark/40 font-serif italic">
          End of feed
        </div>
      )}
    </div>
  );
};

export default Home;
