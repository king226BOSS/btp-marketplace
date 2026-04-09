import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { socket } from '../socket.js';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    socket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      socket.off('notification');
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setNotifications(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const clearRead = async () => {
    try {
      await fetch(`http://localhost:5000/api/notifications/read`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(notifications.filter(n => !n.is_read));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Bell className="text-primary" /> Notifications
        </h1>
        <button className="btn btn-secondary" onClick={clearRead}>
          <Trash2 size={18} /> Nettoyer
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</p>
        ) : notifications.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Aucune notification pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notif-item ${notif.is_read ? '' : 'unread'}`}
                style={{
                  padding: '1.25rem',
                  borderBottom: '1px solid var(--border)',
                  background: notif.is_read ? 'transparent' : 'rgba(255, 107, 1, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: notif.is_read ? 400 : 600 }}>{notif.content}</p>
                  <small style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                    <Clock size={12} /> {new Date(notif.created_at).toLocaleString()}
                  </small>
                </div>
                {!notif.is_read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', borderRadius: '50%' }}
                    title="Marquer comme lu"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
