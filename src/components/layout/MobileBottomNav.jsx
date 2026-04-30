import React from 'react';
import { Home, CreditCard, User, ArrowRightLeft, Settings, Users, LogOut, Plus } from 'lucide-react';

export const MobileBottomNav = ({
  isAdmin, activeView, setActiveView,
  handleLogout, fetchAdminUsers,
  setIsAddOpen, setIsSettingsOpen,
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {isAdmin ? (
        <>
          <button
            type="button"
            className={`mobile-nav-item ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveView('admin'); fetchAdminUsers(); }}
            aria-current={activeView === 'admin' ? 'page' : undefined}
          >
            <Users size={24} /> <span>Users</span>
          </button>
          <button type="button" className="mobile-nav-fab" onClick={handleLogout} aria-label="Logout">
             <LogOut size={24} color="var(--text-on-accent)" />
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveView('admin'); fetchAdminUsers(); }}
            aria-current={activeView === 'admin' ? 'page' : undefined}
          >
            <Settings size={24} /> <span>Admin</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`mobile-nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => setActiveView('home')}
            aria-current={activeView === 'home' ? 'page' : undefined}
          >
            <Home size={24} /> <span>Home</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${activeView === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveView('transactions')}
            aria-current={activeView === 'transactions' ? 'page' : undefined}
          >
            <ArrowRightLeft size={24} /> <span>Trans</span>
          </button>

          <button type="button" className="mobile-nav-fab" onClick={() => setIsAddOpen(true)} aria-label="Quick add expense">
             <Plus size={26} color="var(--text-on-accent)" />
          </button>

          <button type="button" className="mobile-nav-item" onClick={() => setIsSettingsOpen(true)} aria-label="Open cards settings">
            <CreditCard size={24} /> <span>Cards</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveView('profile')}
            aria-current={activeView === 'profile' ? 'page' : undefined}
          >
            <User size={24} /> <span>Profile</span>
          </button>
        </>
      )}
    </nav>
  );
};
