'use client';

import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function DashboardPage() {
  const contactCount = useLiveQuery(() => db.contacts.count()) || 0;
  const campaignCount = useLiveQuery(() => db.campaigns.count()) || 0;
  const messageCount = useLiveQuery(() => db.logs.count()) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-500">Welcome to the Quick Call & SMS System.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-700">Total Contacts</h3>
          <p className="text-3xl font-bold mt-2">{contactCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-700">Total Campaigns</h3>
          <p className="text-3xl font-bold mt-2">{campaignCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-700">Logs Processed</h3>
          <p className="text-3xl font-bold mt-2">{messageCount}</p>
        </div>
      </div>
    </div>
  );
}
