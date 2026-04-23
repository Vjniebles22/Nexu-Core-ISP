'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X, CheckCheck } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  async function loadNotifications() {
    try {
      const data = await fetchApi<Notification[]>('/api/notifications');
      setNotifications(data);
      const count = await fetchApi<{ count: number }>('/api/notifications/unread-count');
      setUnreadCount(count.count);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' });
      loadNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function markAllRead() {
    try {
      await fetchApi('/api/notifications/read-all', { method: 'PUT' });
      loadNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetchApi(`/api/notifications/${id}`, { method: 'DELETE' });
      loadNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Notificaciones</h3>
              <div className="flex gap-2">
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-500">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No hay notificaciones</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-3 ${getTypeStyles(notification.type)} ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {!notification.read && (
                          <button onClick={() => markAsRead(notification.id)} className="text-slate-400 hover:text-blue-600">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notification.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}