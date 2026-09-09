'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Send, Activity, FileText, Settings, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Send },
  { name: 'Live Monitor', href: '/monitor', icon: Phone },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [wsStatus, setWsStatus] = useState<'Offline' | 'Connected'>('Offline');

  useEffect(() => {
    const mobileIp = localStorage.getItem('mobile_ip');
    if (!mobileIp) return;

    const ws = new WebSocket(`ws://${mobileIp}:8080/events`);
    
    ws.onopen = () => setWsStatus('Connected');
    ws.onclose = () => setWsStatus('Offline');
    
    ws.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'SMS_STATUS' || payload.type === 'CALL_STATUS') {
          const { campaignId, phone, status } = payload.data;
          
          const log = await db.logs.where('campaignId').equals(campaignId).and(l => l.phone === phone).first();
          if (log && log.id) {
            await db.logs.update(log.id, { 
              status, 
              sentAt: new Date().toISOString() 
            });
          }
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-4 flex items-center space-x-2 font-bold text-xl border-b border-gray-800">
        <Phone className="w-6 h-6 text-blue-400" />
        <span>QuickCall System</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-gray-500 border-t border-gray-800 flex justify-between items-center">
        <span>Local Engine v1.0</span>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${wsStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{wsStatus}</span>
        </div>
      </div>
    </div>
  );
}
