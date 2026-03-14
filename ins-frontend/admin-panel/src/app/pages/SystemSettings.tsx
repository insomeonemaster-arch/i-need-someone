import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Button,
  Tabs,
} from '../components/ui/AdminComponents';
import { Settings, Save, AlertCircle, Loader2 } from 'lucide-react';
import { settingsService } from '../../services/admin.service';

export default function SystemSettings() {
  // General
  const [platform_name, setPlatformName] = useState('I Need Someone');
  const [support_email, setSupportEmail] = useState('support@ineedsomeone.com');
  const [support_phone, setSupportPhone] = useState('1-800-NEED-HELP');
  const [default_currency, setDefaultCurrency] = useState('USD');
  const [time_zone, setTimeZone] = useState('America/New_York');
  const [generalSaving, setGeneralSaving] = useState(false);

  // Feature flags
  const [feature_local_requests, setFeatureLocalRequests] = useState(true);
  const [feature_employment_posts, setFeatureEmploymentPosts] = useState(true);
  const [feature_projects, setFeatureProjects] = useState(true);
  const [feature_ins_assistant, setFeatureInsAssistant] = useState(true);
  const [feature_beta, setFeatureBeta] = useState(false);
  const [feature_auto_match, setFeatureAutoMatch] = useState(true);
  const [feature_notifications, setFeatureNotifications] = useState(true);
  const [feature_ratings, setFeatureRatings] = useState(true);
  const [featureSaving, setFeatureSaving] = useState(false);

  // Payments
  const [payment_gateway, setPaymentGateway] = useState('stripe');
  const [payment_authorize_on_acceptance, setPaymentAuthorize] = useState(true);
  const [payout_schedule, setPayoutSchedule] = useState('weekly');
  const [refund_timeout_hours, setRefundTimeout] = useState('24');
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Location
  const [search_radius_default_km, setSearchRadiusDefault] = useState('10');
  const [search_radius_max_km, setSearchRadiusMax] = useState('50');
  const [locationSaving, setLocationSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(res => {
      const d = res.data;
      if (d.platform_name) setPlatformName(String(d.platform_name));
      if (d.support_email) setSupportEmail(String(d.support_email));
      if (d.support_phone) setSupportPhone(String(d.support_phone));
      if (d.default_currency) setDefaultCurrency(String(d.default_currency));
      if (d.time_zone) setTimeZone(String(d.time_zone));
      if (d.feature_local_requests !== undefined) setFeatureLocalRequests(Boolean(d.feature_local_requests));
      if (d.feature_employment_posts !== undefined) setFeatureEmploymentPosts(Boolean(d.feature_employment_posts));
      if (d.feature_projects !== undefined) setFeatureProjects(Boolean(d.feature_projects));
      if (d.feature_ins_assistant !== undefined) setFeatureInsAssistant(Boolean(d.feature_ins_assistant));
      if (d.feature_beta !== undefined) setFeatureBeta(Boolean(d.feature_beta));
      if (d.feature_auto_match !== undefined) setFeatureAutoMatch(Boolean(d.feature_auto_match));
      if (d.feature_notifications !== undefined) setFeatureNotifications(Boolean(d.feature_notifications));
      if (d.feature_ratings !== undefined) setFeatureRatings(Boolean(d.feature_ratings));
      if (d.payment_gateway) setPaymentGateway(String(d.payment_gateway));
      if (d.payment_authorize_on_acceptance !== undefined) setPaymentAuthorize(Boolean(d.payment_authorize_on_acceptance));
      if (d.payout_schedule) setPayoutSchedule(String(d.payout_schedule));
      if (d.refund_timeout_hours) setRefundTimeout(String(d.refund_timeout_hours));
      if (d.search_radius_default_km) setSearchRadiusDefault(String(d.search_radius_default_km));
      if (d.search_radius_max_km) setSearchRadiusMax(String(d.search_radius_max_km));
    }).catch(() => { /* use defaults */ });
  }, []);

  const saveGeneral = async () => {
    setGeneralSaving(true);
    try {
      await settingsService.updateSettings({ platform_name, support_email, support_phone, default_currency, time_zone });
      alert('General settings saved.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setGeneralSaving(false);
    }
  };

  const saveFeatures = async () => {
    setFeatureSaving(true);
    try {
      await settingsService.updateSettings({ feature_local_requests, feature_employment_posts, feature_projects, feature_ins_assistant, feature_beta, feature_auto_match, feature_notifications, feature_ratings });
      alert('Feature flags saved.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setFeatureSaving(false);
    }
  };

  const savePayments = async () => {
    setPaymentSaving(true);
    try {
      await settingsService.updateSettings({ payment_gateway, payment_authorize_on_acceptance, payout_schedule, refund_timeout_hours: Number(refund_timeout_hours) });
      alert('Payment settings saved.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setPaymentSaving(false);
    }
  };

  const saveLocation = async () => {
    setLocationSaving(true);
    try {
      await settingsService.updateSettings({ search_radius_default_km: Number(search_radius_default_km), search_radius_max_km: Number(search_radius_max_km) });
      alert('App configuration saved.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLocationSaving(false);
    }
  };
  const generalTab = (
    <div className="space-y-6">
      <div>
        <label className="block font-medium mb-2">Platform Name</label>
        <input type="text" value={platform_name} onChange={e => setPlatformName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block font-medium mb-2">Support Email</label>
        <input type="email" value={support_email} onChange={e => setSupportEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block font-medium mb-2">Support Phone</label>
        <input type="tel" value={support_phone} onChange={e => setSupportPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block font-medium mb-2">Default Currency</label>
        <select value={default_currency} onChange={e => setDefaultCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>
      <div>
        <label className="block font-medium mb-2">Time Zone</label>
        <select value={time_zone} onChange={e => setTimeZone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          <option value="America/Chicago">America/Chicago (CST)</option>
        </select>
      </div>
      <Button variant="primary" onClick={saveGeneral} disabled={generalSaving}>
        {generalSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save General Settings
      </Button>
    </div>
  );

  const featureFlagsTab = (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">Feature flags control which features are enabled or disabled on the platform. Changes take effect immediately.</div>
      </div>
      <div className="space-y-3">
        {([
          { key: 'local_requests' as const, label: 'Local Requests', desc: 'Enable local "I need someone now" requests', value: feature_local_requests, set: setFeatureLocalRequests },
          { key: 'employment_posts' as const, label: 'Employment Posts', desc: 'Enable employment job postings and hiring pipeline', value: feature_employment_posts, set: setFeatureEmploymentPosts },
          { key: 'projects' as const, label: 'Projects (Upwork-style)', desc: 'Enable project-based work with proposals and milestones', value: feature_projects, set: setFeatureProjects },
          { key: 'ins_assistant' as const, label: 'INS AI Assistant', desc: 'Enable INS voice and text assistant for users', value: feature_ins_assistant, set: setFeatureInsAssistant },
          { key: 'beta' as const, label: 'Beta Features', desc: 'Enable experimental features for testing', value: feature_beta, set: setFeatureBeta },
          { key: 'auto_match' as const, label: 'Provider Auto-Match', desc: 'Automatically match providers to requests', value: feature_auto_match, set: setFeatureAutoMatch },
          { key: 'notifications' as const, label: 'Real-time Notifications', desc: 'Enable push notifications for users', value: feature_notifications, set: setFeatureNotifications },
          { key: 'ratings' as const, label: 'Ratings & Reviews', desc: 'Allow users to rate and review each other', value: feature_ratings, set: setFeatureRatings },
        ]).map(({ key, label, desc, value, set }) => (
          <label key={key} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer">
            <input type="checkbox" className="rounded" checked={value} onChange={e => set(e.target.checked)} />
            <div className="flex-1">
              <div className="font-medium">{label}</div>
              <div className="text-sm text-gray-500">{desc}</div>
            </div>
          </label>
        ))}
      </div>
      <Button variant="primary" onClick={saveFeatures} disabled={featureSaving}>
        {featureSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Feature Flags
      </Button>
    </div>
  );

  const paymentsTab = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Payment Gateway</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Primary Gateway</label>
            <select value={payment_gateway} onChange={e => setPaymentGateway(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="square">Square</option>
            </select>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            API keys and webhook configuration are managed separately for security.
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-medium mb-3">Payment Authorization</h4>
        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer">
          <input type="checkbox" className="rounded" checked={payment_authorize_on_acceptance} onChange={e => setPaymentAuthorize(e.target.checked)} />
          <div className="flex-1">
            <div className="font-medium text-sm">Authorize on Job Acceptance</div>
            <div className="text-xs text-gray-500">Hold payment when provider accepts, capture on completion</div>
          </div>
        </label>
      </div>
      <div>
        <h4 className="font-medium mb-3">Payout Schedule</h4>
        <label className="block text-sm text-gray-600 mb-2">Provider Payout Frequency</label>
        <select value={payout_schedule} onChange={e => setPayoutSchedule(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly (Friday)</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div>
        <h4 className="font-medium mb-3">Refund Policy</h4>
        <label className="block text-sm text-gray-600 mb-2">Auto-refund Timeout (hours)</label>
        <input type="number" value={refund_timeout_hours} onChange={e => setRefundTimeout(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        <div className="text-xs text-gray-500 mt-1">Automatically refund if no provider accepts within this timeframe</div>
      </div>
      <Button variant="primary" onClick={savePayments} disabled={paymentSaving}>
        {paymentSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  );

  const policiesTab = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Legal Documents</h4>
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Terms of Service</div>
                <div className="text-sm text-gray-500">Last updated: Feb 1, 2024</div>
              </div>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Privacy Policy</div>
                <div className="text-sm text-gray-500">Last updated: Feb 1, 2024</div>
              </div>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Cookie Policy</div>
                <div className="text-sm text-gray-500">Last updated: Jan 15, 2024</div>
              </div>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Provider Agreement</div>
                <div className="text-sm text-gray-500">Last updated: Jan 20, 2024</div>
              </div>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Compliance</h4>
        <div className="space-y-2">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            ✓ GDPR Compliant
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            ✓ CCPA Compliant
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            ✓ SOC 2 Type II Certified
          </div>
        </div>
      </div>
    </div>
  );

  const appConfigTab = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Mobile App Configuration</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              iOS App Version
            </label>
            <input
              type="text"
              defaultValue="2.4.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Android App Version
            </label>
            <input
              type="text"
              defaultValue="2.4.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Minimum Supported Version
            </label>
            <input
              type="text"
              defaultValue="2.0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Location Services</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Default Search Radius (km)</label>
            <input type="number" value={search_radius_default_km} onChange={e => setSearchRadiusDefault(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Max Search Radius (km)</label>
            <input type="number" value={search_radius_max_km} onChange={e => setSearchRadiusMax(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Matching Algorithm</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <input type="checkbox" defaultChecked className="rounded" />
            <div className="flex-1">
              <div className="font-medium text-sm">Prioritize Proximity</div>
              <div className="text-xs text-gray-500">
                Match nearest available providers first
              </div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <input type="checkbox" defaultChecked className="rounded" />
            <div className="flex-1">
              <div className="font-medium text-sm">Consider Rating</div>
              <div className="text-xs text-gray-500">
                Prioritize higher-rated providers
              </div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <input type="checkbox" className="rounded" />
            <div className="flex-1">
              <div className="font-medium text-sm">Balance Load</div>
              <div className="text-xs text-gray-500">
                Distribute jobs evenly across providers
              </div>
            </div>
          </label>
        </div>
      </div>

      <Button variant="primary" onClick={saveLocation} disabled={locationSaving}>
        {locationSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save App Configuration
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-semibold">System Settings</h1>
          </div>
          <p className="text-gray-600">
            Platform configuration and feature management
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Platform Status</div>
            <div className="text-2xl font-semibold text-green-600">Operational</div>
            <div className="text-sm text-gray-500 mt-1">All systems go</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Uptime</div>
            <div className="text-2xl font-semibold">99.97%</div>
            <div className="text-sm text-gray-500 mt-1">Last 30 days</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">API Response</div>
            <div className="text-2xl font-semibold">145ms</div>
            <div className="text-sm text-gray-500 mt-1">Average</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Last Deploy</div>
            <div className="text-2xl font-semibold">Today</div>
            <div className="text-sm text-gray-500 mt-1">v2.4.1</div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card>
          <Tabs
            tabs={[
              { id: 'general', label: 'General', content: generalTab },
              { id: 'features', label: 'Feature Flags', content: featureFlagsTab },
              { id: 'payments', label: 'Payments', content: paymentsTab },
              { id: 'policies', label: 'Policies', content: policiesTab },
              { id: 'app', label: 'App Configuration', content: appConfigTab },
            ]}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
