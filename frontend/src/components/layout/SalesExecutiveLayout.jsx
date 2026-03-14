import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { List, Bell, MapPin, Buildings, DotsThree, CaretLeft, CaretRight } from '@phosphor-icons/react';
import SalesExecutiveSidebar from './SalesExecutiveSidebar';
import { useAuth } from '../../context/AuthContext';

const SalesExecutiveLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Field View', icon: MapPin,    path: '/field' },
    { label: 'Dealers',    icon: Buildings, path: '/assigned-potentials' },
    { label: 'More',       icon: DotsThree, path: null },
  ];

  const isActive = (path) => path && location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesExecutiveSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main content shifts right with sidebar */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">

            {/* Left: hamburger + title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <List size={20} />
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition-all"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <CaretRight size={18} weight="bold" /> : <CaretLeft size={18} weight="bold" />}
              </button>

              {title && (
                <span className="md:hidden text-base font-bold text-gray-900">{title}</span>
              )}
              {title && (
                <span className="hidden md:block text-xl font-bold text-gray-900 ml-2">{title}</span>
              )}
            </div>

            {/* Right: notification + avatar */}
            <div className="flex items-center gap-2 md:gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-orange-200">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 md:p-6 flex-1 pb-20 md:pb-6"
        >
          {children}
        </motion.main>

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
                  <Icon size={20} weight={active ? 'fill' : 'regular'} />
                  <span className={`text-[10px] font-medium ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
};

export default SalesExecutiveLayout;
