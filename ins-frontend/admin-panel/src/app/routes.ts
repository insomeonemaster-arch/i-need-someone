import { createBrowserRouter, Navigate } from "react-router";
import React from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import JobsRequests from "./pages/JobsRequests";
import DetailView from "./pages/DetailView";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Employment from "./pages/Employment";
import Projects from "./pages/Projects";
import Payments from "./pages/Payments";
import RatingsFlags from "./pages/RatingsFlags";
import Disputes from "./pages/Disputes";
import Communications from "./pages/Communications";
import INSSettings from "./pages/INSSettings";
import CategoriesZones from "./pages/CategoriesZones";
import RolesPermissions from "./pages/RolesPermissions";
import AuditLogs from "./pages/AuditLogs";
import SystemSettings from "./pages/SystemSettings";
import DocumentApproval from "./pages/DocumentApproval";
import { useAuth } from "../context/AuthContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return React.createElement(Navigate, { to: "/", replace: true });
  return children as React.ReactElement;
}

function wrap(Component: React.ComponentType) {
  return function ProtectedPage() {
    return React.createElement(RequireAuth, null, React.createElement(Component));
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: wrap(Dashboard),
  },
  {
    path: "/jobs-requests",
    Component: wrap(JobsRequests),
  },
  {
    path: "/jobs-requests/:id",
    Component: wrap(DetailView),
  },
  {
    path: "/users",
    Component: wrap(Users),
  },
  {
    path: "/users/:id",
    Component: wrap(UserProfile),
  },
  {
    path: "/employment",
    Component: wrap(Employment),
  },
  {
    path: "/projects",
    Component: wrap(Projects),
  },
  {
    path: "/payments",
    Component: wrap(Payments),
  },
  {
    path: "/ratings-flags",
    Component: wrap(RatingsFlags),
  },
  {
    path: "/disputes",
    Component: wrap(Disputes),
  },
  {
    path: "/communications",
    Component: wrap(Communications),
  },
  {
    path: "/ins-settings",
    Component: wrap(INSSettings),
  },
  {
    path: "/categories-zones",
    Component: wrap(CategoriesZones),
  },
  {
    path: "/roles-permissions",
    Component: wrap(RolesPermissions),
  },
  {
    path: "/audit-logs",
    Component: wrap(AuditLogs),
  },
  {
    path: "/system-settings",
    Component: wrap(SystemSettings),
  },
  {
    path: "/document-approval",
    Component: wrap(DocumentApproval),
  },
]);

