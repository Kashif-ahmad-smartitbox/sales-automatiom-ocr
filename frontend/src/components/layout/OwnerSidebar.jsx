import { NavLink } from 'react-router-dom';
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
  X
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const OwnerSidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/owner', icon: House, label: 'Dashboard', end: true },
    { to: '/owner/organizations', icon: Buildings, label: 'Organizations' },
    { to: '/owner/super-admins', icon: Crown, label: 'Super Admins' },
    { to: '/owner/users', icon: Users, label: 'All Users' },
    { to: '/owner/dealers', icon: Storefront, label: 'All Dealers' },
    { to: '/owner/territories', icon: MapPin, label: 'All Territories' },
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
      
      <aside className={`sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary-500 to-orange-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
              <Crown weight="fill" className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
                Owner Panel
              </div>
              <div className="text-[10px] text-gray-500">
                by SMART ITBOX
              </div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={16} weight={item.to === '/owner' && item.end ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate capitalize">{user?.name || 'Owner'}</p>
              <p className="text-[10px] text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'Owner'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 rounded-lg transition-colors"
          >
            <SignOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default OwnerSidebar;
