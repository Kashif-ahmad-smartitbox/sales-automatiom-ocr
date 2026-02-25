import { NavLink } from 'react-router-dom';
import { 
  MapPin,
  Buildings,
  Package,
  SignOut,
  X,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const SalesExecutiveSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/field',               icon: MapPin,      label: 'Field View' },
    { to: '/assigned-potentials', icon: Buildings,   label: 'Assigned Dealers' },
    // { to: '/items',               icon: Package,     label: 'Items' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          bg-white border-r border-gray-200 shadow-sm
          transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-60'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 bg-gradient-to-r from-orange-500 to-orange-600 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SMART ITBox Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="w-8 h-8 rounded-lg bg-orange-400 items-center justify-center text-white font-bold text-sm hidden"
              >S</div>
              <div>
                <div className="font-bold text-sm text-white">Smart ITBox</div>
                <div className="text-xs text-white/80">Field Sales Automation</div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img
              src="/logo.png"
              alt="SMART ITBox"
              className="w-8 h-8 object-contain"
            />
          )}
          <button onClick={onClose} className="md:hidden text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Collapse toggle — desktop only */}
        <div className={`hidden md:flex py-2 bg-white ${isCollapsed ? 'justify-center px-1' : 'justify-end px-2'}`}>
          <button
            onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              onClick={onClose}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={isCollapsed ? 22 : 20} weight="regular" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Sign Out */}
        <div className={`border-t border-gray-200 bg-white ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate capitalize">{user?.name || 'Sales Executive'}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'Sales Executive'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <SignOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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

export default SalesExecutiveSidebar;
