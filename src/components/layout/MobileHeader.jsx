import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { getInitial } from '../../utils/formatters';

export const MobileHeader = ({ user, isAdmin, isDarkMode, toggleTheme, setIsNotificationOpen }) => {
  return (
    <div className="mobile-header">
      <div className="mobile-profile">
        <div className="profile-avatar" style={{width:'48px', height:'48px', borderRadius:'50%', border:'2px solid var(--accent-lime)'}}>
          <div style={{width:'100%', height:'100%', background:'var(--bg-main)', color:'var(--text-primary)', display:'grid', placeContent:'center', fontWeight:'700', fontSize:'1.2rem'}}>
            {getInitial(user.name)}
          </div>
        </div>
        <span className="mobile-profile-name">{user.name}</span>
      </div>
      <div style={{display:'flex', gap:'0.5rem'}}>
         <button style={{background:'var(--bg-card)', border:'none', width:'48px', height:'48px', borderRadius:'50%', display:'grid', placeContent:'center'}} onClick={toggleTheme}>
           {isDarkMode ? <Sun size={20} color="var(--text-primary)"/> : <Moon size={20} color="var(--text-primary)"/>}
         </button>
         {!isAdmin && (
           <button className="mobile-bell" onClick={() => setIsNotificationOpen(true)}>
             <Bell size={20} color="var(--text-primary)"/>
             <span className="notification-dot"></span>
           </button>
         )}
      </div>
    </div>
  );
};
