'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [localIp, setLocalIp] = useState('');
  const [mobileIp, setMobileIp] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    fetch('/api/ip')
      .then(res => res.json())
      .then(data => setLocalIp(data.ip))
      .catch(console.error);
      
    // Load previously saved mobile IP
    const saved = localStorage.getItem('mobile_ip');
    if (saved) {
      setMobileIp(saved);
      checkConnection(saved);
    }
  }, []);

  const checkConnection = async (ip: string) => {
    setConnectionStatus('CONNECTING');
    try {
      const res = await fetch(`http://${ip}:8080/ping`);
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus('CONNECTED');
        setDeviceInfo(data.device);
        localStorage.setItem('mobile_ip', ip);
      } else {
        setConnectionStatus('DISCONNECTED');
      }
    } catch (e) {
      setConnectionStatus('DISCONNECTED');
    }
  };

  const qrValue = JSON.stringify({
    url: `http://${localIp}:3000`,
    token: "session_token_example"
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings & Pairing</h1>
      <p className="text-gray-500">Pair your Android mobile app with this local instance.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <Smartphone className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Step 1: Scan QR</h2>
          <p className="text-center text-gray-600 mb-6 text-sm">
            Scan this QR code from the Quick Call Android App to initialize the engine.
          </p>

          {localIp ? (
            <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
              <QRCodeSVG value={qrValue} size={150} />
            </div>
          ) : (
            <div className="animate-pulse w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center">
              Loading...
            </div>
          )}
        </div>

        {/* Connection Status Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-4">Step 2: Connect to Device</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Enter the IP address shown on your Android app to establish the local bridge.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Android Device IP</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={mobileIp}
                  onChange={e => setMobileIp(e.target.value)}
                  className="flex-1 border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="e.g. 192.168.1.15"
                />
                <button 
                  onClick={() => checkConnection(mobileIp)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Connect
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
              connectionStatus === 'CONNECTED' ? 'bg-green-50 border-green-200 text-green-800' :
              connectionStatus === 'CONNECTING' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-red-50 border-red-200 text-red-800'
            }`}>
              {connectionStatus === 'CONNECTED' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              <div>
                <p className="font-bold">{connectionStatus}</p>
                {connectionStatus === 'CONNECTED' && <p className="text-sm opacity-80">Device: {deviceInfo}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
