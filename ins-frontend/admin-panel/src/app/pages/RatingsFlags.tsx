import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  StatusBadge,
  Pagination,
  ConfirmationModal,
  Tabs,
} from '../components/ui/AdminComponents';
import { Flag, Star, Loader2 } from 'lucide-react';
import { ratingsFlagsService, RatingItem, FlagItem } from '../../services/admin.service';

export default function RatingsFlags() {
  const [activeTab, setActiveTab] = useState('ratings');

  // --- Ratings state ---
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [rTotalPages, setRTotalPages] = useState(1);
  const [rPage, setRPage] = useState(1);
  const [rLoading, setRLoading] = useState(true);

  // --- Flags state ---
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [fTotalPages, setFTotalPages] = useState(1);
  const [fPage, setFPage] = useState(1);
  const [fLoading, setFLoading] = useState(false);

  const [error, setError] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);

  const fetchRatings = useCallback(async (page = 1) => {
    setRLoading(true);
    try {
      const res = await ratingsFlagsService.getRatings({ page: String(page), per_page: '20' });
      setRatings(res.data);
      setRTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load ratings');
    } finally {
      setRLoading(false);
    }
  }, []);

  const fetchFlags = useCallback(async (page = 1) => {
    setFLoading(true);
    try {
      const res = await ratingsFlagsService.getFlags({ page: String(page), per_page: '20' });
      setFlags(res.data);
      setFTotalPages(res.meta.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load flags');
    } finally {
      setFLoading(false);
    }
  }, []);

  useEffect(() => { fetchRatings(1); fetchFlags(1); }, [fetchRatings, fetchFlags]);

  const handleResolveFlag = async (reason: string) => {
    if (!selectedFlagId) return;
    try {
      await ratingsFlagsService.resolveFlag(selectedFlagId, { resolution: reason || 'dismissed' });
      fetchFlags(fPage);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to resolve flag');
    } finally {
      setSelectedFlagId(null);
    }
  };

  const ratingColumns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'rater',
      label: 'Reviewer',
      render: (v: RatingItem['rater']) => v?.name || '—',
    },
    {
      key: 'rated_user',
      label: 'Reviewee',
      render: (v: RatingItem['rated_user']) => v?.name || '—',
    },
    {
      key: 'rating',
      label: 'Score',
      sortable: true,
      render: (v: number) => (
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          {v}
        </span>
      ),
    },
    { key: 'entity_type', label: 'Entity', sortable: true },
    {
      key: 'admin_reviewed',
      label: 'Status',
      render: (_v: boolean, row: RatingItem) => {
        const status = row.flagged && !row.admin_reviewed ? 'flagged' : row.admin_reviewed ? 'reviewed' : 'active';
        return <StatusBadge status={status} />;
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Action',
      render: (_: string, row: RatingItem) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={async (e: React.MouseEvent) => {
            e.stopPropagation();
            try {
              await ratingsFlagsService.updateRating(row.id, { hidden: true });
              fetchRatings(rPage);
            } catch (e: unknown) {
              alert(e instanceof Error ? e.message : 'Failed');
            }
          }}
        >
          Hide
        </Button>
      ),
    },
  ];

  const flagColumns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'flagger',
      label: 'Reporter',
      render: (v: FlagItem['flagger']) => v?.name || '—',
    },
    {
      key: 'flagged_entity_type',
      label: 'Type',
      sortable: true,
      render: (v: string) => (
        <span className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-500" />
          {v || '—'}
        </span>
      ),
    },
    { key: 'reason', label: 'Reason', sortable: false },
    {
      key: 'status',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v as any} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Action',
      render: (_: string, row: FlagItem) =>
        row.status === 'pending' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setSelectedFlagId(row.id); setShowResolveModal(true); }}
          >
            Resolve
          </Button>
        ) : null,
    },
  ];

  const tabs = [
    { id: 'ratings', label: 'Ratings' },
    { id: 'flags', label: 'Flags' },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Ratings & Flags</h1>
          <p className="text-[#4C566A]">Review user ratings and content flags</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'ratings' && (
          <Card className="mt-4">
            {rLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
              </div>
            ) : (
              <>
                <Table columns={ratingColumns} data={ratings} />
                <Pagination currentPage={rPage} totalPages={rTotalPages} onPageChange={(p) => { setRPage(p); fetchRatings(p); }} />
              </>
            )}
          </Card>
        )}

        {activeTab === 'flags' && (
          <Card className="mt-4">
            {fLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-[#5B7CFA]" />
              </div>
            ) : (
              <>
                <Table columns={flagColumns} data={flags} />
                <Pagination currentPage={fPage} totalPages={fTotalPages} onPageChange={(p) => { setFPage(p); fetchFlags(p); }} />
              </>
            )}
          </Card>
        )}

        <ConfirmationModal
          isOpen={showResolveModal}
          onClose={() => { setShowResolveModal(false); setSelectedFlagId(null); }}
          onConfirm={handleResolveFlag}
          title="Resolve Flag"
          message="Dismiss this content flag? This action cannot be undone."
          confirmText="Resolve"
        />
      </div>
    </AdminLayout>
  );
}
