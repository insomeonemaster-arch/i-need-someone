import React, { useState, useMemo, ReactNode } from 'react';
import {
  X,
  Mic,
  Send,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';

// KPI Card
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export function KPICard({ title, value, subtitle, trend, onClick }: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#EEF1F5] rounded-lg border border-[#E5E9F0] p-6 ${
        onClick ? 'cursor-pointer hover:border-[#5B7CFA] hover:shadow-sm transition-all' : ''
      }`}
    >
      <div className="text-sm text-[#4C566A] mb-1">{title}</div>
      <div className="text-3xl font-semibold mb-1">{value}</div>
      {subtitle && <div className="text-sm text-[#4C566A]">{subtitle}</div>}
    </div>
  );
}

// Standard Card
interface CardProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, children, actions }: CardProps) {
  return (
    <div className="bg-[#EEF1F5] rounded-lg border border-[#E5E9F0]">
      {title && (
        <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

// Status Badge
interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styleMap: Record<string, { bg: string; text: string; border: string }> = {
    // Title Case legacy values
    New: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    Searching: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#F59E0B]/20' },
    Active: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    Completed: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    'On Hold': { bg: 'bg-[#FED7AA]', text: 'text-[#9A3412]', border: 'border-[#F97316]/20' },
    Cancelled: { bg: 'bg-[#FECACA]', text: 'text-[#E57373]', border: 'border-[#E57373]/20' },
    'Pending Approval': { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    Failed: { bg: 'bg-[#FECACA]', text: 'text-[#E57373]', border: 'border-[#E57373]/20' },
    Refunded: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    Authorized: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    Captured: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    Paid: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    Open: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    Resolved: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    Reviewed: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    Local: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    Employment: { bg: 'bg-[#CCEDEA]', text: 'text-[#4C9F9F]', border: 'border-[#4C9F9F]/20' },
    Project: { bg: 'bg-[#E0E7FF]', text: 'text-[#6366F1]', border: 'border-[#6366F1]/20' },
    // Lowercase / underscore variants (backend enum values)
    active: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    inactive: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    suspended: { bg: 'bg-[#FECACA]', text: 'text-[#E57373]', border: 'border-[#E57373]/20' },
    pending: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    open: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    completed: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    cancelled: { bg: 'bg-[#FECACA]', text: 'text-[#E57373]', border: 'border-[#E57373]/20' },
    in_progress: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    on_hold: { bg: 'bg-[#FED7AA]', text: 'text-[#9A3412]', border: 'border-[#F97316]/20' },
    resolved: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    closed: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    rejected: { bg: 'bg-[#FECACA]', text: 'text-[#E57373]', border: 'border-[#E57373]/20' },
    approved: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    dismissed: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    flagged: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#F59E0B]/20' },
    under_review: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#F59E0B]/20' },
    draft: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    failed: { bg: 'bg-[#FECACA]', text: 'text-[#E57373]', border: 'border-[#E57373]/20' },
    refunded: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    processing: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#F59E0B]/20' },
    hired: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    filled: { bg: 'bg-[#E5E9F0]', text: 'text-[#2E3440]', border: 'border-[#E5E9F0]' },
    assigned: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    local: { bg: 'bg-[#DEE6FC]', text: 'text-[#5B7CFA]', border: 'border-[#5B7CFA]/20' },
    employment: { bg: 'bg-[#CCEDEA]', text: 'text-[#4C9F9F]', border: 'border-[#4C9F9F]/20' },
    project: { bg: 'bg-[#E0E7FF]', text: 'text-[#6366F1]', border: 'border-[#6366F1]/20' },
    verified: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#10B981]/20' },
    unverified: { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#F59E0B]/20' },
  };

  const style = styleMap[status] ?? styleMap.New;
  const display = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      {display}
    </span>
  );
}

// Button Components
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[#5B7CFA] text-white hover:bg-[#4A6BE8]',
    secondary: 'bg-[#EEF1F5] text-[#2E3440] border border-[#E5E9F0] hover:bg-[#E5E9F0]',
    ghost: 'bg-transparent text-[#2E3440] hover:bg-[#E5E9F0]',
    destructive: 'bg-[#E57373] text-white hover:bg-[#D86868]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

// Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  requireReason?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  requireReason = true,
}: ConfirmationModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-lg">
        <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#E5E9F0] rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[#2E3440] mb-4">{message}</p>

          {requireReason && (
            <div>
              <label className="block text-sm font-medium text-[#2E3440] mb-2">
                Reason (required)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E9F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 bg-white"
                rows={3}
                placeholder="Enter reason for this action..."
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E5E9F0] flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={requireReason && !reason.trim()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Drawer Panel
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export function Drawer({ isOpen, onClose, title, children, width = 'md' }: DrawerProps) {
  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
      <div
        className={`absolute right-0 top-0 h-full bg-white shadow-xl ${widthStyles[width]} w-full flex flex-col`}
      >
        <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#E5E9F0] rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// Tabs Component
interface Tab {
  id: string;
  label: string;
  content?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, activeTab: externalTab, onTabChange }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id);
  const activeTab = externalTab !== undefined ? externalTab : internalTab;

  const handleTabChange = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    } else {
      setInternalTab(id);
    }
  };

  return (
    <div>
      <div className="border-b border-[#E5E9F0]">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#5B7CFA] text-[#5B7CFA]'
                  : 'border-transparent text-[#4C566A] hover:text-[#2E3440]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

// INS Assist Input
interface INSAssistInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  showMic?: boolean;
}

export function INSAssistInput({
  placeholder = 'Type a message...',
  onSend,
  showMic = true,
}: INSAssistInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-[#E5E9F0] rounded-lg border border-[#E5E9F0]">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm"
      />
      {showMic && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#4C9F9F] font-medium">INS</span>
          <button className="p-1.5 hover:bg-[#D8DEE9] rounded transition-colors">
            <Mic className="w-4 h-4 text-[#4C9F9F]" />
          </button>
        </div>
      )}
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="p-1.5 bg-[#5B7CFA] text-white rounded hover:bg-[#4A6BE8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

// Table Component
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  selectable?: boolean;
}

export function Table({ columns, data, onRowClick, selectable = false }: TableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const av = a[sortColumn];
      const bv = b[sortColumn];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#E5E9F0] border-y border-[#E5E9F0]">
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={toggleAllRows}
                  className="rounded border-[#E5E9F0]"
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left">
                <button
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={`flex items-center gap-2 text-sm font-medium text-[#2E3440] ${
                    column.sortable ? 'hover:text-[#5B7CFA]' : ''
                  }`}
                >
                  {column.label}
                  {column.sortable && sortColumn === column.key && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#E5E9F0]">
          {sortedData.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(row)}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-[#F8F9FB]' : ''
              } transition-colors`}
            >
              {selectable && (
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => toggleRowSelection(index)}
                    className="rounded border-[#E5E9F0]"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm text-[#2E3440]">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-[#4C566A]">
          <p>No data available</p>
        </div>
      )}
    </div>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="font-medium text-[#2E3440] mb-2">{title}</h3>
      <p className="text-[#4C566A] mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

// Loading State
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-[#5B7CFA] animate-spin" />
    </div>
  );
}

// Filter Bar
interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterOption[];
  onFilterChange?: (filters: Record<string, string>) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (!value) delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <select
            value={activeFilters[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="appearance-none px-3 py-2 pr-8 border border-[#E5E9F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 bg-white"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#4C566A] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

// Pagination
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E9F0]">
      <div className="text-sm text-[#2E3440]">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
