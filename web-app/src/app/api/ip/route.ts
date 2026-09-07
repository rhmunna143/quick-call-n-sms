import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const nets = os.networkInterfaces();
  let ip = '127.0.0.1';

  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;
    
    for (const net of interfaces) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        // prefer Wi-Fi or local area connections
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('eth') || name.toLowerCase().includes('en')) {
            ip = net.address;
            break;
        }
        ip = net.address; // fallback to whatever we found
      }
    }
  }

  return NextResponse.json({ ip });
}
