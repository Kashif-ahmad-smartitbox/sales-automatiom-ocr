import { useState } from 'react';
import { List } from '@phosphor-icons/react';
import Sidebar from './Sidebar';

const AdminLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 rounded-lg transition-colors"
                data-testid="mobile-menu-btn"
              >
                <List size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-4 mt-auto">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p className="text-xs font-medium text-gray-600">
              © 2026{' '}
              <span className="bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent font-semibold">
                SMART ITBOX
              </span>
              . All rights reserved.
            </p>
            <p className="text-xs text-gray-500 text-center">
              Made with ❤️ by{' '}
              <a
                href="https://smartitbox.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent"
              >
                SMART ITBOX
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
