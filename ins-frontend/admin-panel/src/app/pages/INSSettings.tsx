import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Table,
  Button,
  Tabs,
  INSAssistInput,
} from '../components/ui/AdminComponents';
import { Bot, Save, Loader2 } from 'lucide-react';
import { settingsService, insService } from '../../services/admin.service';

export default function INSSettings() {
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  // Guardrails controlled state
  const [guardrails, setGuardrails] = useState({
    create_requests: true,
    match_providers: true,
    process_refunds: false,
    send_notifications: true,
    profanity_filter: true,
    pii_detection: true,
  });
  const [guardrailSaving, setGuardrailSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(res => {
      const d = res.data;
      setGuardrails({
        create_requests: d.ins_create_requests !== false,
        match_providers: d.ins_match_providers !== false,
        process_refunds: d.ins_process_refunds === true,
        send_notifications: d.ins_send_notifications !== false,
        profanity_filter: d.ins_profanity_filter !== false,
        pii_detection: d.ins_pii_detection !== false,
      });
    }).catch(() => { /* use defaults */ });
  }, []);

  const saveGuardrails = async () => {
    setGuardrailSaving(true);
    try {
      await settingsService.updateSettings({
        ins_create_requests: guardrails.create_requests,
        ins_match_providers: guardrails.match_providers,
        ins_process_refunds: guardrails.process_refunds,
        ins_send_notifications: guardrails.send_notifications,
        ins_profanity_filter: guardrails.profanity_filter,
        ins_pii_detection: guardrails.pii_detection,
      });
      alert('Guardrails saved successfully.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save guardrails');
    } finally {
      setGuardrailSaving(false);
    }
  };

  const handleTestSend = async (input: string) => {
    setTestInput(input);
    setTestOutput('');
    setTestLoading(true);
    try {
      let activeConvId = convId;
      if (!activeConvId) {
        const startRes = await insService.startConversation();
        activeConvId = startRes.data.conversationId;
        setConvId(activeConvId);
      }
      const msgRes = await insService.sendMessage(activeConvId, input);
      setTestOutput(msgRes.data.response);
    } catch (e: unknown) {
      setTestOutput(`Error: ${e instanceof Error ? e.message : 'Failed to send message'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const promptTemplates = [
    {
      id: 'PROMPT-001',
      name: 'Local Request Intake',
      flow: 'Customer Onboarding',
      lastUpdated: '2024-02-05',
    },
    {
      id: 'PROMPT-002',
      name: 'Provider Onboarding',
      flow: 'Provider Verification',
      lastUpdated: '2024-02-03',
    },
    {
      id: 'PROMPT-003',
      name: 'Project Intake',
      flow: 'Project Creation',
      lastUpdated: '2024-02-01',
    },
    {
      id: 'PROMPT-004',
      name: 'Employment Intake',
      flow: 'Employment Post',
      lastUpdated: '2024-01-28',
    },
  ];

  const insActivityLog = [
    {
      id: 'LOG-5421',
      user: 'Sarah Johnson',
      action: 'Local request intake',
      input: 'I need a plumber urgently',
      output: 'Created request REQ-4521',
      timestamp: '2024-02-10 14:30',
    },
    {
      id: 'LOG-5420',
      user: 'Admin User',
      action: 'Rewrite admin note',
      input: 'Provider looks good approve',
      output: 'Provider verification documents reviewed...',
      timestamp: '2024-02-10 12:15',
    },
    {
      id: 'LOG-5419',
      user: 'Robert Chen',
      action: 'Project intake',
      input: 'Need someone to build mobile app',
      output: 'Created project PRJ-7829',
      timestamp: '2024-02-09 11:00',
    },
  ];

  const templateColumns = [
    { key: 'id', label: 'Template ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'flow', label: 'Flow', sortable: true },
    { key: 'lastUpdated', label: 'Last Updated', sortable: true },
    {
      key: 'action',
      label: 'Action',
      render: () => (
        <Button variant="primary" size="sm">
          Edit
        </Button>
      ),
    },
  ];

  const logColumns = [
    { key: 'id', label: 'Log ID', sortable: true },
    { key: 'user', label: 'User', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'input', label: 'Input', sortable: false },
    { key: 'output', label: 'Output', sortable: false },
    { key: 'timestamp', label: 'Timestamp', sortable: true },
  ];

  const promptsTab = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Manage INS prompt templates for different flows
        </div>
        <Button variant="primary">
          <Bot className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>
      <Table columns={templateColumns} data={promptTemplates} />

      <div className="mt-6">
        <h4 className="font-medium mb-3">Example: Local Request Intake Template</h4>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700 mb-2">
            <strong>System Prompt:</strong>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            You are INS, an AI assistant for "I Need Someone". When a customer
            describes their need, extract: service type, urgency, location, budget,
            and any special requirements. Create a structured request.
          </p>
          <div className="text-sm text-gray-700 mb-2">
            <strong>Allowed Actions:</strong>
          </div>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            <li>Create local request</li>
            <li>Match with providers</li>
            <li>Send notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const guardrailsTab = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Action Permissions</h4>
        <div className="space-y-3">
          {([
            { key: 'create_requests' as const, label: 'Create Requests', desc: 'Allow INS to create local requests on behalf of users' },
            { key: 'match_providers' as const, label: 'Match Providers', desc: 'Allow INS to auto-match providers based on criteria' },
            { key: 'process_refunds' as const, label: 'Process Refunds', desc: 'Allow INS to process refunds (requires admin approval)' },
            { key: 'send_notifications' as const, label: 'Send Notifications', desc: 'Allow INS to send automated notifications to users' },
          ] as const).map(({ key, label, desc }) => (
            <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={guardrails[key]}
                onChange={e => setGuardrails(g => ({ ...g, [key]: e.target.checked }))}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-medium mb-3">Content Filters</h4>
        <div className="space-y-3">
          {([
            { key: 'profanity_filter' as const, label: 'Profanity Filter', desc: 'Block inappropriate language in inputs' },
            { key: 'pii_detection' as const, label: 'PII Detection', desc: 'Detect and handle personally identifiable information' },
          ] as const).map(({ key, label, desc }) => (
            <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={guardrails[key]}
                onChange={e => setGuardrails(g => ({ ...g, [key]: e.target.checked }))}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <Button variant="primary" onClick={saveGuardrails} disabled={guardrailSaving}>
        {guardrailSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Guardrails
      </Button>
    </div>
  );

  const testConsoleTab = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Test INS Behavior</h4>
        <p className="text-sm text-gray-600 mb-4">
          Use this console to test how INS processes inputs and generates outputs
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Flow
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option>Local Request Intake</option>
            <option>Provider Onboarding</option>
            <option>Project Intake</option>
            <option>Employment Intake</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Input
          </label>
          <INSAssistInput
            placeholder="Type or speak your test input..."
            onSend={handleTestSend}
          />
        </div>

        {testLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            INS is processing...
          </div>
        )}

        {testOutput && !testLoading && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              INS Output
            </label>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {testOutput}
              </pre>
            </div>
          </div>
        )}
        {testInput && !testLoading && (
          <div className="text-right">
            <Button variant="ghost" size="sm" onClick={() => { setConvId(null); setTestInput(''); setTestOutput(''); }}>Reset conversation</Button>
          </div>
        )}
      </div>
    </div>
  );

  const activityLogTab = (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        Searchable log of all INS interactions across the platform
      </div>
      <Table columns={logColumns} data={insActivityLog} />
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-semibold">INS Settings</h1>
          </div>
          <p className="text-gray-600">
            Configure INS AI assistant prompts, guardrails, and monitor activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">INS Interactions</div>
            <div className="text-2xl font-semibold">1,847</div>
            <div className="text-sm text-gray-500 mt-1">Last 7 days</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-2xl font-semibold text-green-600">94.2%</div>
            <div className="text-sm text-gray-500 mt-1">Completed actions</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Active Prompts</div>
            <div className="text-2xl font-semibold">8</div>
            <div className="text-sm text-gray-500 mt-1">Templates</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Avg. Response</div>
            <div className="text-2xl font-semibold">1.2s</div>
            <div className="text-sm text-gray-500 mt-1">Processing time</div>
          </div>
        </div>

        {/* INS Configuration */}
        <Card>
          <Tabs
            tabs={[
              { id: 'prompts', label: 'Prompt Templates', content: promptsTab },
              { id: 'guardrails', label: 'Guardrails', content: guardrailsTab },
              { id: 'test', label: 'Test Console', content: testConsoleTab },
              { id: 'activity', label: 'Activity Log', content: activityLogTab },
            ]}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
