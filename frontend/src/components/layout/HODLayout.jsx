import { useState, useEffect } from 'react';
import { List } from '@phosphor-icons/react';
import HODSidebar from './HODSidebar';
import { useAuth } from '../../context/AuthContext';

const HODLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    document.title = title ? `${title} | FieldOps HOD` : 'FieldOps HOD';
  }, [title]);

  return (
    <div className="min-h-screen bg-slate-50">
      <HODSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <List size={24} className="text-slate-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'H'}
              </div>
              <div>
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
