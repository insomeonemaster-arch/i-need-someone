import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { notificationsService, usersService, type PrivacySettings, type DisplaySettings } from '@/services';
import { STORAGE_KEYS } from '@/services/config';
import {
  ArrowLeft, Loader2, Check, ChevronRight, Eye, EyeOff,
  Monitor, Smartphone, Globe, Trash2, LogOut, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  messages: boolean;
  jobs: boolean;
  marketing: boolean;
}

interface Session {
  id: string;
  ipAddress?: string;
  deviceInfo?: { userAgent?: string };
  createdAt: string;
  expiresAt: string;
}

type ActivePanel = null | 'changePassword' | 'activeSessions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseUserAgent(ua?: string): { browser: string; os: string } {
  if (!ua) return { browser: 'Unknown browser', os: 'Unknown device' };
  const browser =
    ua.includes('Chrome') && !ua.includes('Edg') ? 'Chrome'
    : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Safari') && !ua.includes('Chrome') ? 'Safari'
    : ua.includes('Edg') ? 'Edge'
    : 'Browser';
  const os =
    ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
    : ua.includes('Android') ? 'Android'
    : ua.includes('Windows') ? 'Windows'
    : ua.includes('Mac') ? 'macOS'
    : ua.includes('Linux') ? 'Linux'
    : 'Unknown';
  return { browser, os };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function ChangePasswordPanel({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const valid =
    form.current.length >= 1 &&
    form.next.length >= 8 &&
    form.next === form.confirm;

  const handleSubmit = async () => {
    if (!valid) return;
    setStatus('saving');
    setErrorMsg('');
    try {
      await usersService.updatePassword(form.current, form.next);
      setStatus('saved');
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update password');
      setStatus('error');
    }
  };

  const toggle = (field: keyof typeof show) =>
    setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const field = (
    id: keyof typeof form,
    label: string,
    placeholder: string,
    showKey: keyof typeof show,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show[showKey] ? 'text' : 'password'}
          placeholder={placeholder}
          value={form[id]}
          onChange={e => setForm(prev => ({ ...prev, [id]: e.target.value }))}
          className="pr-10 bg-white"
          autoComplete={id === 'current' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={() => toggle(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show[showKey] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold flex-1">Change Password</h1>
        {status === 'saving' && <Loader2 className="size-4 animate-spin text-gray-400" />}
        {status === 'saved' && <Check className="size-4 text-green-600" />}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <Card>
          <CardContent className="p-5 space-y-4">
            {field('current', 'Current Password', '••••••••', 'current')}
            {field('next', 'New Password', 'Min. 8 characters', 'next')}
            {field('confirm', 'Confirm New Password', 'Re-enter new password', 'confirm')}

            {form.next.length > 0 && form.next.length < 8 && (
              <p className="text-xs text-red-500">Password must be at least 8 characters</p>
            )}
            {form.confirm.length > 0 && form.next !== form.confirm && (
              <p className="text-xs text-red-500">Passwords don't match</p>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="size-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            {status === 'saved' && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <Check className="size-4" />
                Password updated successfully
              </div>
            )}

            <Button
              className="w-full min-h-[44px]"
              disabled={!valid || status === 'saving'}
              onClick={handleSubmit}
            >
              {status === 'saving' ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Updating…</>
              ) : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 text-center mt-4 px-2">
          After changing your password you'll stay logged in on this device. Other active sessions will be signed out automatically.
        </p>
      </div>
    </div>
  );
}

function ActiveSessionsPanel({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const currentToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersService.getSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await usersService.revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } finally {
      setRevoking(null);
    }
  };

  const revokeAll = async () => {
    setRevokingAll(true);
    try {
      await usersService.revokeAllSessions();
      setSessions([]);
    } finally {
      setRevokingAll(false);
    }
  };

  const isMobile = (ua?: string) =>
    ua ? /iPhone|Android|iPad|Mobile/i.test(ua) : false;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold flex-1">Active Sessions</h1>
        {!loading && sessions.length > 1 && (
          <button
            onClick={revokeAll}
            disabled={revokingAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            {revokingAll ? 'Signing out…' : 'Sign out all'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <LogOut className="size-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No active sessions</p>
            <p className="text-gray-400 text-sm mt-1">All sessions have been revoked</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 px-1">
              {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
            </p>
            {sessions.map((session) => {
              const ua = session.deviceInfo?.userAgent;
              const { browser, os } = parseUserAgent(ua);
              const mobile = isMobile(ua);
              const DeviceIcon = mobile ? Smartphone : Monitor;
              const isCurrentDevice =
                currentToken
                  ? session.id === sessions[0]?.id
                  : false;

              return (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <DeviceIcon className="size-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm">{browser} on {os}</p>
                          {isCurrentDevice && (
                            <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                              This device
                            </span>
                          )}
                        </div>
                        {session.ipAddress && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                            <Globe className="size-3" />
                            {session.ipAddress}
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Started {timeAgo(session.createdAt)} · Expires {timeAgo(session.expiresAt)}
                        </p>
                      </div>
                      {!isCurrentDevice && (
                        <button
                          onClick={() => revoke(session.id)}
                          disabled={revoking === session.id}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
                          title="Revoke session"
                        >
                          {revoking === session.id
                            ? <Loader2 className="size-4 animate-spin" />
                            : <Trash2 className="size-4" />}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const [settings, setSettings] = useState<NotificationSettings>({
    push: true, email: true, sms: false,
    messages: true, jobs: true, marketing: false,
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: true, showOnlineStatus: true, allowDirectMessages: true,
  });
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    darkMode: false, compactView: false,
    language: 'en', currency: 'USD', timezone: 'America/Los_Angeles',
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Refs always hold the latest state so the debounced flush reads fresh values
  const settingsRef = useRef(settings);
  const privacyRef = useRef(privacySettings);
  const displayRef = useRef(displaySettings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { privacyRef.current = privacySettings; }, [privacySettings]);
  useEffect(() => { displayRef.current = displaySettings; }, [displaySettings]);

  // Track which sections have unsaved changes and pending timers
  const dirtyRef = useRef({ notif: false, privacy: false, display: false });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel pending timers on unmount
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  // Executes all pending saves in one parallel batch
  const flushSave = useCallback(async () => {
    const dirty = { ...dirtyRef.current };
    dirtyRef.current = { notif: false, privacy: false, display: false };

    const saves: Promise<unknown>[] = [];

    if (dirty.notif) {
      const s = settingsRef.current;
      const pushTypes  = s.push  ? ['payments','reviews','system',...(s.messages?['messages']:[]),...(s.jobs?['bookings']:[])] : [];
      const emailTypes = s.email ? ['payments','reviews','system',...(s.messages?['messages']:[]),...(s.jobs?['bookings']:[]),...(s.marketing?['marketing']:[])] : [];
      const smsTypes   = s.sms   ? ['payments',...(s.messages?['messages']:[]),...(s.jobs?['bookings']:[])] : [];
      saves.push(notificationsService.updateSettings({ push:{types:pushTypes}, email:{types:emailTypes}, sms:{types:smsTypes} }));
    }
    if (dirty.privacy) saves.push(usersService.updatePrivacySettings(privacyRef.current));
    if (dirty.display) saves.push(usersService.updateDisplaySettings(displayRef.current));
    if (!saves.length) return;

    try {
      await Promise.all(saves);
      setSaveStatus('saved');
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  // Mark a section dirty and schedule a debounced flush; shows 'saving' immediately
  const scheduleSave = useCallback((section: 'notif' | 'privacy' | 'display') => {
    dirtyRef.current[section] = true;
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, 1200);
  }, [flushSave]);

  // Load all settings once on mount
  useEffect(() => {
    (async () => {
      try {
        const [notifData, privacyData, displayData] = await Promise.all([
          notificationsService.getSettings(),
          usersService.getPrivacySettings(),
          usersService.getDisplaySettings(),
        ]);

        const pushTypes  = notifData.push?.types  ?? [];
        const emailTypes = notifData.email?.types ?? [];
        const smsTypes   = notifData.sms?.types   ?? [];

        const loaded: NotificationSettings = {
          push:      pushTypes.length  > 0,
          email:     emailTypes.length > 0,
          sms:       smsTypes.length   > 0,
          messages:  pushTypes.includes('messages')  || emailTypes.includes('messages')  || smsTypes.includes('messages'),
          jobs:      pushTypes.includes('bookings')  || emailTypes.includes('bookings')  || smsTypes.includes('bookings'),
          marketing: emailTypes.includes('marketing'),
        };

        // Update refs first so no stale closure problems if something re-renders fast
        settingsRef.current = loaded;
        privacyRef.current  = privacyData;
        displayRef.current  = displayData;

        setSettings(loaded);
        setPrivacySettings(privacyData);
        setDisplaySettings(displayData);
      } catch {
        // keep defaults on error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Toggle helpers — each explicitly marks its section dirty rather than relying on effect deps
  const toggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    scheduleSave('notif');
  };
  const togglePrivacy = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
    scheduleSave('privacy');
  };
  const toggleDisplay = (key: keyof DisplaySettings) => {
    setDisplaySettings(prev => ({ ...prev, [key]: !(prev[key] as boolean) }));
    scheduleSave('display');
  };

  // ── Sub-panel router ───────────────────────────────────────────────────────
  if (activePanel === 'changePassword') {
    return <ChangePasswordPanel onBack={() => setActivePanel(null)} />;
  }
  if (activePanel === 'activeSessions') {
    return <ActiveSessionsPanel onBack={() => setActivePanel(null)} />;
  }

  // ── Main page ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-semibold">Settings</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Settings</h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm min-w-[60px] justify-end">
          {saveStatus === 'saving' && <><Loader2 className="size-4 animate-spin text-gray-400" /><span className="text-gray-400">Saving…</span></>}
          {saveStatus === 'saved'  && <><Check className="size-4 text-green-600" /><span className="text-green-600">Saved</span></>}
          {saveStatus === 'error'  && <span className="text-red-500">Failed to save</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">

        {/* Notifications */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Notifications</h3>
            <div className="space-y-4">
              {([
                ['push',      'Push Notifications',  'Receive notifications on your device'],
                ['email',     'Email Notifications', 'Receive updates via email'],
                ['sms',       'SMS Notifications',   'Receive text message alerts'],
                ['messages',  'New Messages',         'Get notified of new messages'],
                ['jobs',      'Job Opportunities',   'Receive job recommendations'],
                ['marketing', 'Marketing Updates',   'News and promotional content'],
              ] as [keyof NotificationSettings, string, string][]).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{title}</Label>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                  <Switch checked={settings[key]} onCheckedChange={() => toggle(key)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Privacy</h3>
            <div className="space-y-4">
              {([
                ['profileVisibility',   'Profile Visibility',    'Make your profile public'],
                ['showOnlineStatus',    'Show Online Status',    "Let others see when you're active"],
                ['allowDirectMessages', 'Allow Direct Messages', 'Anyone can message you'],
              ] as [keyof PrivacySettings, string, string][]).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{title}</Label>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                  <Switch checked={privacySettings[key]} onCheckedChange={() => togglePrivacy(key)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Display</h3>
            <div className="space-y-4">
              {([
                ['darkMode',    'Dark Mode',    'Use dark theme'],
                ['compactView', 'Compact View', 'Show more content on screen'],
              ] as [keyof DisplaySettings, string, string][]).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{title}</Label>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                  <Switch checked={displaySettings[key] as boolean} onCheckedChange={() => toggleDisplay(key)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Language & Region</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Language', displaySettings.language === 'en' ? 'English' : displaySettings.language],
                ['Currency', displaySettings.currency],
                ['Time Zone', displaySettings.timezone],
              ].map(([label, value], i, arr) => (
                <div key={label} className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b' : ''}`}>
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <h3 className="font-semibold mb-3">Security</h3>
            <button
              onClick={() => setActivePanel('changePassword')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Change Password</span>
              <ChevronRight className="size-4 text-gray-400" />
            </button>
            <button
              onClick={() => setActivePanel('activeSessions')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Active Sessions</span>
              <ChevronRight className="size-4 text-gray-400" />
            </button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
