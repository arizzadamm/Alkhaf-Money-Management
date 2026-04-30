import React, { useState } from 'react';
import { Home, CreditCard, User, Bell, Users, LogOut, Plus } from 'lucide-react';
import { formatIDR, getInitial } from '../../utils/formatters';
import { NotificationPanel } from '../NotificationPanel';

export const Sidebar = ({
  user, isAdmin, activeView, setActiveView,
  displayBalance, displayBalanceLabel, showTotalBalance, setShowTotalBalance, notifications, readNotifications, setReadNotifications,
  handleLogout, fetchAdminUsers,
  setIsAddOpen,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div>
        <div className="logo"><div className="logo-icon">AF</div> AlkaFlow</div>
        <div className="nav-links">
          {isAdmin ? (
            <button
              type="button"
              className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => { setActiveView('admin'); fetchAdminUsers(); }}
              aria-current={activeView === 'admin' ? 'page' : undefined}
            >
              <Users size={20} /> User Management
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
                onClick={() => setActiveView('home')}
                aria-current={activeView === 'home' ? 'page' : undefined}
              >
                <Home size={20} /> Home
              </button>
              <button
                type="button"
                className={`nav-item ${activeView === 'transactions' ? 'active' : ''}`}
                onClick={() => { setActiveView('transactions'); }}
                aria-current={activeView === 'transactions' ? 'page' : undefined}
              >
                <CreditCard size={20} /> Transactions
              </button>
              <button
                type="button"
                className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveView('profile')}
                aria-current={activeView === 'profile' ? 'page' : undefined}
              >
                <User size={20} /> Profile
              </button>
            </>
          )}
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="profile-widget">
          <div className="profile-avatar">
            <div style={{width:'100%', height:'100%', background:'var(--accent-lime)', color:'var(--text-on-accent)', display:'grid', placeContent:'center', fontWeight:'700'}}>{getInitial(user.name)}</div>
          </div>
          <div className="profile-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-role">{user.role}</div>
          </div>
          <div style={{position:'relative'}}>
            <button
              type="button"
              className="icon-button-reset"
              style={{cursor:'pointer',position:'relative'}}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label="Toggle notifications"
              aria-expanded={isNotificationOpen}
            >
              <Bell size={18} color="var(--text-secondary)" />
              {notifications.filter(n => !readNotifications.has(n.id)).length > 0 && <span className="notification-badge">{notifications.filter(n => !readNotifications.has(n.id)).length}</span>}
            </button>
            {isNotificationOpen && (
              <NotificationPanel
                notifications={notifications}
                readNotifications={readNotifications}
                setReadNotifications={setReadNotifications}
                onClose={() => setIsNotificationOpen(false)}
              />
            )}
          </div>
        </div>
        {!isAdmin && (
          <>
            <button
              type="button"
              className="total-balance total-balance-toggle"
              onClick={() => setShowTotalBalance(!showTotalBalance)}
              aria-label="Toggle balance scope"
            >
              <div style={{display:'flex', alignItems:'center', gap:'0.4rem'}}>
                <div className="total-balance-label">{displayBalanceLabel}</div>
                <span style={{background:'var(--hover-bg)', borderRadius:'999px', padding:'0.1rem 0.45rem', fontSize:'0.65rem', fontWeight:'600', color:'var(--text-secondary)'}}>{showTotalBalance ? 'Bulan Ini' : 'Total'}</span>
              </div>
              <div className="total-balance-value">{formatIDR(displayBalance)}</div>
            </button>
            <button className="btn-lime" onClick={() => setIsAddOpen(true)}><Plus size={20} /> Quick Add</button>
          </>
        )}
        {isAdmin && <button className="btn-danger" onClick={handleLogout}><LogOut size={18}/> Logout</button>}
      </div>
    </aside>
  );
};
