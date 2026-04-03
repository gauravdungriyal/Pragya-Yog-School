import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SearchBar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-white px-4 md:px-6 py-4 flex justify-center w-full">
      <div className="w-full relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-pragya-dark/60" />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-6 py-3 bg-[#f1f1f1] border-none rounded-full focus:ring-4 focus:ring-pragya-green/5 transition-all outline-none text-sm font-medium text-pragya-dark placeholder:text-pragya-dark/60 hover:bg-[#e9e9e9]"
        />
      </div>
    </header>
  );
};

export default SearchBar;
