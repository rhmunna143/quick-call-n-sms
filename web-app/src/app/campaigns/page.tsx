'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Send, PlayCircle, PauseCircle } from 'lucide-react';

export default function CampaignsPage() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'SMS' | 'CALL'>('SMS');
  const [isSending, setIsSending] = useState(false);
  
  const contacts = useLiveQuery(() => db.contacts.toArray());
  const campaigns = useLiveQuery(() => db.campaigns.toArray());

  const handleCreateCampaign = async () => {
    if (!name || !content || !contacts?.length) {
      alert('Please fill all fields and ensure you have contacts imported.');
      return;
    }

    setIsSending(true);

    // Save campaign to DB
    const campaignId = await db.campaigns.add({
      name,
      content,
      status: 'RUNNING',
      createdAt: new Date().toISOString()
    });

    // Create logs for each contact
    const logs = contacts.map(c => ({
      campaignId,
      contactId: c.id!,
      phone: c.normalizedPhone,
      status: 'QUEUED' as const
    }));

    await db.logs.bulkAdd(logs);

    // TODO: Send to Android Ktor endpoint sequentially or via batches
    // For now, simulate sending
    for (const log of logs) {
      try {
        const res = await fetch('http://localhost:8080/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            phoneNumber: log.phone,
            content,
            simSlot: 0
          })
        });

        if (res.ok) {
          await db.logs.where({ campaignId, phone: log.phone }).modify({ status: 'SENT', sentAt: new Date().toISOString() });
        } else {
          await db.logs.where({ campaignId, phone: log.phone }).modify({ status: 'FAILED', errorReason: 'Network error' });
        }
      } catch (err) {
        // Android server might not be running or reachable
        await db.logs.where({ campaignId, phone: log.phone }).modify({ status: 'FAILED', errorReason: 'Android unreachable' });
      }
    }

    await db.campaigns.update(campaignId, { status: 'COMPLETED' });
    setIsSending(false);
    alert('Campaign processing finished!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-500">Create and manage your SMS and Call campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Wizard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">New Campaign</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" 
              placeholder="e.g. Eid Promo 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SMS">SMS Message</option>
              <option value="CALL">Broadcast Call (Audio)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'SMS' ? 'Message Content' : 'Audio File URL or Base64 (Simulated)'}
            </label>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 h-32" 
              placeholder={type === 'SMS' ? "Type your message here..." : "Path to audio..."}
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Targeting: <strong>{contacts?.length || 0}</strong> contacts
            </span>
            <Button onClick={handleCreateCampaign} disabled={isSending || !contacts?.length}>
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Launch Campaign'}
            </Button>
          </div>
        </div>

        {/* Campaign History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">History</h2>
          <div className="space-y-3">
            {campaigns?.length === 0 && <p className="text-gray-500 text-sm">No campaigns yet.</p>}
            {campaigns?.slice().reverse().map(camp => (
              <div key={camp.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{camp.name}</h3>
                  <p className="text-xs text-gray-500">{new Date(camp.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    camp.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    camp.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {camp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
