import React from 'react';
import { Search, Settings, Moon, Sun } from 'lucide-react';

export const TopBar = ({
  activeView, viewMonthName, isAdmin,
  searchQuery, setSearchQuery, setActiveView,
  isDarkMode, toggleTheme,
  setIsSettingsOpen,
}) => {
  return (
    <div className="top-bar">
      <div className="page-title">
        {activeView === 'home' && `Overview - ${viewMonthName}`}
        {activeView === 'transactions' && `Transactions for ${viewMonthName}`}
        {activeView === 'admin' && 'AlkaFlow Admin'}
        {activeView === 'profile' && `Your Account`}
      </div>
      <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
        <button style={{background:'var(--bg-card)', border:'none', padding:'0.75rem', borderRadius:'50%', cursor:'pointer'}} onClick={toggleTheme}>
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
        {!isAdmin && (
          <>
            <div className="search-bar">
              <Search size={18} color="var(--text-secondary)"/>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); if(activeView!=='transactions') setActiveView('transactions');}}/>
            </div>
            <button style={{background:'var(--bg-card)', border:'none', padding:'0.75rem', borderRadius:'50%', cursor:'pointer'}} onClick={() => setIsSettingsOpen(true)}>
              <Settings size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
