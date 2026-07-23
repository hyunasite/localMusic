import React from 'react';
import { Headphones } from 'lucide-react';
import { motion } from 'motion/react';

export const LoadingScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 bg-[#0D0D0D] flex flex-col items-center justify-center p-4 select-none"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Headphone Icon */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-[0_0_35px_rgba(124,58,237,0.5)]">
            <Headphones className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Line Loading Indicator */}
        <div className="w-44 h-1 bg-zinc-800/80 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="w-full h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)]"
          />
        </div>
      </div>
    </motion.div>
  );
};
