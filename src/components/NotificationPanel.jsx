import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const NotificationPanel = ({ notifications, readNotifications, setReadNotifications, onClose }) => {
  return (
    <>
      <div className="notification-panel-overlay" onClick={onClose} />
      <div className="notification-panel" role="dialog" aria-modal="true" aria-label="Notifications">
        <div className="notification-panel-header">
          <h3>Notifikasi</h3>
          <button type="button" onClick={() => { setReadNotifications(new Set(notifications.map(n => n.id))); }}>Tandai semua dibaca</button>
        </div>
        {notifications.length === 0 ? <div className="notification-empty">Tidak ada notifikasi</div> : notifications.map(n => (
          <button
            key={n.id}
            type="button"
            className={`notification-item ${readNotifications.has(n.id) ? '' : 'unread'}`}
            onClick={() => setReadNotifications(prev => new Set([...prev, n.id]))}
            aria-label={`Notification: ${n.title}`}
          >
            <div className={`notification-icon ${n.type}`}><AlertTriangle size={18} /></div>
            <div className="notification-content">
              <div className="notification-title">{n.title}</div>
              <div className="notification-desc">{n.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};
