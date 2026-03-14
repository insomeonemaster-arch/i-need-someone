import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Bell } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

const mockAnnouncements: Record<string, {
  id: string;
  title: string;
  body: string;
  publishedDate: string;
  expiresDate?: string;
  ctaLabel?: string;
  ctaLink?: string;
  status: 'active' | 'expired' | 'scheduled';
}> = {
  '1': {
    id: '1',
    title: 'New Feature: Enhanced Search',
    body: `We're excited to announce a major upgrade to our search functionality!

**What's New:**
• Advanced filtering options for all service categories
• Location-based radius search with map view
• Price range filters for better budget matching
• Skill and experience level filters
• Saved search preferences

**How to Use:**
Simply navigate to any Browse screen and look for the new filter icon in the top right corner. You can now narrow down results to find exactly what you're looking for.

**Feedback:**
We'd love to hear your thoughts on this update. Please share your feedback through the Help & Support section.

Thank you for being part of I Need Someone!`,
    publishedDate: '2026-02-08',
    status: 'active',
    ctaLabel: 'Try New Search',
    ctaLink: '/jobs/candidate/browse',
  },
  '7': {
    id: '7',
    title: 'Platform Maintenance Notice',
    body: `**Scheduled Maintenance Window**

To improve platform performance and security, we will be performing scheduled maintenance on:

**Date:** February 15, 2026
**Time:** 2:00 AM - 4:00 AM PST
**Expected Duration:** 2 hours

**What to Expect:**
• The platform will be temporarily unavailable during this window
• All active sessions will be logged out
• No data will be lost
• Service will be fully restored by 4:00 AM PST

**Preparations:**
• Save any work in progress before 2:00 AM PST
• Plan critical communications outside this window
• Check back after 4:00 AM PST to resume normal operations

We apologize for any inconvenience and appreciate your understanding.`,
    publishedDate: '2026-02-07',
    expiresDate: '2026-02-15',
    status: 'active',
  },
};

export default function AnnouncementDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const announcement = id ? mockAnnouncements[id] : null;

  if (!announcement) {
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
          <p className="text-gray-600">Announcement not found</p>
        </div>
      </div>
    );
  }

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
              <Badge variant={announcement.status === 'expired' ? 'secondary' : 'default'}>
                {announcement.status === 'active' ? 'Active' : 
                 announcement.status === 'expired' ? 'Expired' : 'Scheduled'}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-3">{announcement.title}</h2>
              
              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>Published: {announcement.publishedDate}</span>
                </div>
                {announcement.expiresDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    <span>Expires: {announcement.expiresDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              {announcement.body.split('\n').map((paragraph, index) => {
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

            {/* CTA Button */}
            {announcement.ctaLabel && announcement.ctaLink && (
              <Button 
                className="w-full min-h-[44px]"
                onClick={() => navigate(announcement.ctaLink!)}
              >
                {announcement.ctaLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
