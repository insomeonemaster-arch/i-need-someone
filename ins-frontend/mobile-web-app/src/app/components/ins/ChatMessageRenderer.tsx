import { useNavigate } from 'react-router';
import { CheckCircle, Edit2, ExternalLink, TrendingUp, XCircle, Ban, Eye } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { DataPayload, UpdateResult, ActionResult } from '@/services/ins.service';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  active: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  filled: 'bg-green-100 text-green-700',
  accepted: 'bg-green-100 text-green-700',
  hired: 'bg-green-100 text-green-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-600',
  on_hold: 'bg-gray-100 text-gray-600',
  withdrawn: 'bg-gray-100 text-gray-600',
};

const ENTITY_BASE_ROUTES: Record<string, string> = {
  service_request: '/my-requests',
  job: '/my-jobs',
  project: '/my-projects',
};

interface ItemCardProps {
  item: Record<string, any>;
  entityType: 'service_request' | 'job' | 'project';
  onEdit: (entityType: string, entityId: string, entityTitle: string) => void;
  onAction: (message: string) => void;
}

function ItemCard({ item, entityType, onEdit, onAction }: ItemCardProps) {
  const navigate = useNavigate();
  const statusColor = STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600';
  const baseRoute = ENTITY_BASE_ROUTES[entityType] || '/my-requests';

  const metaParts = [
    item.category?.name,
    item.city && item.state ? `${item.city}, ${item.state}` : null,
    item.employmentType ? item.employmentType.replace(/_/g, ' ') : null,
    item.workLocation ? item.workLocation.replace(/_/g, ' ') : null,
    item.deadline ? `Due ${new Date(item.deadline).toLocaleDateString()}` : null,
  ].filter(Boolean) as string[];

  const budgetParts = [item.budgetMin ?? item.salaryMin, item.budgetMax ?? item.salaryMax];
  const budgetDisplay = budgetParts[0] && budgetParts[1]
    ? `$${budgetParts[0]}–$${budgetParts[1]}`
    : budgetParts[0]
    ? `From $${budgetParts[0]}`
    : budgetParts[1]
    ? `Up to $${budgetParts[1]}`
    : null;

  const isEditable = item.status === 'open' || item.status === 'active';
  const isCancellable = item.status !== 'completed' && item.status !== 'cancelled' && item.status !== 'closed';

  const cancelLabel = entityType === 'job' ? 'Close' : 'Cancel';
  const cancelAction = entityType === 'job'
    ? `Close my job posting (ID: ${item.id})`
    : entityType === 'project'
    ? `Cancel my project (ID: ${item.id})`
    : `Cancel my service request (ID: ${item.id})`;

  const subItemLabel = entityType === 'service_request' ? 'View Quotes'
    : entityType === 'job' ? 'View Applications'
    : entityType === 'project' ? 'View Proposals'
    : null;

  const subItemAction = entityType === 'service_request'
    ? `Show me quotes for my service request (ID: ${item.id})`
    : entityType === 'job'
    ? `Show me applications for my job posting (ID: ${item.id})`
    : `Show me proposals for my project (ID: ${item.id})`;

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-snug flex-1 min-w-0 truncate">{item.title}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 capitalize ${statusColor}`}>
          {(item.status || '').replace(/_/g, ' ')}
        </span>
      </div>

      {(metaParts.length > 0 || budgetDisplay) && (
        <p className="text-xs text-gray-500 truncate">
          {[...metaParts.slice(0, 2), budgetDisplay].filter(Boolean).join(' · ')}
        </p>
      )}

      <p className="text-xs text-gray-400">
        {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-3"
          onClick={() => navigate(`${baseRoute}/${item.id}`)}
        >
          <ExternalLink className="size-3 mr-1" />
          View
        </Button>
        {isEditable && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={() => onEdit(entityType, item.id, item.title)}
          >
            <Edit2 className="size-3 mr-1" />
            Edit
          </Button>
        )}
        {subItemLabel && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={() => onAction(subItemAction)}
          >
            <Eye className="size-3 mr-1" />
            {subItemLabel}
          </Button>
        )}
        {isCancellable && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onAction(cancelAction)}
          >
            <Ban className="size-3 mr-1" />
            {cancelLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Quote Card ---
function QuoteCard({ item, onAction }: { item: Record<string, any>; onAction: (msg: string) => void }) {
  const providerName = item.provider?.user
    ? `${item.provider.user.firstName} ${item.provider.user.lastName}`
    : 'Provider';
  const isPending = item.status === 'pending';

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{providerName}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
          {item.status}
        </span>
      </div>
      <p className="text-sm font-bold text-green-700">${Number(item.price).toFixed(2)}</p>
      {item.message && <p className="text-xs text-gray-600 line-clamp-2">{item.message}</p>}
      {item.estimatedHours && <p className="text-xs text-gray-500">Est. {Number(item.estimatedHours)}h</p>}
      <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
      {isPending && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onAction(`Accept quote (ID: ${item.id})`)}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onAction(`Reject quote (ID: ${item.id})`)}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Application Card ---
function ApplicationCard({ item, onAction }: { item: Record<string, any>; onAction: (msg: string) => void }) {
  const name = item.applicant
    ? `${item.applicant.firstName} ${item.applicant.lastName}`
    : 'Applicant';
  const isActionable = item.status === 'pending' || item.status === 'reviewing';

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{name}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
          {item.status}
        </span>
      </div>
      {item.expectedSalary && <p className="text-xs text-gray-600">Expected: ${Number(item.expectedSalary).toLocaleString()}/yr</p>}
      {item.coverLetter && <p className="text-xs text-gray-500 line-clamp-2">{item.coverLetter}</p>}
      <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
      {isActionable && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs px-3 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => onAction(`Shortlist application (ID: ${item.id})`)}>
            Shortlist
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onAction(`Reject application (ID: ${item.id})`)}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Proposal Card ---
function ProposalCard({ item, onAction }: { item: Record<string, any>; onAction: (msg: string) => void }) {
  const providerName = item.provider?.user
    ? `${item.provider.user.firstName} ${item.provider.user.lastName}`
    : 'Provider';
  const isPending = item.status === 'pending';

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{providerName}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
          {item.status}
        </span>
      </div>
      <p className="text-sm font-bold text-green-700">${Number(item.proposedPrice).toFixed(2)}</p>
      {item.estimatedDuration && <p className="text-xs text-gray-500">Duration: {item.estimatedDuration}</p>}
      {item.coverLetter && <p className="text-xs text-gray-600 line-clamp-2">{item.coverLetter}</p>}
      <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
      {isPending && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onAction(`Accept proposal (ID: ${item.id})`)}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onAction(`Reject proposal (ID: ${item.id})`)}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Transaction Card (read-only) ---
function TransactionCard({ item }: { item: Record<string, any> }) {
  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm capitalize">{(item.contextType || 'payment').replace(/_/g, ' ')}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
          {item.status}
        </span>
      </div>
      <p className="text-sm font-bold">${Number(item.amount).toFixed(2)} {item.currency}</p>
      {Number(item.providerEarnings) > 0 && (
        <p className="text-xs text-green-600">Earnings: ${Number(item.providerEarnings).toFixed(2)}</p>
      )}
      <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
    </div>
  );
}

