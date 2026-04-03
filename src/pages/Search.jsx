import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, User, Grid, Play, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const Search = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let allResults = [];

        // 1. Fetch Users
        if (activeTab === 'all' || activeTab === 'users') {
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .ilike('name', `%${searchTerm}%`)
            .limit(10);
            
          if (!userError) {
            allResults = [...allResults, ...users.map(u => ({ ...u, type: 'user' }))];
          }
        }

        // 2. Fetch Posts
        if (activeTab === 'all' || activeTab === 'posts') {
          const { data: posts, error: postError } = await supabase
            .from('posts')
            .select('*, user:users(name, avatar_url)')
            .ilike('caption', `%${searchTerm}%`)
            .limit(12);
            
          if (!postError) {
            allResults = [...allResults, ...posts.map(p => ({ ...p, type: 'post' }))];
          }
        }

        // 3. Fetch Tutorials
        if (activeTab === 'all' || activeTab === 'tutorials') {
          const { data: tutorials, error: tutError } = await supabase
            .from('tutorials')
            .select('*, user:users(name, avatar_url)')
            .ilike('title', `%${searchTerm}%`)
            .limit(12);
            
          if (!tutError) {
            allResults = [...allResults, ...tutorials.map(t => ({ ...t, type: 'tutorial' }))];
          }
        }

        // Sort by creation date if available
        allResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setResults(allResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, activeTab]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Search Header Command Center */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-serif font-black text-pragya-green mb-8 italic tracking-tight">Explore the Sanctuary</h1>
        
        {/* Main Search Discovery Bar */}
        <div className="max-w-2xl mx-auto relative mb-10 group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <SearchIcon className="w-6 h-6 text-pragya-green/30 group-focus-within:text-pragya-mint transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Search for fellow yogis, poses, or techniques..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-pragya-mint/10 rounded-[2.5rem] shadow-sm hover:shadow-md focus:ring-8 focus:ring-pragya-sage/5 focus:border-pragya-sage/40 transition-all outline-none text-lg placeholder:text-pragya-dark/20 font-medium"
          />
          {loading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 border-3 border-pragya-mint border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Filter Navigation Chips - Only show when intent is shared */}
        <AnimatePresence>
          {searchTerm.trim() && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center gap-4 overflow-x-auto pb-4 no-scrollbar"
            >
              {['all', 'users', 'posts', 'tutorials'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-10 py-3 rounded-full font-black text-[11px] uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-pragya-green text-white shadow-xl shadow-pragya-green/20 scale-105' 
                      : 'bg-white text-pragya-green/40 hover:bg-pragya-mint/5 border border-pragya-mint/20'
                  }`}
                >
                  {tab === 'all' ? 'Divine All' : tab}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Discovery Grid or Initial Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        <AnimatePresence mode="popLayout">
          {!searchTerm.trim() ? (
            <motion.div 
              key="prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-full py-40 text-center"
            >
              <h2 className="text-2xl font-serif italic font-bold text-pragya-green/40 mb-2">Manifest your discovery</h2>
              <p className="text-sm text-pragya-green/20 font-bold uppercase tracking-[0.2em]">Search for fellow yogis, posts, or tutorials</p>
            </motion.div>
          ) : results.length === 0 && !loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center opacity-20 italic font-serif text-2xl text-pragya-green"
            >
              No ripples found for "{searchTerm}"...
            </motion.div>
          ) : (
            results.map((item, index) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, type: "spring", damping: 25 }}
              >
                {item.type === 'user' ? (
                  <Link 
                    to={`/profile/${item.id}`} 
                    className="flex flex-col items-center text-center p-10 bg-white rounded-[3rem] border border-pragya-mint/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
                  >
                    <div className="w-28 h-28 rounded-full bg-stone-100 p-1 mb-6 shadow-inner flex items-center justify-center overflow-hidden">
                       {item.avatar_url ? (
                         <img src={item.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       ) : (
                         <User className="w-12 h-12 text-pragya-green/20" />
                       )}
                    </div>
                    <h3 className="font-serif italic font-black text-xl text-pragya-green mb-1 leading-none">{item.name}</h3>
                    <p className="text-[10px] text-pragya-green/20 font-bold uppercase tracking-widest mb-8">{item.role || 'Yoga Practitioner'}</p>
                    <button className="w-full py-4 bg-[#F7941D] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#F7941D]/30">
                      View Profile
                    </button>
                  </Link>
                ) : (
                  <Link 
                    to={item.type === 'post' ? `/?post=${item.id}` : `/tutorials`}
                    className="block group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-stone-100 border border-pragya-mint/5 hover:shadow-2xl transition-all"
                  >
                    <img 
                      src={item.type === 'post' ? item.media_url : (item.thumbnail_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80')} 
                      alt={item.caption || item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                    
                    {/* Visual Badge Categorization */}
                    <div className="absolute top-5 right-5 z-20">
                      <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-pragya-green flex items-center gap-2 shadow-sm uppercase tracking-tighter">
                        {item.type === 'post' ? (
                          <><Grid className="w-3 h-3" /> Post</>
                        ) : (
                          <><Film className="w-3 h-3 fill-current" /> Reel</>
                        )}
                      </div>
                    </div>

                    {/* Discovery Overlay Layer */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex flex-col text-white">
                        <h4 className="font-serif italic text-lg font-bold mb-2 line-clamp-2 leading-tight">
                          {item.type === 'post' ? item.caption : (item.title || 'Divine Wisdom')}
                        </h4>
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                             {item.user?.avatar_url ? <img src={item.user.avatar_url} className="w-full h-full object-cover" /> : <div className="bg-white/10 w-full h-full" />}
                           </div>
                           <span className="text-[9px] font-bold text-white/50 tracking-wider">by {item.user?.name || 'Sanctuary Guide'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Search;
