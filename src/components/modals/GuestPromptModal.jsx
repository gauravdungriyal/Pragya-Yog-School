import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, LogIn, ExternalLink, Grid, Film } from 'lucide-react';

const GuestPromptModal = ({ 
  isOpen, 
  onClose, 
  title = "Unlock the Path", 
  message = "Join the Pragya Yog School to unlock all features and Manifest your wisdom.",
  iconType = "posts"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[3rem] p-12 text-center shadow-2xl flex flex-col items-center"
          >
            {/* Contextual Icon Square */}
            <div className="w-20 h-20 bg-pragya-mint/20 rounded-[1.5rem] flex items-center justify-center mb-8">
               {iconType === 'posts' ? (
                 <Grid className="w-10 h-10 text-pragya-green" />
               ) : (
                 <Film className="w-10 h-10 text-pragya-green" />
               )}
            </div>

            {/* Content */}
            <h2 className="text-2xl font-serif text-pragya-green mb-4 italic tracking-tight">{title}</h2>
            <p className="text-pragya-dark/60 text-sm italic leading-relaxed mb-10">
              "{message}"
            </p>

            {/* Actions */}
            <div className="w-full space-y-4">
              <button 
                onClick={() => window.open('https://pyshk.com/', '_blank')}
                className="w-full py-5 bg-[#F7941D] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#F7941D]/30 transition-all hover:scale-[1.03] active:scale-95"
              >
                Join the School
              </button>
              
              <button 
                 onClick={onClose}
                 className="w-full py-5 bg-stone-50 text-stone-500 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-stone-100"
              >
                Continue Browsing
              </button>
            </div>

            {/* Subtle Close for Power Users */}
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-stone-300 hover:text-stone-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GuestPromptModal;
