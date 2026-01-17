import { useState, useEffect } from 'react';
import { X, Bell, Check, Clock, AlertCircle, Calendar, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'consultation';
  created_at: string;
  read: boolean;
}

interface DoctorNotificationsPanelProps {
  onClose: () => void;
}

export function DoctorNotificationsPanel({ onClose }: DoctorNotificationsPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get doctor data
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!doctorData) return;

      // Get consultations for this doctor
      const { data: consultations } = await supabase
        .from('consultations')
        .select(`
          id,
          status,
          priority,
          symptoms,
          created_at,
          patient:patients(
            user:users(full_name)
          )
        `)
        .eq('doctor_id', doctorData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get pending consultations
      const { data: pendingConsultations } = await supabase
        .from('consultations')
        .select(`
          id,
          status,
          priority,
          symptoms,
          created_at,
          patient:patients(
            user:users(full_name)
          )
        `)
        .is('doctor_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Create notifications from consultations
      const notifs: Notification[] = [];

      // Add welcome notification
      notifs.push({
        id: 'welcome',
        title: 'Welcome, Doctor!',
        message: 'You have access to patient consultations and your schedule.',
        type: 'info',
        created_at: new Date().toISOString(),
        read: false
      });

      // Add pending consultation notifications
      pendingConsultations?.forEach(c => {
        const patientName = (c.patient as any)?.user?.full_name || 'Unknown Patient';
        notifs.push({
          id: `pending-${c.id}`,
          title: 'New Consultation Request',
          message: `${patientName} has submitted a ${c.priority} priority consultation for ${c.symptoms[0] || 'symptoms'}.`,
          type: 'consultation',
          created_at: c.created_at,
          read: false
        });
      });

      // Add assigned consultation notifications
      consultations?.slice(0, 5).forEach(c => {
        const patientName = (c.patient as any)?.user?.full_name || 'Unknown Patient';
        if (c.status === 'assigned') {
          notifs.push({
            id: `assigned-${c.id}`,
            title: 'Consultation Assigned',
            message: `You've been assigned to ${patientName}'s consultation. Please review and add notes.`,
            type: 'info',
            created_at: c.created_at,
            read: false
          });
        } else if (c.status === 'completed') {
          notifs.push({
            id: `completed-${c.id}`,
            title: 'Consultation Completed',
            message: `You completed the consultation for ${patientName}.`,
            type: 'success',
            created_at: c.created_at,
            read: false
          });
        }
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="text-green-400" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-400" size={20} />;
      case 'consultation': return <UserCheck className="text-blue-400" size={20} />;
      default: return <Bell className="text-teal-400" size={20} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4">
      <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col mt-16 mr-4 animate-slide-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-teal-500" size={24} />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={markAllAsRead}
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="animate-spin text-teal-500" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Bell className="text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400 text-center">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-teal-50 dark:bg-teal-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mt-1 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}