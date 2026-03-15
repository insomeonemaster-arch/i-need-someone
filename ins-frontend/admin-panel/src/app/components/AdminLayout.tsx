import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Users,
  UserCheck,
  CreditCard,
  Flag,
  AlertTriangle,
  MessageSquare,
  Bot,
  FolderTree,
  Shield,
  FileText,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

import { useAuth } from '../../context/AuthContext';

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Jobs & Requests', path: '/jobs-requests' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: Users, label: 'Employment', path: '/employment' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: UserCheck, label: 'Providers', path: '/users?role=provider' },
    { icon: CreditCard, label: 'Payments & Payouts', path: '/payments' },
    { icon: Flag, label: 'Ratings & Flags', path: '/ratings-flags' },
    { icon: AlertTriangle, label: 'Disputes', path: '/disputes' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Bot, label: 'INS Settings', path: '/ins-settings' },
    { icon: FolderTree, label: 'Categories & Zones', path: '/categories-zones' },
    // { icon: Shield, label: 'Roles & Permissions', path: '/roles-permissions' },
    { icon: ShieldCheck, label: 'Document Approval', path: '/document-approval' },
    { icon: FileText, label: 'Audit Logs', path: '/audit-logs' },
    { icon: Settings, label: 'System Settings', path: '/system-settings' },
  ];

  const isActive = (path: string) => {
    // Handle query parameters in path
    if (path.includes('?')) {
      const [pathname, query] = path.split('?');
      return location.pathname === pathname && location.search.includes(query);
    }
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarExpanded ? 'w-64' : 'w-20'
        } bg-[#EEF1F5] border-r border-[#E5E9F0] flex flex-col transition-all duration-200`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-[#E5E9F0] flex items-center justify-between px-4">
          {sidebarExpanded && (
            <span className="font-semibold text-lg text-[#2E3440]">I Need Someone</span>
          )}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-1.5 hover:bg-[#E5E9F0] rounded-lg transition-colors"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="w-5 h-5 text-[#4C566A]" />
            ) : (
              <ChevronRight className="w-5 h-5 text-[#4C566A]" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  active
                    ? 'bg-[#DEE6FC] text-[#5B7CFA] border-r-2 border-[#5B7CFA]'
                    : 'text-[#2E3440] hover:bg-[#E5E9F0]'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarExpanded && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-[#EEF1F5] border-b border-[#E5E9F0] flex items-center justify-between px-6">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-5 h-5 text-[#4C566A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/users?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-[#E5E9F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 bg-white"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 ml-6">
            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 hover:bg-[#E5E9F0] rounded-lg transition-colors"
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              >
                <Bell className="w-5 h-5 text-[#4C566A]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#E57373] rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-[#E5E9F0] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E5E9F0]">
                    <p className="font-medium text-sm text-[#2E3440]">Notifications</p>
                  </div>
                  <div className="px-4 py-6 text-center text-sm text-[#4C566A]">
                    No new notifications
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#E5E9F0] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-[#5B7CFA] rounded-full flex items-center justify-center text-white text-sm">
                  {user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : 'AD'}
                </div>
                <span className="text-sm text-[#2E3440]">{user ? `${user.firstName} ${user.lastName}` : 'Admin'}</span>
                <ChevronDown className="w-4 h-4 text-[#4C566A]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#E5E9F0] py-1 z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-[#2E3440] hover:bg-[#F8F9FB] transition-colors"
                    onClick={() => { setShowUserMenu(false); navigate(user ? `/users/${user.id}` : '/users'); }}
                  >
                    Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-[#2E3440] hover:bg-[#F8F9FB] transition-colors"
                    onClick={() => { setShowUserMenu(false); navigate('/system-settings'); }}
                  >
                    Settings
                  </button>
                  <hr className="my-1 border-[#E5E9F0]" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[#E57373] hover:bg-[#F8F9FB] transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}