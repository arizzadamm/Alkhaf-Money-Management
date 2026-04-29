import React from 'react';
import { Home, CreditCard, User, ArrowRightLeft, Settings, Users, LogOut, QrCode } from 'lucide-react';

export const MobileBottomNav = ({
  isAdmin, activeView, setActiveView,
  handleLogout, fetchAdminUsers,
  setIsTopUpOpen, setIsSettingsOpen,
}) => {
  return (
    <div className="mobile-bottom-nav">
      {isAdmin ? (
        <>
          <div className={`mobile-nav-item ${activeView === 'admin' ? 'active' : ''}`} onClick={() => { setActiveView('admin'); fetchAdminUsers(); }}>
            <Users size={24} /> <span>Users</span>
          </div>
          <div className="mobile-nav-fab" onClick={handleLogout}>
             <LogOut size={24} color="#0f172a" />
          </div>
          <div className={`mobile-nav-item ${activeView === 'admin' ? 'active' : ''}`} onClick={() => { setActiveView('admin'); fetchAdminUsers(); }}>
            <Settings size={24} /> <span>Admin</span>
          </div>
        </>
      ) : (
        <>
          <div className={`mobile-nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
            <Home size={24} /> <span>Home</span>
          </div>
          <div className={`mobile-nav-item ${activeView === 'transactions' ? 'active' : ''}`} onClick={() => setActiveView('transactions')}>
            <ArrowRightLeft size={24} /> <span>Trans</span>
          </div>

          <div className="mobile-nav-fab" onClick={() => setIsTopUpOpen(true)}>
             <QrCode size={26} color="#0f172a" />
          </div>

          <div className={`mobile-nav-item`} onClick={() => setIsSettingsOpen(true)}>
            <CreditCard size={24} /> <span>Cards</span>
          </div>
          <div className={`mobile-nav-item ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}>
            <User size={24} /> <span>Profile</span>
          </div>
        </>
      )}
    </div>
  );
};
