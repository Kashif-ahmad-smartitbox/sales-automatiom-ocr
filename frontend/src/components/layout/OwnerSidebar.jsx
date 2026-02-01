import { NavLink } from 'react-router-dom';
import { 
  House, 
  Users, 
  Buildings,
  Crown,
  MapPin, 
  Storefront, 
  ChartBar, 
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
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`sidebar owner-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-purple-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Crown weight="fill" className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Owner Panel</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
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
              className={({ isActive }) => `sidebar-link owner-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={20} weight="regular" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-purple-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Owner'}</p>
              <p className="text-xs text-purple-300 truncate capitalize">{user?.role?.replace('_', ' ') || 'Owner'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-lg transition-colors"
          >
            <SignOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default OwnerSidebar;
