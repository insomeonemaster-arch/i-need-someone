import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  Tabs,
  ConfirmationModal,
  Pagination,
} from '../components/ui/AdminComponents';
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { categoriesService, CategoryItem, ZoneItem } from '../../services/admin.service';

export default function CategoriesZones() {
  const [activeTab, setActiveTab] = useState('categories');

  // Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cTotalPages, setCTotalPages] = useState(1);
  const [cPage, setCPage] = useState(1);
  const [cLoading, setCLoading] = useState(true);

  // Zones
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [zTotalPages, setZTotalPages] = useState(1);
  const [zPage, setZPage] = useState(1);
  const [zLoading, setZLoading] = useState(false);

  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'category' | 'zone' } | null>(null);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<CategoryItem | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', module: 'local_services', status: 'active' as 'active' | 'inactive' });

  // Zone modal
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editZone, setEditZone] = useState<ZoneItem | null>(null);
  const [zoneSaving, setZoneSaving] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', city: '', state: '', country: '', radius_km: '', is_active: true });

  const fetchCategories = useCallback(async (page = 1) => {
    setCLoading(true);
    try {
      const res = await categoriesService.getCategories({ page: String(page), per_page: '20' });
      setCategories(res.data);
      setCTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setCLoading(false);
    }
  }, []);

  const fetchZones = useCallback(async (page = 1) => {
    setZLoading(true);
    try {
      const res = await categoriesService.getZones({ page: String(page), per_page: '20' });
      setZones(res.data);
      setZTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load zones');
    } finally {
      setZLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(1); fetchZones(1); }, [fetchCategories, fetchZones]);

  const openCreateCategory = () => {
    setEditCat(null);
    setCatForm({ name: '', description: '', module: 'local_services', status: 'active' });
    setShowCatModal(true);
  };

  const openEditCategory = (cat: CategoryItem) => {
    setEditCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', module: cat.module, status: cat.status });
    setShowCatModal(true);
  };

  const saveCategoryForm = async () => {
    setCatSaving(true);
    try {
      if (editCat) {
        await categoriesService.updateCategory(editCat.id, catForm);
      } else {
        await categoriesService.createCategory(catForm);
      }
      setShowCatModal(false);
      fetchCategories(cPage);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setCatSaving(false);
    }
  };

  const openCreateZone = () => {
    setEditZone(null);
    setZoneForm({ name: '', city: '', state: '', country: '', radius_km: '', is_active: true });
    setShowZoneModal(true);
  };

  const openEditZone = (zone: ZoneItem) => {
    setEditZone(zone);
    setZoneForm({ name: zone.name, city: zone.city || '', state: zone.state || '', country: zone.country || '', radius_km: zone.radius_km ? String(zone.radius_km) : '', is_active: zone.is_active });
    setShowZoneModal(true);
  };

  const saveZoneForm = async () => {
    setZoneSaving(true);
    try {
      const payload = { ...zoneForm, radius_km: zoneForm.radius_km ? Number(zoneForm.radius_km) : undefined };
      if (editZone) {
        await categoriesService.updateZone(editZone.id, payload);
      } else {
        await categoriesService.createZone(payload);
      }
      setShowZoneModal(false);
      fetchZones(zPage);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setZoneSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await categoriesService.deleteCategory(deleteTarget.id);
        fetchCategories(cPage);
      } else {
        await categoriesService.deleteZone(deleteTarget.id);
        fetchZones(zPage);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  const categoryColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Active',
      render: (v: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          v === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {v === 'active' ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: string, row: CategoryItem) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditCategory(row)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ id: row.id, type: 'category' }); setShowDeleteModal(true); }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const zoneColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'region', label: 'Region' },
    { key: 'country', label: 'Country' },
    {
      key: 'is_active',
      label: 'Active',
      render: (v: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          v ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {v ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: string, row: ZoneItem) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditZone(row)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ id: row.id, type: 'zone' }); setShowDeleteModal(true); }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'categories', label: 'Categories' },
    { id: 'zones', label: 'Service Zones' },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Categories & Zones</h1>
            <p className="text-[#4C566A]">Manage service categories and geographic zones</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => activeTab === 'categories' ? openCreateCategory() : openCreateZone()}>
            <Plus className="w-4 h-4 mr-1" />
            Add {activeTab === 'categories' ? 'Category' : 'Zone'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'categories' && (
          <Card className="mt-4">
            {cLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
              </div>
            ) : (
              <>
                <Table columns={categoryColumns} data={categories} />
                <Pagination currentPage={cPage} totalPages={cTotalPages} onPageChange={(p) => { setCPage(p); fetchCategories(p); }} />
              </>
            )}
          </Card>
        )}

        {activeTab === 'zones' && (
          <Card className="mt-4">
            {zLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
              </div>
            ) : (
              <>
                <Table columns={zoneColumns} data={zones} />
                <Pagination currentPage={zPage} totalPages={zTotalPages} onPageChange={(p) => { setZPage(p); fetchZones(p); }} />
              </>
            )}
          </Card>
        )}

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
          onConfirm={confirmDelete}
          title={`Delete ${deleteTarget?.type === 'zone' ? 'Zone' : 'Category'}`}
          message="This action cannot be undone. Are you sure?"
          confirmText="Delete"
        />

        {/* Category Modal */}
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editCat ? 'Edit Category' : 'New Category'}</h2>
                <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={catForm.module} onChange={e => setCatForm(f => ({ ...f, module: e.target.value }))}>
                    <option value="local_services">Local Services</option>
                    <option value="employment">Employment</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={catForm.status} onChange={e => setCatForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setShowCatModal(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={saveCategoryForm} disabled={catSaving || !catForm.name.trim()}>
                  {catSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editCat ? 'Save Changes' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Zone Modal */}
        {showZoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editZone ? 'Edit Zone' : 'New Zone'}</h2>
                <button onClick={() => setShowZoneModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} placeholder="Zone name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={zoneForm.city} onChange={e => setZoneForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={zoneForm.state} onChange={e => setZoneForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={zoneForm.country} onChange={e => setZoneForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={zoneForm.radius_km} onChange={e => setZoneForm(f => ({ ...f, radius_km: e.target.value }))} placeholder="e.g. 50" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="zone-active" checked={zoneForm.is_active} onChange={e => setZoneForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                  <label htmlFor="zone-active" className="text-sm font-medium text-gray-700">Active</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setShowZoneModal(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={saveZoneForm} disabled={zoneSaving || !zoneForm.name.trim()}>
                  {zoneSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editZone ? 'Save Changes' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

