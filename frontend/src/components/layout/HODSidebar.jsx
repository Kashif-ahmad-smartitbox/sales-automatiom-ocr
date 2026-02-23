import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  SignOut, 
  House, 
  Users, 
  ChartBar,
  ListBullets,
  X,
  CaretLeft,
  CaretRight,
  Package
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const HODSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/hod', icon: House, label: 'Dashboard' },
    { to: '/hod/executives', icon: Users, label: 'My Team' },
    { to: '/hod/items', icon: Package, label: 'Item Master' },
    { to: '/hod/reports', icon: ChartBar, label: 'Reports' },
    { to: '/hod/visits', icon: ListBullets, label: 'Visit History' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar-dark ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-16 md:w-16' : 'w-60 md:w-60'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-gray-700 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="SMART ITBox Logo" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <div className="font-bold text-sm text-white">
                  SMART ITBox
                </div>
                <div className="text-xs text-gray-400">
                  Field Sales Automation
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img 
              src="/logo.png" 
              alt="SMART ITBox Logo" 
              className="w-8 h-8 object-contain"
            />
          )}
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Collapse Toggle Button - Desktop only */}
        <div className={`hidden md:flex py-2 ${isCollapsed ? 'justify-center px-1' : 'justify-end px-2'}`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-3 space-y-1 ${isCollapsed ? 'px-1' : 'px-3'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }
              `}
              onClick={onClose}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={isCollapsed ? 22 : 20} weight={item.to === '/hod' ? 'fill' : 'regular'} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className={`border-t border-gray-700 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm relative">
                  {user?.name?.charAt(0) || 'H'}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate capitalize">{user?.name || 'HOD'}</p>
                  <p className="text-xs text-gray-400 truncate capitalize">HOD</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <SignOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm relative">
                {user?.name?.charAt(0) || 'H'}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Sign Out"
              >
                <SignOut size={20} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default HODSidebar;
