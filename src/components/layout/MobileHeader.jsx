import React, { useState } from 'react';
import { Bell, Moon, Sun, Search, X } from 'lucide-react';
import { getInitial } from '../../utils/formatters';

export const MobileHeader = ({ user, isAdmin, isDarkMode, toggleTheme, setIsNotificationOpen, notifications, readNotifications, searchQuery, setSearchQuery, setActiveView }) => {
  const [showSearch, setShowSearch] = useState(false);
  const unreadCount = (notifications || []).filter(n => !readNotifications?.has(n.id)).length;

  return (
    <div className="mobile-header">
      {showSearch && !isAdmin ? (
        <div className="mobile-search-bar">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery || ''}
            onChange={(e) => { setSearchQuery(e.target.value); if (setActiveView) setActiveView('transactions'); }}
            autoFocus
          />
          <button
            style={{background:'none', border:'none', cursor:'pointer', padding:'0.25rem'}}
            onClick={() => { setShowSearch(false); if (setSearchQuery) setSearchQuery(''); }}
            aria-label="Close search"
          >
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>
      ) : (
        <>
          <div className="mobile-profile">
            <div className="profile-avatar" style={{width:'48px', height:'48px', borderRadius:'50%', border:'2px solid var(--accent-lime)'}}>
              <div style={{width:'100%', height:'100%', background:'var(--bg-main)', color:'var(--text-primary)', display:'grid', placeContent:'center', fontWeight:'700', fontSize:'1.2rem'}}>
                {getInitial(user.name)}
              </div>
            </div>
            <span className="mobile-profile-name">{user.name}</span>
          </div>
          <div style={{display:'flex', gap:'0.5rem'}}>
             {!isAdmin && (
               <button style={{background:'var(--bg-card)', border:'none', width:'48px', height:'48px', borderRadius:'50%', display:'grid', placeContent:'center'}} onClick={() => setShowSearch(true)} aria-label="Open transaction search">
                  <Search size={20} color="var(--text-primary)"/>
                </button>
              )}
              <button style={{background:'var(--bg-card)', border:'none', width:'48px', height:'48px', borderRadius:'50%', display:'grid', placeContent:'center'}} onClick={toggleTheme} aria-label="Toggle theme">
                {isDarkMode ? <Sun size={20} color="var(--text-primary)"/> : <Moon size={20} color="var(--text-primary)"/>}
              </button>
              {!isAdmin && (
                <button className="mobile-bell" onClick={() => setIsNotificationOpen(true)} aria-label="Open notifications">
                  <Bell size={20} color="var(--text-primary)"/>
                  {unreadCount > 0 && <span className="notification-dot"></span>}
                </button>
              )}
          </div>
        </>
      )}
    </div>
  );
};
