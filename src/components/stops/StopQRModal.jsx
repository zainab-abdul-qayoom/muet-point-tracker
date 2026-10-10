import React, { useState } from 'react';
import { X, QrCode, MapPin, Bus, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function StopQRModal() {
  const { isQRScannerOpen, setIsQRScannerOpen, routes, buses, setSelectedBus, setActiveTab } = useApp();
  const [selectedStopId, setSelectedStopId] = useState('s-02'); // Academic Block by default

  if (!isQRScannerOpen) return null;

  // Flatten all stops across routes
  const allStops = routes.flatMap((r) => r.stops.map((s) => ({ ...s, routeName: r.name, routeNumber: r.number })));
  const uniqueStops = allStops.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);

  const activeStop = uniqueStops.find((s) => s.id === selectedStopId) || uniqueStops[0];

  // Find incoming buses for this stop
  const incomingBuses = buses.filter(
    (b) => b.isOnline && b.status !== 'Maintenance' && b.status !== 'Inactive'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0b1b14] border border-emerald-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950 mb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <QrCode className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Smart Stop QR Identification</h3>
          </div>
          <button onClick={() => setIsQRScannerOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-3">
          Simulate scanning the QR code mounted at any physical MUET Point shelter to instantly display live incoming arrivals:
        </p>

        {/* Stop Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 block mb-1">Select / Scanned Stop:</label>
          <select
            value={selectedStopId}
            onChange={(e) => setSelectedStopId(e.target.value)}
            className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white"
          >
            {uniqueStops.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.routeNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Simulated QR Code Graphic */}
        <div className="p-4 bg-white rounded-2xl w-40 h-40 mx-auto flex items-center justify-center shadow-lg mb-4">
          <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-emerald-950 rounded-xl">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${
                  i % 2 === 0 || i % 5 === 0 ? 'bg-emerald-400' : 'bg-[#07150f]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Live Incoming Buses at this Stop */}
        <div>
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Incoming Points for {activeStop.name}
          </h4>

          <div className="space-y-2 max-h-44 overflow-y-auto">
            {incomingBuses.slice(0, 3).map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBus(b);
                  setIsQRScannerOpen(false);
                  setActiveTab('live-tracking');
                }}
                className="p-2.5 bg-[#0f241c] hover:bg-[#153427] border border-emerald-900 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white">{b.number}</span>
                    <p className="text-[10px] text-slate-400">{b.routeName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-300">ETA {b.eta}</span>
                  <p className="text-[10px] text-slate-400">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
