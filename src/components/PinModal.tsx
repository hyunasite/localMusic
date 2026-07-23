import React, { useState, useEffect, useCallback } from 'react';
import { Lock, X, Delete, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, correctPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  const handleKeyPress = useCallback((num: string) => {
    setPin((prevPin) => {
      if (prevPin.length >= 4) return prevPin;
      const nextPin = prevPin + num;
      setError(null);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 200);
        } else {
          setTimeout(() => {
            setError('Incorrect 4-digit PIN. Try again.');
            setPin('');
          }, 200);
        }
      }
      return nextPin;
    });
  }, [correctPin, onSuccess, onClose]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError(null);
  }, []);

  // Handle PC/Laptop physical keyboard input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleDelete, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl bg-[#181818] border border-[#2A2A2A] p-6 shadow-2xl text-white relative flex flex-col items-center"
          >
            {/* Close Button */}
            <button
              id="pin-modal-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#A855F7] mb-3 border border-[#7C3AED]/30">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-white mb-1">Admin Access</h3>
            <p className="text-xs text-zinc-400 mb-6 text-center">
              Enter 4-digit PIN to access Administrator controls
            </p>

            {/* PIN Display Dots */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <motion.div
                    key={index}
                    animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.3 }}
                    className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                      filled
                        ? 'bg-[#7C3AED] border-[#A855F7] shadow-[0_0_10px_rgba(124,58,237,0.5)] scale-110'
                        : 'bg-[#222222] border-zinc-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 font-medium mb-4 text-center bg-red-950/40 border border-red-800/40 px-3 py-1.5 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`pin-num-btn-${num}`}
                  onClick={() => handleKeyPress(num)}
                  className="h-14 rounded-full bg-[#222222] hover:bg-[#2E2E2E] active:bg-[#7C3AED] text-lg font-semibold text-white transition-all flex items-center justify-center border border-zinc-800/80 active:scale-95 shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                id="pin-clear-btn"
                onClick={handleClear}
                className="h-14 rounded-full bg-[#222222]/50 hover:bg-[#2A2A2A] text-xs font-semibold text-zinc-400 hover:text-white transition-all flex items-center justify-center border border-zinc-800/50"
              >
                CLEAR
              </button>
              <button
                id="pin-num-btn-0"
                onClick={() => handleKeyPress('0')}
                className="h-14 rounded-full bg-[#222222] hover:bg-[#2E2E2E] active:bg-[#7C3AED] text-lg font-semibold text-white transition-all flex items-center justify-center border border-zinc-800/80 active:scale-95 shadow-sm"
              >
                0
              </button>
              <button
                id="pin-delete-btn"
                onClick={handleDelete}
                className="h-14 rounded-full bg-[#222222]/50 hover:bg-[#2A2A2A] text-zinc-400 hover:text-white transition-all flex items-center justify-center border border-zinc-800/50"
                aria-label="Delete last digit"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Removed Default PIN text for clean look */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
