import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const roleQuotes = {
  Instructor: "Be the reason for change in someone's life.",
  Learner: "Follow and Learn from your favourite instructor.",
  Guest: "Enjoy the life of Pragya Yog School.",
};

const LoadingQuote = ({ role, onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-xl"
      >
        <div className="mb-10 flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 border-4 border-pragya-sage border-t-transparent rounded-full"
          />
        </div>
        <p className="text-2xl md:text-3xl font-serif text-pragya-green italic leading-relaxed">
          "{roleQuotes[role] || "Welcome to the community."}"
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingQuote;
