import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useSearch } from '../context/SearchContext';

const SearchBar = ({ placeholder = "Search...", className = "" }) => {
  const { searchTerm, setSearchTerm } = useSearch();

  return (
    <div className={`relative max-w-sm w-full ${className}`}>
      <MagnifyingGlass 
        size={16} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
      />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all shadow-sm"
      />
    </div>
  );
};

export default SearchBar;
