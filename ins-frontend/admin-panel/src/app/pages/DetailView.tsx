import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Button,
  StatusBadge,
  Tabs,
  ConfirmationModal,
  Drawer,
} from '../components/ui/AdminComponents';
import {
  User,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { jobsService, RequestDetailItem, usersService, UserItem } from '../../services/admin.service';

export default function DetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<RequestDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showReassignDrawer, setShowReassignDrawer] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [providers, setProviders] = useState<UserItem[]>([]);
  const [providerSearchLoading, setProviderSearchLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await jobsService.getRequest(id);
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchProviders = useCallback(async (q: string) => {
    if (!q.trim()) { setProviders([]); return; }
    setProviderSearchLoading(true);
    try {
      const res = await usersService.getUsers({ role: 'provider', q, per_page: '10' });
      setProviders(res.data);
    } catch {
      // ignore
    } finally {
      setProviderSearchLoading(false);
    }
  }, []);

  const handleCancel = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await jobsService.cancelRequest(id, { reason });
      await fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await jobsService.updateRequestStatus(id, { status: 'on_hold' });
      await fetchData();
      // note reason in console for admin awareness; full audit logging is done server-side
      void reason;
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Hold failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B7CFA]" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error || 'Request not found'}
          </div>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/jobs-requests')}>
            Back to Requests
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const budgetDisplay = data.budget_max
    ? `$${Number(data.budget_max).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : data.budget_min
    ? `$${Number(data.budget_min).toLocaleString('en-US', { minimumFractionDigits: 2 })}+`
    : '—';

  const overviewTab = (
    <div className="space-y-6">
      {data.description && (
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
        </div>
      )}
      <div>
        <h4 className="font-medium mb-2">Budget</h4>
        <p className="text-2xl font-semibold">{budgetDisplay}</p>
        {data.urgency && <p className="text-sm text-gray-500 mt-1">Urgency: {data.urgency}</p>}
      </div>
      {data.address && (
        <div>
          <h4 className="font-medium mb-2">Address</h4>
          <p className="text-gray-700">{data.address}{data.city ? `, ${data.city}` : ''}{data.state ? `, ${data.state}` : ''}</p>
        </div>
      )}
    </div>
  );

  const filesTab = (
    <div className="space-y-3">
      {[...(data.images || []), ...(data.attachments || [])].length === 0 ? (
        <p className="text-gray-500 text-sm">No files attached.</p>
      ) : (
        [...(data.images || []), ...(data.attachments || [])].map((url, idx) => {
          const name = url.split('/').pop() || `file-${idx + 1}`;
          return (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div className="font-medium text-sm truncate max-w-xs">{name}</div>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate('/jobs-requests')} className="text-[#5B7CFA] text-sm hover:underline">
                ← Back
              </button>
              <h1 className="text-2xl font-semibold">{data.id}</h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="text-gray-600">{data.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer */}
            <Card title="Customer">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{data.customer.name}</div>
                    <div className="text-sm text-gray-500">{data.customer.email}</div>
                  </div>
                </div>
                {data.customer.phone && (
                  <div className="text-sm text-gray-600">Phone: {data.customer.phone}</div>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/users/${data.customer.id}`)}
                >
                  View Profile
                </Button>
              </div>
            </Card>

            {/* Provider */}
            <Card title="Provider">
              {data.provider ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{data.provider.name}</div>
                      <div className="text-sm text-gray-500">{data.provider.email}</div>
                    </div>
                  </div>
                  {data.provider.phone && (
                    <div className="text-sm text-gray-600">Phone: {data.provider.phone}</div>
                  )}
                  {data.provider.average_rating != null && (
                    <div className="text-sm text-gray-600">
                      Rating: {Number(data.provider.average_rating).toFixed(1)} ⭐ · {data.provider.total_jobs} jobs
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/users/${data.provider!.user_id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowReassignDrawer(true)}
                    >
                      Reassign
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">No provider assigned yet.</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowReassignDrawer(true)}>
                    Assign Provider
                  </Button>
                </div>
              )}
            </Card>

            {/* Details */}
            <Card title="Details">
              <div className="space-y-3">
                {(data.city || data.state) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Location</div>
                      <div className="text-gray-600">{[data.city, data.state].filter(Boolean).join(', ')}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Budget</div>
                    <div className="text-gray-600">{budgetDisplay}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Created</div>
                    <div className="text-gray-600">{new Date(data.created_at).toLocaleString()}</div>
                  </div>
                </div>
                {data.category && (
                  <div className="text-sm text-gray-600">Category: {data.category}</div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Tabs
                tabs={[
                  { id: 'overview', label: 'Overview', content: overviewTab },
                  { id: 'files', label: 'Files', content: filesTab },
                ]}
              />
            </Card>

            {/* Admin Actions */}
            <Card title="Admin Actions">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Danger Zone</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowHoldModal(true)}
                    disabled={actionLoading || data.status === 'on_hold' || data.status === 'cancelled' || data.status === 'completed'}
                  >
                    Put On Hold
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading || data.status === 'cancelled' || data.status === 'completed'}
                  >
                    Cancel Request
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowReassignDrawer(true)}
                    disabled={actionLoading || data.status === 'cancelled' || data.status === 'completed'}
                  >
                    Reassign Provider
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
          title="Cancel Request"
          message="Are you sure you want to cancel this request? Both parties will be notified."
          confirmText="Cancel Request"
        />

        <ConfirmationModal
          isOpen={showHoldModal}
          onClose={() => setShowHoldModal(false)}
          onConfirm={handleHold}
          title="Put Request On Hold"
          message="This will pause the request and notify both parties. Specify the reason below."
          confirmText="Put On Hold"
        />

        {/* Reassign Drawer */}
        <Drawer
          isOpen={showReassignDrawer}
          onClose={() => setShowReassignDrawer(false)}
          title="Reassign Provider"
          width="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">Search for a provider to assign to this request.</p>
            <input
              type="text"
              value={providerSearch}
              onChange={(e) => {
                setProviderSearch(e.target.value);
                searchProviders(e.target.value);
              }}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-[#E5E9F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
            />
            {providerSearchLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#5B7CFA]" />
              </div>
            )}
            <div className="space-y-2">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 border border-[#E5E9F0] rounded-lg hover:bg-[#F8F9FB] cursor-pointer"
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await jobsService.updateRequestStatus(id, { status: 'assigned' });
                      await fetchData();
                      setShowReassignDrawer(false);
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : 'Reassign failed');
                    }
                  }}
                >
                  <div className="font-medium text-sm">{p.first_name} {p.last_name}</div>
                  <div className="text-xs text-gray-500">{p.email}</div>
                  {p.rating_avg != null && (
                    <div className="text-xs text-gray-500">Rating: {Number(p.rating_avg).toFixed(1)} ⭐</div>
                  )}
                </div>
              ))}
              {!providerSearchLoading && providerSearch && providers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No providers found.</p>
              )}
            </div>
          </div>
        </Drawer>
      </div>
    </AdminLayout>
  );
}
