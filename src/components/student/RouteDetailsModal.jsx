import React from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Compass,
  CheckCircle,
  Bus,
  Share2,
  Calendar,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRouteColor } from '../../utils/routeColors';

export default function RouteDetailsModal() {
  const { selectedRoute, setSelectedRoute, setActiveTab } = useApp();

  if (!selectedRoute) return null;

  const color = getRouteColor(selectedRoute.id);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedRoute(null);
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#0b1b14] border border-emerald-800/80 rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[88dvh] sm:max-h-[90vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header matching Mockup */}
        <div className="p-3.5 sm:p-5 border-b border-emerald-950/80 bg-[#0d2219] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedRoute(null)}
              className="w-8 h-8 rounded-full bg-[#122e22] hover:bg-[#183d2d] flex items-center justify-center text-slate-300 hover:text-white transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {selectedRoute.name}
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm"
                  style={{
                    backgroundColor: `${color.primary}20`,
                    color: color.primary,
                    borderColor: `${color.primary}50`
                  }}
                >
                  {selectedRoute.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {selectedRoute.number} • Service Hours: {selectedRoute.serviceHours}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedRoute(null)}
            className="text-slate-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close route details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row matching Mockup */}
        <div className="grid grid-cols-3 divide-x divide-emerald-950 border-b border-emerald-950 bg-[#0f241c] p-3 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Total Stops</span>
            <span className="text-base font-bold text-emerald-300">{selectedRoute.totalStops}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Total Distance</span>
            <span className="text-base font-bold text-emerald-300">{selectedRoute.totalDistance}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Est. Time</span>
            <span className="text-base font-bold text-emerald-300">{selectedRoute.estTime}</span>
          </div>
        </div>

        {/* Stops Timeline matching Mockup */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Point Waypoints & Arrival Timings
          </p>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-teal-600 before:to-emerald-800">
            {selectedRoute.stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === selectedRoute.stops.length - 1;

              return (
                <div key={stop.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-[#0b1b14] flex items-center justify-center transition-all ${
                      isFirst || isLast
                        ? 'bg-emerald-400 shadow-md ring-2 ring-emerald-500/40'
                        : 'bg-[#153a2a] group-hover:bg-emerald-500'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
                  </div>

                  <div className="bg-[#0e241c] hover:bg-[#143226] border border-emerald-900/60 rounded-xl p-2.5 transition flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{stop.name}</span>
                        {isFirst && !stop.name.includes('(Starting Point)') && (
                          <span className="text-[10px] text-emerald-400 font-normal">(Starting Point)</span>
                        )}
                        {isLast && !stop.name.includes('(End Point)') && (
                          <span className="text-[10px] text-emerald-400 font-normal">(End Point)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Stop #{index + 1} • {stop.isMajor ? 'Key Boarding Junction' : 'Standard Stop'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 bg-[#091711] px-2 py-0.5 rounded border border-emerald-800 min-w-[52px] inline-block text-center">
                        {stop.eta}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with "View on Map" button matching Mockup */}
        <div className="p-4 border-t border-emerald-950/80 bg-[#0d2219] flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedRoute(null);
              setActiveTab('live-tracking');
            }}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            <MapPin className="w-4 h-4" />
            <span>View on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
}
