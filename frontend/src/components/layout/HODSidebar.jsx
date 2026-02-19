import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  SignOut, 
  House, 
  Users, 
  ChartBar,
  ListBullets
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const HODSidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/hod', icon: House, label: 'Dashboard' },
    { to: '/hod/executives', icon: Users, label: 'My Team' },
    { to: '/hod/reports', icon: ChartBar, label: 'Reports' },
    { to: '/hod/visits', icon: ListBullets, label: 'Visit History' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-600 to-indigo-700 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-purple-500/30">
            <h1 className="text-white text-xl font-bold">FieldOps</h1>
            <p className="text-purple-200 text-xs mt-1">HOD Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'text-purple-100 hover:bg-purple-500/30'
                  }
                `}
              >
                <item.icon size={20} weight={window.location.pathname === item.to ? 'fill' : 'regular'} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-purple-500/30">
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-purple-100 hover:bg-purple-500/30 hover:text-white"
            >
              <SignOut size={20} className="mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default HODSidebar;
