import { useState } from 'react';
import { List } from '@phosphor-icons/react';
import OwnerSidebar from './OwnerSidebar';

const OwnerLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-purple-300 hover:text-white"
                data-testid="mobile-menu-btn"
              >
                <List size={24} />
              </button>
              <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
