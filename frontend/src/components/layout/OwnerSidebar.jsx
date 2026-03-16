import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  House, 
  Users, 
  Buildings,
  Crown,
  MapPin, 
  Storefront, 
  UsersFour,
  Pulse,
  ClockCounterClockwise,
  SignOut,
  X,
  Package
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const OwnerSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/owner', icon: House, label: 'Dashboard', end: true },
    { to: '/owner/organizations', icon: Buildings, label: 'Organizations' },
    { to: '/owner/super-admins', icon: Crown, label: 'Super Admins' },
    { to: '/owner/users', icon: Users, label: 'All Users' },
    { to: '/owner/dealers', icon: Storefront, label: 'All Dealers' },
    { to: '/owner/territories', icon: MapPin, label: 'All Territories' },
    { to: '/owner/items', icon: Package, label: 'All Items' },
    { to: '/owner/visits', icon: UsersFour, label: 'All Visits' },
    { to: '/owner/sessions', icon: ClockCounterClockwise, label: 'Market Sessions' },
    { to: '/owner/activity', icon: Pulse, label: 'Activity Log' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-16 md:w-16' : 'w-60 md:w-60'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 bg-white border-b border-gray-100 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="SMART ITBox Logo" 
                className="h-9 w-auto object-contain"
              />
            </div>
          )}
          {isCollapsed && (
            <img 
              src="/logo.png" 
              alt="SMART ITBox Logo" 
              className="w-8 h-8 object-contain"
            />
          )}
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>



        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto bg-white ${isCollapsed ? 'px-1' : 'px-3'}`}>
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  relative group flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-4 py-2'} rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 shadow-sm border border-gray-200/50' 
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50'
                  }
                `}
                onClick={onClose}
                title={isCollapsed ? item.label : ''}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center"
                >
                  <item.icon size={isCollapsed ? 22 : 20} weight={item.to === '/owner' && item.end ? 'fill' : 'regular'} />
                </motion.div>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className={`border-t border-gray-200 bg-white ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.name?.charAt(0) || 'O'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate capitalize">{user?.name || 'Owner'}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">Owner</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:text-white shadow-sm transition-colors"
              >
                <SignOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.charAt(0) || 'O'}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:text-white shadow-sm transition-colors"
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

export default OwnerSidebar;
