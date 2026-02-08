import { NavLink } from 'react-router-dom';
import { 
  House, 
  Users, 
  MapPin, 
  Storefront, 
  ChartBar, 
  Gear,
  SignOut,
  List,
  Buildings,
  X
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: House, label: 'Dashboard' },
    { to: '/executives', icon: Users, label: 'Sales Team' },
    { to: '/dealers', icon: Storefront, label: 'Dealers' },
    { to: '/potentials', icon: Buildings, label: 'Potential Dealers' },
    { to: '/territories', icon: MapPin, label: 'Territories' },
    { to: '/reports', icon: ChartBar, label: 'Reports' },
    { to: '/settings', icon: Gear, label: 'Settings' },
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
      
      <aside className={`sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin weight="fill" className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">FieldOps</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={20} weight={item.to === '/dashboard' ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role?.replace('_', ' ') || 'Super Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <SignOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
