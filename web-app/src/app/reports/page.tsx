'use client';

import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Download, RefreshCcw } from 'lucide-react';
import Papa from 'papaparse';

export default function ReportsPage() {
  const campaigns = useLiveQuery(() => db.campaigns.orderBy('id').reverse().toArray());

  const exportReport = async (campaignId: number) => {
    const logs = await db.logs.where({ campaignId }).toArray();
    const csv = Papa.unparse(logs.map(log => ({
      Phone: log.phone,
      Status: log.status,
      Error: log.errorReason || '',
      Timestamp: log.sentAt || ''
    })));
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign_${campaignId}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const retryFailed = async (campaignId: number) => {
    const failedLogs = await db.logs.where({ campaignId }).and(l => l.status === 'FAILED').toArray();
    if (failedLogs.length === 0) {
      alert('No failed messages to retry!');
      return;
    }
    
    if (confirm(`Retry ${failedLogs.length} failed messages?`)) {
      alert('Retry queued! (This would create a new retry-campaign in production)');
      // TODO: Create a sub-campaign targeting only these failed numbers.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-500">View and export campaign results.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {campaigns?.map(camp => (
          <div key={camp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold">{camp.name}</h3>
              <p className="text-sm text-gray-500">
                Created: {new Date(camp.createdAt).toLocaleString()} • Status: <span className="font-medium">{camp.status}</span>
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => retryFailed(camp.id!)}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Failed
              </Button>
              <Button onClick={() => exportReport(camp.id!)}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        ))}
        {campaigns?.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
            No campaigns available for reporting.
          </div>
        )}
      </div>
    </div>
  );
}
