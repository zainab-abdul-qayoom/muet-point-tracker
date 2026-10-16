import React from 'react';
import { Navigation, Bus, Clock, Shield, Sparkles, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LeafletBusMap from '../map/LeafletBusMap';
import { formatPointNumber, getRouteColor } from '../../utils/routeColors';

export default function LiveTrackingView() {
  const { buses, selectedBus, setSelectedBus, routes, setSelectedRoute } = useApp();

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            <span>Real-Time Fleet Dispatch & GPS Map</span>
          </h2>
          <p className="text-xs text-slate-400">
            OpenStreetMap live telemetry for all operational MUET university points
          </p>
        </div>

        {/* Fleet corridor pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {buses.slice(0, 4).map((b) => {
            const color = getRouteColor(b.routeId);
            const isSelected = selectedBus?.id === b.id;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedBus(b)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-[#0f241c] text-slate-300 hover:bg-[#143226] border'
                }`}
                style={!isSelected ? { borderColor: `${color.primary}40` } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color.primary }}
                />
                <span>{formatPointNumber(b.number)}</span>
                <span className="text-[10px] opacity-80">({b.eta})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Full-Height Leaflet Map */}
      <div className="relative">
        <LeafletBusMap height="600px" focusedBusId={selectedBus?.id} />
      </div>
    </div>
  );
}
