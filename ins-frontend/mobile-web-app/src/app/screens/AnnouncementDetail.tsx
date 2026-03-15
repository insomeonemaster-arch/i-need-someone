import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Bell } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { notificationsService, Announcement } from '@/services';

export default function AnnouncementDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    notificationsService
      .getAnnouncement(id)
      .then(setAnnouncement)
      .catch(() => setError('Failed to load announcement.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/notifications')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Announcement</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/notifications')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Announcement</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Announcement not found'}</p>
        </div>
      </div>
    );
  }

  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
  const statusLabel = isExpired ? 'Expired' : 'Active';


  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/notifications')} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Announcement</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            {/* Icon & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Bell className="size-6" />
              </div>
              <Badge variant={isExpired ? 'secondary' : 'default'}>
                {statusLabel}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-3">{announcement.title}</h2>
              
              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>Published: {new Date(announcement.publishedAt).toLocaleDateString()}</span>
                </div>
                {announcement.expiresAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              {announcement.content.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={index} className="font-semibold mt-4 mb-2">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                } else if (paragraph.startsWith('•')) {
                  return (
                    <li key={index} className="ml-4 mb-1">
                      {paragraph.replace('•', '').trim()}
                    </li>
                  );
                } else if (paragraph.trim()) {
                  return (
                    <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

