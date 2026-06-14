import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button 
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-secondary border border-border p-1 flex items-center transition-all cursor-pointer group shadow-inner"
    >
      <motion.div
        animate={{ 
          x: theme === 'dark' ? 28 : 0,
        }}
        className={`w-5 h-5 rounded-lg flex items-center justify-center shadow-lg relative z-10 transition-colors duration-500 ${
          theme === 'dark' ? 'bg-primary' : 'bg-amber-500'
        }`}
      >
        {theme === 'dark' ? (
          <Moon size={10} className="text-white" />
        ) : (
          <Sun size={10} className="text-white" />
        )}
      </motion.div>
      <div className="absolute inset-0 flex justify-between px-2 items-center opacity-20 group-hover:opacity-100 transition-opacity">
        <Sun size={10} className="text-amber-500" />
        <Moon size={10} className="text-primary" />
      </div>
    </button>
  );
};

export default ThemeToggle;
