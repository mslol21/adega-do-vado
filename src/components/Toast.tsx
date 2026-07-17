import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  const { theme } = useStore();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
          style={{ 
            background: `${theme.bgSecondary}CC`,
            borderColor: `${theme.accent}30`,
            color: '#fff',
            boxShadow: `0 10px 40px -10px ${theme.accent}40`
          }}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: theme.gradientAccent, color: theme.bgPrimary }}
          >
            <CheckCircle size={18} />
          </div>
          <span className="font-bold text-sm">{message}</span>
          <button 
            onClick={onClose}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
          >
            <X size={16} />
          </button>
    </div>
  );
};
