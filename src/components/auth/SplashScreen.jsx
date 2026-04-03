import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  "Yoga is the journey of the self, through the self, to the self.",
  "Inhale the future, exhale the past.",
  "Yoga is not about touching your toes, it’s about what you learn on the way down.",
  "The soul is here for its own joy.",
  "Quiet the mind, and the soul will speak."
];

const SplashScreen = ({ onFinish }) => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);

    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center px-6 max-w-2xl"
      >
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-12 flex justify-center"
        >
          <div className="w-48 h-auto flex items-center justify-center">
            <img src="/pragyalogo.webp" alt="Pragya Yog School" className="max-w-full h-auto object-contain" />
          </div>
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-serif text-pragya-green mb-6 tracking-tight">Pragya Yog School</h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-xl italic text-pragya-dark/70 font-light"
        >
          "{quote}"
        </motion.p>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.5, duration: 2.5 }}
          className="h-1 bg-pragya-sage mt-12 mx-auto max-w-xs rounded-full shadow-lg shadow-pragya-sage/20"
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
