'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const [localIp, setLocalIp] = useState('');

  useEffect(() => {
    fetch('/api/ip')
      .then(res => res.json())
      .then(data => setLocalIp(data.ip))
      .catch(console.error);
  }, []);

  const qrValue = JSON.stringify({
    url: `http://${localIp}:3000`,
    token: "session_token_example" // In a real app, generate a secure random string
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings & Pairing</h1>
      <p className="text-gray-500">Pair your Android mobile app with this local instance.</p>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center max-w-lg">
        <Smartphone className="w-12 h-12 text-blue-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Device Pairing</h2>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Scan this QR code from the Quick Call Android App to link your device. Both devices must be on the same Wi-Fi network.
        </p>

        {localIp ? (
          <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
            <QRCodeSVG value={qrValue} size={200} />
          </div>
        ) : (
          <div className="animate-pulse w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center">
            Loading...
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-gray-700">Manual Entry IP:</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm mt-1 inline-block">
            {localIp || 'Loading...'}
          </code>
        </div>
      </div>
    </div>
  );
}
