import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, User, Ghost } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RoleSelection = ({ onSelect }) => {
  const { selectRole } = useAuth();

  const roles = [
    {
      id: 'Instructor',
      title: 'Instructor',
      desc: 'Be the reason for someone\'s transformation',
      icon: GraduationCap,
      color: 'bg-[#1F3E44]',
      accent: 'text-white'
    },
    {
      id: 'Learner',
      title: 'Learner',
      desc: 'Follow and learn from your favorite instructor',
      icon: User,
      color: 'bg-[#F7941D]',
      accent: 'text-white'
    },
    {
      id: 'guest',
      title: 'Guest',
      desc: 'Enjoy the life of Pragya Yog School',
      icon: Ghost,
      color: 'bg-stone-500',
      accent: 'text-white'
    }
  ];

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 overflow-hidden px-6">
      {/* Subtle Aura Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-pragya-mint/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-[#F7941D]/10 blur-[120px] rounded-full" />
      </div>

      <div className="text-center mb-12 relative z-10">
        <img src="/pragyalogo.webp" alt="Pragya" className="w-20 mx-auto mb-6" />
        <h1 className="text-4xl font-serif italic font-bold text-pragya-green mb-2 tracking-tight">Welcome to Pragya Yog School</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-pragya-dark/40">Choose your path</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
        {roles.map((role, idx) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => {
              selectRole(role.id);
              onSelect(role.id);
            }}
            className="group relative h-72 rounded-[3rem] overflow-hidden bg-white shadow-xl shadow-pragya-mint/5 border border-pragya-mint/10 flex flex-col items-center justify-center p-8 transition-all hover:scale-105 active:scale-95"
          >
            <div className={`w-16 h-16 rounded-2xl ${role.color} flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
              <role.icon className={`w-8 h-8 ${role.accent}`} />
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-serif italic font-bold text-pragya-dark mb-2 tracking-tight">{role.title}</h3>
              <p className="text-xs text-pragya-dark/50 leading-relaxed px-4 italic">{role.desc}</p>
            </div>
            
            {/* Hover Decorative Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${role.color}`} />
          </motion.button>
        ))}
      </div>

      <p className="mt-16 text-[9px] uppercase tracking-[0.3em] font-black text-pragya-dark/20 italic relative z-10">
        PRAGYA YOG SCHOOL COMMUNITY • ESTABLISHED 2026
      </p>
    </div>
  );
};

export default RoleSelection;
