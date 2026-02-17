import { useState } from 'react';
import SalesExecutiveSidebar from './SalesExecutiveSidebar';

const SalesExecutiveLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SalesExecutiveSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 md:ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SalesExecutiveLayout;
