import { createBrowserRouter } from 'react-router';
import { ProtectedAppShell } from './components/ProtectedAppShell';
import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import MyRequests from './screens/MyRequests';
import MyJobs from './screens/MyJobs';
import Messages from './screens/Messages';
import Earnings from './screens/Earnings';
import Profile from './screens/Profile';
import NotFound from './screens/NotFound';
import RedirectToHome from './screens/RedirectToHome';
import ReviewEdit from './screens/ReviewEdit';

// Local Services
import NewLocalServiceRequest from './screens/local-services/NewRequest';
import LocalServiceProviderSetup from './screens/local-services/ProviderSetup';
import LocalServiceRequestDetail from './screens/local-services/RequestDetail';
import BrowseServiceRequests from './screens/local-services/BrowseServiceRequests';

// Jobs
import PostJob from './screens/jobs/PostJob';
import BrowseJobs from './screens/jobs/BrowseJobs';
import JobDetail from './screens/jobs/JobDetail';

// Projects
import NewProject from './screens/projects/NewProject';
import ProjectProviderSetup from './screens/projects/ProviderSetup';
import ProjectDetail from './screens/projects/ProjectDetail';

// Profile
import AccountInfo from './screens/profile/AccountInfo';
import Settings from './screens/profile/Settings';
import HelpSupport from './screens/profile/HelpSupport';

// Notifications
import Notifications from './screens/Notifications';
import AnnouncementDetail from './screens/AnnouncementDetail';

// Support & Disputes
import SupportHub from './screens/support/SupportHub';
import CreateSupportTicket from './screens/support/CreateSupportTicket';
import SupportTicketList from './screens/support/SupportTicketList';
import SupportTicketDetail from './screens/support/SupportTicketDetail';

// Chat
import ChatThread from './screens/ChatThread';
import StartChat from './screens/StartChat';

// Report
import ReportFlow from './screens/ReportFlow';

// Transactions & Disputes
import TransactionDetail from './screens/TransactionDetail';
import DisputeFlow from './screens/DisputeFlow';

// Browse & Profiles
import BrowseLocalServices from './screens/browse/BrowseLocalServices';
import BrowseProjects from './screens/browse/BrowseProjects';
import BrowseJobCandidates from './screens/browse/BrowseJobCandidates';
import ProviderProfileLocal from './screens/profiles/ProviderProfileLocal';

// Verification
import VerificationStatus from './screens/verification/VerificationStatus';
import UploadVerificationDocuments from './screens/verification/UploadVerificationDocuments';

export const router = createBrowserRouter([
  // Auth Routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  // Protected Routes
  {
    path: '/',
    element: <ProtectedAppShell />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'my-requests',
        element: <MyRequests />,
      },
      {
        path: 'my-jobs',
        element: <MyJobs />,
      },
      {
        path: 'messages',
        element: <Messages />,
      },
      {
        path: 'earnings',
        element: <Earnings />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'profile/account',
        element: <AccountInfo />,
      },
      {
        path: 'profile/settings',
        element: <Settings />,
      },
      {
        path: 'profile/help',
        element: <HelpSupport />,
      },
      // Notifications
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'notifications/announcement/:id',
        element: <AnnouncementDetail />,
      },
      // Support
      {
        path: 'support',
        element: <SupportHub />,
      },
      {
        path: 'support/create',
        element: <CreateSupportTicket />,
      },
      {
        path: 'support/tickets',
        element: <SupportTicketList />,
      },
      {
        path: 'support/ticket/:id',
        element: <SupportTicketDetail />,
      },
      // Chat
      {
        path: 'chat/new',
        element: <StartChat />,
      },
      {
        path: 'chat/:id',
        element: <ChatThread />,
      },
      // Report
      {
        path: 'report',
        element: <ReportFlow />,
      },
      // Transactions & Disputes
      {
        path: 'transaction/:id',
        element: <TransactionDetail />,
      },
      {
        path: 'dispute/create',
        element: <DisputeFlow />,
      },
      // Browse
      {
        path: 'browse/local-services',
        element: <BrowseLocalServices />,
      },
      {
        path: 'browse/projects',
        element: <BrowseProjects />,
      },
      {
        path: 'browse/job-candidates',
        element: <BrowseJobCandidates />,
      },
      // Provider Profiles
      {
        path: 'provider/local/:id',
        element: <ProviderProfileLocal />,
      },
      {
        path: 'provider/project/:id',
        element: <ProviderProfileLocal />,
      },
      {
        path: 'provider/job/:id',
        element: <ProviderProfileLocal />,
      },
      // Verification
      {
        path: 'verification/status',
        element: <VerificationStatus />,
      },
      {
        path: 'verification/upload',
        element: <UploadVerificationDocuments />,
      },
      // Review & Edit (shared across all categories)
      {
        path: 'review-edit',
        element: <ReviewEdit />,
      },
      // Local Services routes (manual fallback)
      {
        path: 'local-services/new',
        element: <NewLocalServiceRequest />,
      },
      {
        path: 'local-services/provider/setup',
        element: <LocalServiceProviderSetup />,
      },
      {
        path: 'local-services/requests/browse',
        element: <BrowseServiceRequests />,
      },
      {
        path: 'local-services/detail/:id',
        element: <LocalServiceRequestDetail />,
      },
      // Jobs routes (manual fallback)
      {
        path: 'jobs/employer/new',
        element: <PostJob />,
      },
      {
        path: 'jobs/candidate/browse',
        element: <BrowseJobs />,
      },
      {
        path: 'jobs/detail/:id',
        element: <JobDetail />,
      },
      // Projects routes (manual fallback)
      {
        path: 'projects/new',
        element: <NewProject />,
      },
      {
        path: 'projects/provider/setup',
        element: <ProjectProviderSetup />,
      },
      {
        path: 'projects/detail/:id',
        element: <ProjectDetail />,
      },
      {
        path: 'ins',
        element: <RedirectToHome />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);