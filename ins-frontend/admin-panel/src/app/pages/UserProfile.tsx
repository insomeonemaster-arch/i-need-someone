import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Button,
  StatusBadge,
  ConfirmationModal,
} from '../components/ui/AdminComponents';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Flag,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { usersService } from '../../services/admin.service';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    usersService.getUser(id)
      .then((res: any) => setUser(res.data ?? res))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSuspend = async (_reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await usersService.suspendUser(id);
      setUser((u: any) => ({ ...u, isActive: false, status: 'suspended' }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Suspend failed');
    } finally {
      setActionLoading(false);
      setShowSuspendModal(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await usersService.unsuspendUser(id);
      setUser((u: any) => ({ ...u, isActive: true, status: 'active' }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Unsuspend failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-[#5B7CFA]" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="p-6 flex flex-col items-center gap-4">
          <p className="text-red-500">{error || 'User not found'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || '?';
  const isActive = user.status === 'active' || (user.status === undefined && user.isActive !== false);
  const roles: string[] = [user.isAdmin && 'admin', user.isProvider && 'provider'].filter(Boolean) as string[];
  const stats = user._count ?? {};

  return (
    <AdminLayout>
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-[#4C566A] hover:text-[#5B7CFA] mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{fullName}</h1>
          <StatusBadge status={isActive ? 'active' : 'suspended'} />
          {roles.map((r: string) => (
            <span key={r} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm font-medium capitalize">
              {r}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity card */}
          <Card>
            <div className="p-5 flex flex-col items-center gap-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={fullName} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 bg-[#5B7CFA] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {initials}
                </div>
              )}
              <div className="w-full space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-[#4C566A] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[#4C566A] text-xs">Full Name</div>
                    <div className="font-medium">{fullName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-[#4C566A] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[#4C566A] text-xs">Email</div>
                    <div className="font-medium break-all">{user.email}</div>
                    {user.isEmailVerified && (
                      <span className="text-xs text-green-600">✓ Verified</span>
                    )}
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-[#4C566A] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[#4C566A] text-xs">Phone</div>
                      <div className="font-medium">{user.phone}</div>
                      {user.isPhoneVerified && (
                        <span className="text-xs text-green-600">✓ Verified</span>
                      )}
                    </div>
                  </div>
                )}
                {(user.city || user.country) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#4C566A] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[#4C566A] text-xs">Location</div>
                      <div className="font-medium">{[user.city, user.state, user.country].filter(Boolean).join(', ')}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#4C566A] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[#4C566A] text-xs">Member Since</div>
                    <div className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-[#4C566A] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[#4C566A] text-xs">Last Login</div>
                      <div className="font-medium">{new Date(user.lastLoginAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-[#E5E9F0] p-4 space-y-2">
              {isActive ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowSuspendModal(true)}
                  disabled={actionLoading}
                >
                  Suspend Account
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleUnsuspend}
                  disabled={actionLoading}
                >
                  Unsuspend Account
                </Button>
              )}
            </div>
          </Card>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <Card>
              <div className="p-4 border-b border-[#E5E9F0]">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-[#4C566A]">Statistics</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                {[
                  { label: 'Requests', value: stats.serviceRequests ?? '—' },
                  { label: 'Jobs Posted', value: stats.jobPostings ?? '—' },
                  { label: 'Projects', value: stats.projects ?? '—' },
                  { label: 'Reviews Given', value: stats.reviewsGiven ?? '—' },
                  { label: 'Reviews Received', value: stats.reviewsReceived ?? '—' },
                  { label: 'Conversations', value: (stats.conversationsAsP1 ?? 0) + (stats.conversationsAsP2 ?? 0) || '—' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-lg bg-[#F8F9FB] border border-[#E5E9F0]">
                    <div className="text-xs text-[#4C566A] mb-1">{s.label}</div>
                    <div className="text-xl font-semibold">{String(s.value)}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            {user.recent_activity?.length > 0 && (
              <Card>
                <div className="p-4 border-b border-[#E5E9F0]">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-[#4C566A]">Recent Activity</h3>
                </div>
                <div className="divide-y divide-[#E5E9F0]">
                  {user.recent_activity.slice(0, 10).map((a: any, i: number) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium capitalize">{a.type?.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-[#4C566A]">{a.description}</div>
                      </div>
                      <div className="text-xs text-[#4C566A] shrink-0 ml-4">
                        {a.timestamp ? new Date(a.timestamp).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Flags */}
            {user.flags?.length > 0 && (
              <Card>
                <div className="p-4 border-b border-[#E5E9F0] flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-[#4C566A]">Flags ({user.flags.length})</h3>
                </div>
                <div className="divide-y divide-[#E5E9F0]">
                  {user.flags.map((f: any) => (
                    <div key={f.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{f.reason}</div>
                        <div className="text-xs text-[#4C566A]">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}</div>
                      </div>
                      <StatusBadge status={f.status as any} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Ratings */}
            {user.ratings?.length > 0 && (
              <Card>
                <div className="p-4 border-b border-[#E5E9F0] flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-[#4C566A]">Ratings ({user.ratings.length})</h3>
                </div>
                <div className="divide-y divide-[#E5E9F0]">
                  {user.ratings.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))}
                          <span className="ml-1 text-[#4C566A]">{r.rating}</span>
                        </div>
                        <span className="text-xs text-[#4C566A]">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      {r.review_text && <p className="text-sm text-[#4C566A]">{r.review_text}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <ConfirmationModal
          isOpen={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
          onConfirm={handleSuspend}
          title="Suspend Account"
          message={`Are you sure you want to suspend ${fullName}'s account? They will not be able to access the platform.`}
          confirmText="Suspend Account"
        />
      </div>
    </AdminLayout>
  );
}
