import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, MagnifyingGlass, CaretLeft, CaretRight } from '@phosphor-icons/react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';

const HODLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    document.title = title ? `${title} | FieldOps HOD` : 'FieldOps HOD';
  }, [title]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
                <List size={24} className="text-slate-600" />
            </button>
            
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <CaretRight size={20} weight="bold" /> : <CaretLeft size={20} weight="bold" />}
            </button>
            
            {title && (
              <span className="hidden lg:block text-base font-bold text-slate-800 ml-2">{title}</span>
            )}
            
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'H'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'HOD'}</p>
                <p className="text-xs text-slate-500">Head of Department</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 md:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default HODLayout;
