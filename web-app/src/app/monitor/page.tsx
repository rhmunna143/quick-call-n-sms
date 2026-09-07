'use client';

import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function MonitorPage() {
  const logs = useLiveQuery(() => db.logs.orderBy('id').reverse().limit(100).toArray());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Monitor</h1>
          <p className="text-gray-500">Real-time status of your outgoing campaigns.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-medium bg-gray-50 flex justify-between">
          <span>Recent Execution Logs</span>
          <span className="text-sm font-normal text-gray-500">Auto-updating...</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Campaign ID</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Phone Number</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Status</th>
                <th className="px-6 py-3 text-sm text-gray-500 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No execution logs yet. Start a campaign!
                  </td>
                </tr>
              )}
              {logs?.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">#{log.campaignId}</td>
                  <td className="px-6 py-4 font-medium">{log.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      log.status === 'SENT' || log.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      log.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.errorReason || (log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
