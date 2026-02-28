import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  MagnifyingGlass,
  Bell,
  House,
  Storefront,
  ChartBar,
  Clipboard,
  DotsThree,
  CalendarCheck
} from '@phosphor-icons/react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';

const AdminLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: House,     path: '/dashboard' },
    { label: 'Dealers',   icon: Storefront, path: '/dealers'   },
    { label: 'Follow-ups', icon: CalendarCheck, path: '/followup-dealers' },
    { label: 'Reports',   icon: ChartBar,   path: '/reports'   },
    { label: 'Reports+',  icon: Clipboard,  path: '/hod-reports' },
    { label: 'More',      icon: DotsThree,  path: null         },
  ];

  const isActive = (path) => path && location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-20 bg-white backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">

            {/* Left: hamburger + title (mobile) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="mobile-menu-btn"
              >
                <List size={20} />
              </button>
              {/* Title — visible on mobile only */}
              {title && (
                <span className="md:hidden text-base font-bold text-gray-900">{title}</span>
              )}
            </div>

            {/* Center: Search (desktop only) */}
            <div className="flex-1 max-w-sm mx-4 hidden md:block">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
                />
              </div>
            </div>

            {/* Right: Notification + Avatar */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
              </button> */}

              {/* User Avatar */}
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-orange-200">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        {/* Bottom padding on mobile to clear the bottom nav */}
        <main className="p-4 md:p-6 flex-1 pb-20 md:pb-6">
          {children}
        </main>

        {/* ── FOOTER (desktop only) ── */}
        <footer className="hidden md:block w-full border-t border-gray-200 bg-white px-6 py-3 mt-auto">
          <div className="flex flex-col items-center justify-between gap-1 md:flex-row">
            <p className="text-xs text-gray-500">
              © 2026{' '}
              <span className="font-semibold text-gray-700">SMART ITBOX</span>. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">
              Made with ❤️ by{' '}
              <a
                href="https://smartitbox.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-500 hover:text-orange-600"
              >
                SMART ITBOX
              </a>
            </p>
          </div>
        </footer>

        {/* ── BOTTOM NAV (mobile only) ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-around h-14 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => item.path ? navigate(item.path) : setSidebarOpen(true)}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                    active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon
                    size={20}
                    weight={active ? 'fill' : 'regular'}
                  />
                  <span className={`text-[10px] font-medium ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
};

export default AdminLayout;
