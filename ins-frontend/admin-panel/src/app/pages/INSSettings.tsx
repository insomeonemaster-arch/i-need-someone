import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  Card,
  Button,
  Tabs,
  INSAssistInput,
} from '../components/ui/AdminComponents';
import { Bot, Save, Loader2, AlertCircle, FileText } from 'lucide-react';
import { settingsService, insService, auditService, type AuditLogItem } from '../../services/admin.service';

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

  // Activity log
  const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  const loadActivityLogs = async () => {
    setActivityLoading(true);
    setActivityError('');
    try {
      const res = await auditService.getLogs({ action: 'ins', per_page: '50' });
      setActivityLogs(res.data || []);
    } catch (e: unknown) {
      setActivityError(e instanceof Error ? e.message : 'Failed to load activity logs');
    } finally {
      setActivityLoading(false);
    }
  };

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

    loadActivityLogs();
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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Admin actions related to INS settings and guardrail changes</p>
        <Button variant="secondary" size="sm" onClick={loadActivityLogs} disabled={activityLoading}>
          {activityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {activityError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {activityError}
        </div>
      )}

      {activityLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : activityLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mb-3" />
          <p className="text-sm">No INS-related activity logged yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {activityLogs.map((log) => (
            <div key={log.id} className="px-4 py-3 bg-white hover:bg-gray-50 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-400">{log.log_id}</span>
                  <span className="font-medium text-gray-800">{log.action}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              {log.user && (
                <p className="text-xs text-gray-500 mt-1">
                  by {log.user.firstName} {log.user.lastName} ({log.user.email})
                </p>
              )}
            </div>
          ))}
        </div>
      )}
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

        {/* INS Configuration */}
        <Card>
          <Tabs
            tabs={[
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
