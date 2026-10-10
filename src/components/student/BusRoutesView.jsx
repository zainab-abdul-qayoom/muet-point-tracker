import React from 'react';
import { Bus, MapPin, Clock, ArrowRight, Navigation, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BusRoutesView() {
  const { routes, setSelectedRoute, setActiveTab } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bus className="w-5 h-5 text-emerald-400" />
          <span>MUET Point Corridors & Bus Routes</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive directory of all 5 official university routes servicing Sindh region
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className="route-card bg-[#0b1b14] hover:bg-[#0e241c] border border-emerald-950/80 hover:border-emerald-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold bg-[#153427] text-emerald-300 border border-emerald-600/40 px-2.5 py-1 rounded-full">
                  {route.number}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  {route.status}
                </span>
              </div>

              <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition">
                {route.name}
              </h3>

              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {route.description}
              </p>

              <div className="route-card-stats grid grid-cols-3 gap-2 mt-4 p-2.5 bg-[#08150f] rounded-xl text-center border border-emerald-950">
                <div>
                  <span className="text-[10px] text-slate-400 block">Stops</span>
                  <strong className="text-xs text-emerald-300">{route.totalStops}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Distance</span>
                  <strong className="text-xs text-emerald-300">{route.totalDistance}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <strong className="text-xs text-emerald-300">{route.estTime}</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-emerald-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Hours: {route.serviceHours}
              </span>
              <button
                onClick={() => setSelectedRoute(route)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group-hover:translate-x-1 transition"
              >
                <span>View Stops</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
