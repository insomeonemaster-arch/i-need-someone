import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  Tabs,
} from '../components/ui/AdminComponents';
import { Plus, Shield, X, Loader2 } from 'lucide-react';
import { rolesService, AdminRole, AdminUserEntry, RoleStats, usersService } from '../../services/admin.service';

export default function RolesPermissions() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserEntry[]>([]);
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<AdminRole | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });

  // Permission matrix controlled state
  const [permChanges, setPermChanges] = useState<Record<string, string[]>>({});
  const [permSaving, setPermSaving] = useState(false);

  // Assign user modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignSearchResult, setAssignSearchResult] = useState<{ id: string; name: string; email: string } | null>(null);
  const [assignSearching, setAssignSearching] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);

  const AVAILABLE_PERMISSIONS = [
    'manage_users', 'manage_providers', 'manage_jobs', 'manage_projects',
    'manage_disputes', 'manage_payments', 'manage_settings', 'view_reports',
    'manage_categories', 'manage_roles', 'view_audit_logs', 'manage_content',
  ];

  useEffect(() => {
    Promise.all([
      rolesService.getRoles(),
      rolesService.getAdminUsers(),
      rolesService.getStats(),
    ]).then(([rolesRes, usersRes, statsRes]) => {
      setRoles(rolesRes.data ?? []);
      setAdminUsers(usersRes.data ?? []);
      setStats(statsRes.data ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const openCreateRole = () => {
    setEditRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowRoleModal(true);
  };

  const openEditRole = (role: AdminRole) => {
    setEditRole(role);
    setRoleForm({ name: role.name, description: role.description || '', permissions: [...role.permissions] });
    setShowRoleModal(true);
  };

  const saveRoleForm = async () => {
    setRoleSaving(true);
    try {
      if (editRole) {
        const res = await rolesService.updateRole(editRole.id, roleForm);
        setRoles(prev => prev.map(r => r.id === editRole.id ? res.data : r));
      } else {
        const res = await rolesService.createRole(roleForm);
        setRoles(prev => [...prev, res.data]);
      }
      setShowRoleModal(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setRoleSaving(false);
    }
  };

  const getPermissions = (role: AdminRole) =>
    permChanges[role.id] !== undefined ? permChanges[role.id] : role.permissions;

  const togglePermission = (roleId: string, basePerm: string[], perm: string, checked: boolean) => {
    const current = permChanges[roleId] !== undefined ? permChanges[roleId] : basePerm;
    const updated = checked ? [...current, perm] : current.filter(p => p !== perm);
    setPermChanges(prev => ({ ...prev, [roleId]: updated }));
  };

  const savePermissions = async () => {
    setPermSaving(true);
    try {
      await Promise.all(
        Object.entries(permChanges).map(([roleId, permissions]) =>
          rolesService.updateRole(roleId, { permissions })
        )
      );
      setRoles(prev => prev.map(r =>
        permChanges[r.id] !== undefined ? { ...r, permissions: permChanges[r.id], permissionCount: permChanges[r.id].length } : r
      ));
      setPermChanges({});
      alert('Permissions saved.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save permissions');
    } finally {
      setPermSaving(false);
    }
  };

  const searchUserByEmail = async () => {
    if (!assignEmail.trim()) return;
    setAssignSearching(true);
    setAssignSearchResult(null);
    try {
      const res = await usersService.getUsers({ q: assignEmail, per_page: '1' });
      const user = res.data?.[0];
      if (user) {
        setAssignSearchResult({ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email });
      } else {
        alert('No user found with that email.');
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setAssignSearching(false);
    }
  };

  const assignUserRole = async () => {
    if (!assignSearchResult || !assignRoleId) return;
    setAssignSaving(true);
    try {
      await rolesService.assignRole(assignSearchResult.id, assignRoleId);
      setShowAssignModal(false);
      setAssignEmail('');
      setAssignRoleId('');
      setAssignSearchResult(null);
      // Re-fetch admin users
      const usersRes = await rolesService.getAdminUsers();
      setAdminUsers(usersRes.data ?? []);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to assign role');
    } finally {
      setAssignSaving(false);
    }
  };

  const roleColumns = [
    { key: 'id', label: 'Role ID', sortable: true, render: (v: string) => v.substring(0, 8).toUpperCase() },
    { key: 'name', label: 'Role Name', sortable: true },
    { key: 'users', label: 'Users', sortable: true },
    { key: 'permissionCount', label: 'Permissions', sortable: true, render: (v: number) => `${v} permissions` },
    {
      key: 'createdAt', label: 'Created', sortable: true,
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      key: 'action',
      label: 'Action',
      render: (_: unknown, row: AdminRole) => (
        <Button variant="primary" size="sm" onClick={() => openEditRole(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const userColumns = [
    { key: 'userId', label: 'ID', sortable: true, render: (v: string) => v.substring(0, 8).toUpperCase() },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'lastLogin', label: 'Last Login', sortable: true,
      render: (v: string | null) => v ? new Date(v).toLocaleString() : 'Never',
    },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'action',
      label: 'Action',
      render: (_: unknown, row: AdminUserEntry) => (
        <Button variant="ghost" size="sm" onClick={() => { setAssignEmail(row.email); setAssignRoleId(row.roleId); setAssignSearchResult({ id: row.userId, name: row.name, email: row.email }); setShowAssignModal(true); }}>
          Change Role
        </Button>
      ),
    },
  ];

  const rolesTab = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Define roles and their permission levels
        </div>
        <Button variant="primary" onClick={openCreateRole}>
          <Plus className="w-4 h-4 mr-2" />
          New Role
        </Button>
      </div>
      <Table columns={roleColumns} data={roles} />
    </div>
  );

  const permissionsTab = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Permission Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Permission</th>
                {roles.map(role => (
                  <th key={role.id} className="px-4 py-3 text-center font-medium text-gray-700">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <tr key={perm}>
                  <td className="px-4 py-3 capitalize">{perm.replace(/_/g, ' ')}</td>
                  {roles.map(role => (
                    <td key={role.id} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={getPermissions(role).includes(perm)}
                        onChange={e => togglePermission(role.id, role.permissions, perm, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Button variant="primary" onClick={savePermissions} disabled={permSaving || Object.keys(permChanges).length === 0}>
        {permSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save Permissions
      </Button>
    </div>
  );

  const adminUsersTab = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Manage admin users and their role assignments
        </div>
        <Button variant="primary" onClick={() => { setAssignEmail(''); setAssignRoleId(''); setAssignSearchResult(null); setShowAssignModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Admin User
        </Button>
      </div>
      <Table columns={userColumns} data={adminUsers} />
    </div>
  );

  const lastModifiedDate = stats?.lastModified ? new Date(stats.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <>
    <AdminLayout>
      <div className="p-6">
        // Header
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
          </div>
          <p className="text-gray-600">
            Role-based access control (RBAC) configuration
          </p>
        </div>

        // Stats
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Roles</div>
            <div className="text-2xl font-semibold">{loading ? '—' : stats?.totalRoles ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">Configured</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Admin Users</div>
            <div className="text-2xl font-semibold">{loading ? '—' : stats?.adminUsers ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">Active</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Last Modified</div>
            <div className="text-2xl font-semibold">{loading ? '—' : lastModifiedDate}</div>
            <div className="text-sm text-gray-500 mt-1">Role updated</div>
          </div>
        </div>

        // RBAC Configuration
        <Card>
          <Tabs
            tabs={[
              { id: 'roles', label: 'Roles', content: rolesTab },
              { id: 'permissions', label: 'Permission Matrix', content: permissionsTab },
              { id: 'users', label: 'Admin Users', content: adminUsersTab },
            ]}
          />
        </Card>
      </div>
    </AdminLayout>

    // Role Create/Edit Modal
    {showRoleModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editRole ? 'Edit Role' : 'New Role'}</h2>
            <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} placeholder="Role name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={roleForm.permissions.includes(perm)}
                      onChange={e => setRoleForm(f => ({
                        ...f,
                        permissions: e.target.checked ? [...f.permissions, perm] : f.permissions.filter(p => p !== perm)
                      }))}
                    />
                    <span className="capitalize">{perm.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={saveRoleForm} disabled={roleSaving || !roleForm.name.trim()}>
              {roleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editRole ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    )}

    // Assign User Modal
    {showAssignModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Assign Admin Role</h2>
            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search user by email</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={assignEmail}
                  onChange={e => setAssignEmail(e.target.value)}
                  placeholder="user@example.com"
                  onKeyDown={e => e.key === 'Enter' && searchUserByEmail()}
                />
                <Button variant="secondary" size="sm" onClick={searchUserByEmail} disabled={assignSearching}>
                  {assignSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                </Button>
              </div>
            </div>
            {assignSearchResult && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <p className="font-medium">{assignSearchResult.name}</p>
                <p className="text-gray-500">{assignSearchResult.email}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role *</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={assignRoleId}
                onChange={e => setAssignRoleId(e.target.value)}
              >
                <option value="">Select a role...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={assignUserRole} disabled={assignSaving || !assignSearchResult || !assignRoleId}>
              {assignSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
