import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../components/AdminLayout';
import {
  KPICard,
  Card,
  Table,
  Button,
  StatusBadge,
} from '../components/ui/AdminComponents';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { dashboardService, DashboardStats, Alert } from '../../services/admin.service';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getAlerts(),
    ])
      .then(([statsRes, alertsRes]) => {
        setStats(statsRes.data);
        setAlerts(alertsRes.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const kpiData = stats
    ? [
        { title: 'Total Users', value: stats.total_users, subtitle: 'Platform users', path: '/users' },
        { title: 'Active Requests', value: stats.active_requests, subtitle: 'Open & in progress', path: '/jobs-requests' },
        { title: 'Active Projects', value: stats.active_projects, subtitle: 'In progress', path: '/projects' },
        { title: 'Active Jobs', value: stats.active_jobs, subtitle: 'Open postings', path: '/employment' },
        { title: 'Total Revenue', value: `$${stats.total_revenue.toLocaleString()}`, subtitle: 'Completed payments', path: '/payments' },
        { title: 'Open Disputes', value: stats.pending_disputes, subtitle: 'Needs attention', path: '/disputes?status=open' },
        { title: 'Pending Flags', value: stats.pending_flags, subtitle: 'Awaiting review', path: '/ratings-flags' },
        { title: 'Pending Approvals', value: stats.pending_approvals, subtitle: 'Provider verifications', path: '/users?role=provider' },
      ]
    : [];

  const alertColumns = [
    { key: 'type', label: 'Type', sortable: false },
    { key: 'message', label: 'Message', sortable: false },
    {
      key: 'severity',
      label: 'Severity',
      sortable: false,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'high'
              ? 'bg-red-50 text-red-700'
              : value === 'medium'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    { key: 'count', label: 'Count', sortable: false },
    {
      key: 'link',
      label: 'Action',
      render: (_: any, row: Alert) => (
        <Button variant="primary" size="sm" onClick={() => navigate(row.link.replace('/admin', ''))}>
          Review
        </Button>
      ),
    },
  ];

  const activityColumns = [
    { key: 'type', label: 'Action', sortable: false },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'user', label: 'User', sortable: false },
    {
      key: 'timestamp',
      label: 'When',
      sortable: false,
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
          <p className="text-[#4C566A]">Operations overview and key metrics</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#5B7CFA]" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {kpiData.map((kpi, index) => (
                <KPICard
                  key={index}
                  title={kpi.title}
                  value={kpi.value}
                  subtitle={kpi.subtitle}
                  onClick={() => navigate(kpi.path)}
                />
              ))}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <Card title="Active Alerts">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#4C566A]">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span>Items requiring immediate attention</span>
                </div>
                <Table columns={alertColumns} data={alerts} />
              </Card>
            )}

            {/* Recent Activity */}
            {stats?.recent_activities && stats.recent_activities.length > 0 && (
              <div className="mt-8">
                <Card title="Recent Activity">
                  <Table columns={activityColumns} data={stats.recent_activities} />
                </Card>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-[#EEF1F5] rounded-lg border border-[#E5E9F0] p-6">
                <h3 className="font-semibold mb-4">Jobs & Requests</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/jobs-requests')}>
                    <ArrowRight className="w-4 h-4 mr-2" />View All Jobs
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/disputes')}>
                    <ArrowRight className="w-4 h-4 mr-2" />Open Disputes
                  </Button>
                </div>
              </div>

              <div className="bg-[#EEF1F5] rounded-lg border border-[#E5E9F0] p-6">
                <h3 className="font-semibold mb-4">Users & Providers</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/users')}>
                    <ArrowRight className="w-4 h-4 mr-2" />All Users
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/users?role=provider')}>
                    <ArrowRight className="w-4 h-4 mr-2" />Providers
                  </Button>
                </div>
              </div>

              <div className="bg-[#EEF1F5] rounded-lg border border-[#E5E9F0] p-6">
                <h3 className="font-semibold mb-4">Financials</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/payments')}>
                    <ArrowRight className="w-4 h-4 mr-2" />Payments & Payouts
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/ratings-flags')}>
                    <ArrowRight className="w-4 h-4 mr-2" />Ratings & Flags
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}