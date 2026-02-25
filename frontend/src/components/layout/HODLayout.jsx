import { useState, useEffect } from 'react';
import { List, MagnifyingGlass } from '@phosphor-icons/react';
import HODSidebar from './HODSidebar';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';

const HODLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();

  useEffect(() => {
    document.title = title ? `${title} | FieldOps HOD` : 'FieldOps HOD';
  }, [title]);

  return (
    <div className="min-h-screen bg-slate-50">
      <HODSidebar 
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
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                />
              </div>
            </div>
            
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
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default HODLayout;