interface Props {
  role: 'ins' | 'user';
  content: string;
  quickReplies?: string[];
  dataPayload?: DataPayload | null;
  updateResult?: UpdateResult | null;
  actionResult?: ActionResult | null;
  onQuickReply: (label: string) => void;
  onEditEntity: (entityType: string, entityId: string, entityTitle: string) => void;
}

export default function ChatMessageRenderer({
  role,
  content,
  quickReplies,
  dataPayload,
  updateResult,
  actionResult,
  onQuickReply,
  onEditEntity,
}: Props) {
  const isUser = role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2`}>
      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--brand-orange)] text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        {content}
      </div>

      {/* Data list */}
      {dataPayload?.type === 'list' && (
        <div className="w-full max-w-[92%] space-y-2">
          {dataPayload.total > 0 && dataPayload.totalPages > 1 && (
            <p className="text-xs text-gray-500 pl-1">
              Page {dataPayload.page} of {dataPayload.totalPages} &middot; {dataPayload.total} total
            </p>
          )}
          {dataPayload.items.length === 0 ? (
            <p className="text-xs text-gray-500 pl-1">No items found.</p>
          ) : (
            <>
              {dataPayload.items.map((item: Record<string, any>) => {
                const et = dataPayload.entityType;
                if (et === 'quote') return <QuoteCard key={item.id} item={item} onAction={onQuickReply} />;
                if (et === 'application') return <ApplicationCard key={item.id} item={item} onAction={onQuickReply} />;
                if (et === 'proposal') return <ProposalCard key={item.id} item={item} onAction={onQuickReply} />;
                if (et === 'transaction') return <TransactionCard key={item.id} item={item} />;
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    entityType={et as 'service_request' | 'job' | 'project'}
                    onEdit={onEditEntity}
                    onAction={onQuickReply}
                  />
                );
              })}
              {dataPayload.hasMore && (
                <button
                  onClick={() => onQuickReply('Show more')}
                  className="text-xs text-[var(--brand-orange)] hover:underline pl-1 mt-1"
                >
                  Show more &rarr;
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Earnings stats card */}
      {dataPayload?.type === 'stats' && (
        <div className="w-full max-w-[92%] border rounded-xl p-4 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-[var(--brand-orange)]" />
            <span className="text-sm font-semibold">Earnings Overview</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-bold">${dataPayload.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-base font-bold">${dataPayload.thisMonthEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
            <div>
              <p className="text-base font-bold">${dataPayload.pendingPayouts.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Update success indicator */}
      {updateResult && (
        <div className="max-w-[92%] flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">
          <CheckCircle className="size-4 shrink-0" />
          <span className="capitalize">{updateResult.entityType.replace(/_/g, ' ')} updated successfully.</span>
        </div>
      )}

      {/* Action result indicator */}
      {actionResult && actionResult.success && (
        <div className="max-w-[92%] flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">
          <CheckCircle className="size-4 shrink-0" />
          <span className="capitalize">{(actionResult.action || '').replace(/_/g, ' ')} completed.</span>
        </div>
      )}
      {actionResult && actionResult.error && (
        <div className="max-w-[92%] flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700">
          <XCircle className="size-4 shrink-0" />
          <span>{actionResult.error}</span>
        </div>
      )}

      {/* Quick reply pills */}
      {!isUser && quickReplies && quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 max-w-[92%]">
          {quickReplies.map((label) => (
            <button
              key={label}
              onClick={() => onQuickReply(label)}
              className="px-3 py-1.5 rounded-full border border-gray-300 text-xs hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] transition-colors min-h-[32px]"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
