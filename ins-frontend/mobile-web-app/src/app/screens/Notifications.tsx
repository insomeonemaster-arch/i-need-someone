import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Bell, MessageSquare, Briefcase, Rocket, Wrench, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { notificationsService, Notification, Announcement } from '@/services';

interface DisplayNotification {
  id: string;
  type: string;
  title: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  icon: typeof Bell;
  color: string;
  category: string;
  linkTo?: string;
}

function getIconAndColor(type: string): { icon: typeof Bell; color: string } {
  switch (type) {
    case 'message':
      return { icon: MessageSquare, color: 'bg-green-50 text-green-600' };
    case 'job':
      return { icon: Briefcase, color: 'bg-green-50 text-green-600' };
    case 'project':
      return { icon: Rocket, color: 'bg-purple-50 text-purple-600' };
    case 'request':
    case 'local-service':
      return { icon: Wrench, color: 'bg-blue-50 text-blue-600' };
    case 'announcement':
      return { icon: Bell, color: 'bg-blue-50 text-blue-600' };
    case 'payment':
      return { icon: AlertCircle, color: 'bg-[#4C9F9F]/10 text-[#4C9F9F]' };
    default:
      return { icon: Bell, color: 'bg-gray-50 text-gray-600' };
  }
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [notifs, announcements, count] = await Promise.all([
        notificationsService.getNotifications(),
        notificationsService.getAnnouncements(),
        notificationsService.getUnreadCount(),
      ]);

      setUnreadCount(count);

      const displayNotifs: DisplayNotification[] = [];

      notifs.forEach((notif: Notification) => {
        const { icon, color } = getIconAndColor(notif.type);
        displayNotifs.push({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          preview: notif.message,
          timestamp: notif.createdAt,
          unread: !notif.isRead,
          icon,
          color,
          category: notif.type,
          linkTo: notif.data?.redirectUrl,
        });
      });

      announcements.forEach((announcement: Announcement) => {
        displayNotifs.push({
          id: announcement.id,
          type: 'announcement',
          title: announcement.title,
          preview: announcement.content.slice(0, 100) + '...',
          timestamp: announcement.publishedAt,
          unread: false,
          icon: Bell,
          color: 'bg-blue-50 text-blue-600',
          category: 'system',
          linkTo: `/notifications/announcement/${announcement.id}`,
        });
      });

      displayNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(displayNotifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === activeTab);

  const handleNotificationClick = async (notification: DisplayNotification) => {
    if (!notification.unread) {
      if (notification.type === 'announcement') {
        navigate(`/notifications/announcement/${notification.id}`);
      } else if (notification.linkTo) {
        navigate(notification.linkTo);
      }
      return;
    }

    try {
      await notificationsService.markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (notification.type === 'announcement') {
        navigate(`/notifications/announcement/${notification.id}`);
      } else if (notification.linkTo) {
        navigate(notification.linkTo);
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Bell className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">Notifications</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Bell className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">Notifications</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Bell className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-600">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b px-4 pt-2 overflow-x-auto">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="min-w-[80px]">All</TabsTrigger>
            <TabsTrigger value="requests" className="min-w-[80px]">Requests</TabsTrigger>
            <TabsTrigger value="projects" className="min-w-[80px]">Projects</TabsTrigger>
            <TabsTrigger value="jobs" className="min-w-[80px]">Jobs</TabsTrigger>
            <TabsTrigger value="system" className="min-w-[80px]">System</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          <TabsContent value={activeTab} className="mt-0">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <Bell className="size-16 text-gray-300 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No notifications</h3>
                <p className="text-gray-600 text-sm">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`rounded-none border-x-0 border-t-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.unread ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${notification.color} flex-shrink-0`}>
                        <notification.icon className="size-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-sm leading-tight">
                            {notification.title}
                          </h3>
                          {notification.unread && (
                            <div className="size-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.preview}
                        </p>

                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
