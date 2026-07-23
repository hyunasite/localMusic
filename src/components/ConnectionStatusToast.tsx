import React from 'react';
import { motion } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusToastProps {
  isOnline: boolean;
}

export const ConnectionStatusToast: React.FC<ConnectionStatusToastProps> = ({ isOnline }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -25, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-md border ${
          isOnline
            ? 'bg-[#121212]/90 border-emerald-500/40 text-white'
            : 'bg-[#121212]/90 border-rose-500/40 text-white'
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnline ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>

        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-400" />
        )}

        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wide leading-none">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">
            {isOnline ? 'Live music sync active' : 'Check network connection'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
