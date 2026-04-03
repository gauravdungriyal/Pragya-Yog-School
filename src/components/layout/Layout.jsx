import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex bg-white min-h-screen">
      {/* Sidebar - Fixed on desktop, Overlay on mobile */}
      <div className={`
        fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden 
        ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 lg:fixed lg:w-72
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {location.pathname !== '/search' && (
          <SearchBar onMenuClick={() => setIsSidebarOpen(true)} />
        )}
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
