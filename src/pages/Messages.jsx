import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, MoreVertical, Smile, Paperclip } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const { user: authUser, setActivePartnerId } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const scrollRef = useRef();
  const activeChatRef = useRef(null);

  // Sync ref and global context with state
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      setActivePartnerId(activeChat.id); // Manifest presence globally
      markAsRead(activeChat.id);
    }

    return () => {
      setActivePartnerId(null); // Clear presence when moving between chats or exiting
    };
  }, [activeChat, setActivePartnerId]);

  // 1. Fetch available users to chat with
  const fetchUsers = async () => {
    setLoadingChats(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', authUser.id);
      if (error) throw error;
      
      const loadedChats = data || [];
      setChats(loadedChats);

      // Fetch unread counts for each chat
      const { data: unreadData } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', authUser.id)
        .eq('is_read', false);
      
      const counts = {};
      unreadData?.forEach(m => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);

      // Handle auto-select if navigating from a post
      if (location.state?.recipientId) {
        const targetChat = loadedChats.find(c => c.id === location.state.recipientId);
        if (targetChat) setActiveChat(targetChat);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  // 2. Fetch connection history with active chat
  const fetchMessages = async (otherUserId) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${authUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${authUser.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (authUser) fetchUsers();
  }, [authUser]);


  useEffect(() => {
    if (activeChat) fetchMessages(activeChat.id);
  }, [activeChat]);

  // 3. Durable Real-time Subscription
  useEffect(() => {
    if (!authUser) return;

    console.log('--- Initializing Durable Real-time ---');
    
    // Create a unique channel for this user's messaging session
    const channel = supabase
      .channel(`chat-pulse-${authUser.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        async (payload) => {
          const newMessage = payload.new;
          const currentChat = activeChatRef.current;
          
          // Case 1: We ARE the receiver
          const isReceiver = newMessage.receiver_id === authUser.id;
          // Case 2: We ARE the sender (from another tab/device)
          const isSenderInOtherTab = newMessage.sender_id === authUser.id;

          if (isReceiver || isSenderInOtherTab) {
            const partnerId = isReceiver ? newMessage.sender_id : newMessage.receiver_id;
            
            // Is this message for the CURRENT conversation?
            const belongsToConversation = (currentChat && partnerId === currentChat.id);

            if (belongsToConversation) {
              // Synchronous state update to prevent '1' badge flicker
              setUnreadCounts(prev => ({ ...prev, [partnerId]: 0 }));

              setMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
              
              // If we are recipient, mark it as read immediately in DB
              if (isReceiver) {
                markAsRead(partnerId);
              }
            } else if (isReceiver) {
              // Update unread counts for background chats
              setUnreadCounts(prev => ({
                ...prev,
                [partnerId]: (prev[partnerId] || 0) + 1
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('--- Cleaning Up Durable Real-time ---');
      supabase.removeChannel(channel);
    };
  }, [authUser]); // Only re-run if the user changes, stays alive when switching chats!

  // Handle Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const markAsRead = async (otherUserId) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', authUser.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);
      
      setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    const messageText = message;
    setMessage('');

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: authUser.id,
        receiver_id: activeChat.id,
        text: messageText,
      }).select().single();

      if (error) throw error;
      setMessages(prev => {
        // Prevent duplicate if real-time already caught it
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-3xl shadow-xl overflow-hidden border border-pragya-mint/20">
      {/* Chats List */}
      <div className="w-full md:w-80 border-r border-pragya-mint/20 flex flex-col h-full bg-pragya-beige/10">
        <div className="p-6">
          <h2 className="text-2xl font-serif font-bold text-pragya-green mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pragya-dark/40" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-pragya-mint/50 rounded-xl focus:ring-2 focus:ring-pragya-sage/40 transition-all outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {loadingChats ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-pragya-mint border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <p className="text-center text-xs text-pragya-dark/40 mt-10 italic">Your journey is quiet today...</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative ${
                  activeChat?.id === chat.id 
                    ? 'bg-pragya-sage text-white shadow-lg shadow-pragya-sage/20' 
                    : 'hover:bg-pragya-mint/20 text-pragya-dark'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full border-2 border-white bg-pragya-mint flex items-center justify-center text-pragya-green font-bold text-lg overflow-hidden`}>
                     {chat.avatar_url ? <img src={chat.avatar_url} className="w-full h-full object-cover" /> : chat.name.charAt(0)}
                  </div>
                  {unreadCounts[chat.id] > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F7941D] text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                      {unreadCounts[chat.id]}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-bold text-sm truncate ${unreadCounts[chat.id] > 0 ? 'text-pragya-green' : ''}`}>{chat.name}</p>
                  <p className={`text-xs truncate ${activeChat?.id === chat.id ? 'text-white/80' : unreadCounts[chat.id] > 0 ? 'font-bold text-pragya-dark' : 'text-pragya-dark/60'}`}>
                    {unreadCounts[chat.id] > 0 ? 'New message received' : 'Start a conversation'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="hidden md:flex flex-1 flex-col h-full bg-white">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 px-6 border-b border-pragya-mint/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pragya-sage flex items-center justify-center text-white font-bold">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-pragya-dark">{activeChat.name}</p>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-pragya-green">
                <button className="p-2.5 hover:bg-stone-50 rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-pragya-beige/5"
            >
              {loadingMessages ? (
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-pragya-mint border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-pragya-dark">
                  <Smile className="w-12 h-12 mb-2" />
                  <p>Begin your conversation with a deep breath and a kind word.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender_id === authUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[70%] p-4 rounded-2xl text-sm shadow-sm
                      ${msg.sender_id === authUser.id 
                        ? 'bg-pragya-green text-white rounded-tr-none' 
                        : 'bg-white text-pragya-dark border border-pragya-mint/30 rounded-tl-none'}
                    `}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-2 text-right ${msg.sender_id === authUser.id ? 'text-white/60' : 'text-pragya-dark/40'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 px-6 border-t border-pragya-mint/20 flex items-center gap-4 bg-white">
              <button type="button" className="p-2.5 text-pragya-green hover:bg-pragya-beige rounded-xl">
                <Smile className="w-6 h-6" />
              </button>
              <button type="button" className="p-2.5 text-pragya-green hover:bg-pragya-beige rounded-xl">
                <Paperclip className="w-6 h-6" />
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-5 py-3 bg-pragya-beige/30 border-none rounded-2xl focus:ring-2 focus:ring-pragya-sage/40 transition-all outline-none text-sm font-medium"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-3.5 bg-pragya-green text-white rounded-2xl shadow-lg shadow-pragya-green/20 hover:bg-pragya-dark transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-24 h-24 bg-pragya-mint/30 rounded-full flex items-center justify-center text-pragya-green mb-6">
              <Smile className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-pragya-green mb-2">Your Sanctuary Awaits</h3>
            <p className="text-pragya-dark/50 max-w-xs">Select a community member from the sidebar to begin your mindful dialogue.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
