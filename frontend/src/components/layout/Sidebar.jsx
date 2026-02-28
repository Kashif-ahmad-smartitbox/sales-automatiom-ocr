import { NavLink } from 'react-router-dom';
import { useState } from 'react';
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
  X,
  ChartPieSlice,
  UserCircleGear,
  Target,
  CaretLeft,
  CaretRight,
  Package,
  CalendarCheck
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout, user } = useAuth();

  const allNavItems = [
    { to: '/dashboard', icon: House, label: 'Dashboard', roles: ['organization', 'admin', 'hod'] },
    { to: '/executives', icon: Users, label: 'Sales Team', roles: ['organization', 'admin', 'hod'] },
    { to: '/hod-management', icon: UserCircleGear, label: 'HOD Management', roles: ['organization', 'admin'] },
    { to: '/dealers', icon: Storefront, label: 'Dealers', roles: ['organization', 'admin', 'hod'] },
    { to: '/followup-dealers', icon: CalendarCheck, label: 'Follow-up Dealers', roles: ['organization', 'admin', 'hod'] },
    { to: '/potentials', icon: Buildings, label: 'Potential Dealers', roles: ['organization', 'admin', 'hod'] },
    { to: '/item-master', icon: Package, label: 'Item Master', roles: ['organization', 'admin', 'hod'] },
    // { to: '/territories', icon: MapPin, label: 'Territories', roles: ['organization', 'admin', 'hod'] },
    { to: '/reports', icon: ChartBar, label: 'Reports', roles: ['organization', 'admin', 'hod'] },
    { to: '/hod-reports', icon: Target, label: 'HOD Reports', roles: ['organization', 'admin'] },
    { to: '/user-visit-summary', icon: ChartPieSlice, label: 'User Visit Summary', roles: ['organization', 'admin', 'hod'] },
    { to: '/settings', icon: Gear, label: 'Settings', roles: ['organization', 'admin', 'hod'] },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

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

        {/* Collapse Toggle Button - Desktop only */}
        <div className={`hidden md:flex py-2 bg-white ${isCollapsed ? 'justify-center px-1' : 'justify-end px-2'}`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-orange-500 text-white hover:from-primary-600 hover:to-orange-600 shadow-sm transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-3 space-y-1 overflow-y-auto bg-white ${isCollapsed ? 'px-1' : 'px-3'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-gradient-to-r from-primary-500 to-orange-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              onClick={onClose}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={isCollapsed ? 22 : 20} weight={item.to === '/dashboard' ? 'fill' : 'regular'} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className={`border-t border-gray-200 bg-white ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate capitalize">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'Manager'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 shadow-sm transition-colors"
              >
                <SignOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-gradient-to-r from-primary-500 to-orange-500 text-white hover:from-primary-600 hover:to-orange-600 shadow-sm transition-colors"
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

export default Sidebar;
