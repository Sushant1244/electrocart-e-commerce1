import React, { useEffect, useRef, useState } from 'react';
import api from '../api/api';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [toast, setToast] = useState(null);
  const TOAST_STYLE = { position: 'fixed', right: 16, bottom: 16, background: '#fff', padding: 12, boxShadow: '0 8px 30px rgba(2,6,23,0.12)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' };
  const IMG_STYLE = { width: 40, height: 40, objectFit: 'cover', borderRadius: 6 };
  const inFlight = useRef(false);
  const intervalRef = useRef(null);
  const stoppedRef = useRef(false);

  const POLL_INTERVAL = 3000;

  const load = async () => {
    if (stoppedRef.current || inFlight.current) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    inFlight.current = true;
    try {
      const res = await api.get('/notifications');
      if (res && res.data) setNotifs(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        stoppedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      // ignore other errors
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    const startIfAuthed = () => {
      if (intervalRef.current) return;
      const token = localStorage.getItem('token');
      if (!token) return;
      load();
      intervalRef.current = setInterval(load, POLL_INTERVAL);
    };

    startIfAuthed();

    const onStorage = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          stoppedRef.current = false;
          startIfAuthed();
        } else {
          stoppedRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    };

    // Show optimistic notification when wishlist changes in the same tab
  const onWishlist = (e) => {
      try {
        const data = e?.detail || {};
        if (data && data.productId) {
      const title = data.added ? 'Added to wishlist' : 'Removed from wishlist';
      const body = data.added ? 'An item was added to your wishlist.' : 'An item was removed from your wishlist.';
      const meta = data.meta || {};
      const localNotif = { id: `local-${Date.now()}`, title, body, read: false, meta };
      setNotifs(prev => [localNotif, ...prev]);
      // show a brief toast
      setToast({ id: localNotif.id, title, image: meta.image || null });
      setTimeout(() => setToast(null), 2500);
        }
      } catch (err) {}
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('wishlistUpdated', onWishlist);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('wishlistUpdated', onWishlist);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map(n => (n.id === id || n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="notif-root">
      <button className="notif-btn" onClick={() => { setOpen(!open); if (!open) load(); }} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-menu">
          {notifs.length === 0 && <div className="muted">No notifications</div>}
          {notifs.map(n => (
            <div key={n.id || n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {n.meta?.image && <img src={n.meta.image} alt={n.title} style={IMG_STYLE} />}
                <div style={{ flex: 1 }}>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-body small muted">{n.body}</div>
                </div>
                {!n.read && <button className="link small" onClick={() => markRead(n.id || n._id)}>Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && (
        <div className="notif-toast">
          {toast.image && <img src={toast.image} alt="notif" className="notif-toast-img" />}
          <div className="notif-toast-text">{toast.title}</div>
        </div>
      )}
    </div>
  );
}
