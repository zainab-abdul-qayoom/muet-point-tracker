import React from 'react';
import { MapPin, Navigation, Clock, Bookmark, Bus, Footprints, ArrowRight, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRouteColor } from '../../utils/routeColors';

export default function MyStopsView() {
  const { routes, currentUser, setSelectedRoute, setActiveTab, favorites, toggleFavoriteStop } = useApp();

  const allStops = routes.flatMap((r) =>
    r.stops.map((s) => ({ ...s, routeId: r.id, routeName: r.name, routeNumber: r.number }))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <span>My Point Stops & Walking Directions</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Designated campus pickup points, walking time estimates and bookmarked stops
        </p>
      </div>

      {/* Nearest Stop Highlight Card matching Mockup */}
      <div className="bg-gradient-to-r from-[#0d2a1e] to-[#0c2219] border border-emerald-800/70 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Nearest Boarding Point
              </span>
              <span className="text-xs text-slate-300">Based on Campus GPS</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Academic Block Main Portico
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
              <span>Walking distance: ~180 meters</span>
              <span>•</span>
              <strong className="text-emerald-300">2 min walk</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('live-tracking')}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shrink-0"
        >
          <Navigation className="w-4 h-4" />
          <span>Start Walking Nav</span>
        </button>
      </div>

      {/* Stops List */}
      <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white">University Point Boarding Stops</h3>

        <div className="space-y-3">
          {allStops.slice(0, 8).map((stop) => {
            const isFav = favorites?.stops?.includes(stop.id);
            const color = getRouteColor(stop.routeId);

            return (
              <div
                key={stop.id}
                className="p-3 sm:p-3.5 bg-[#0e241c] hover:bg-[#143226] border border-emerald-900/60 rounded-xl flex items-center justify-between gap-2 transition group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${color.primary}15`,
                      borderColor: `${color.primary}40`,
                      color: color.primary
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">{stop.name}</h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      {stop.routeNumber} ({stop.routeName})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-400 bg-[#08150f] px-2 sm:px-2.5 py-1 rounded border border-emerald-800 whitespace-nowrap">
                    ETA {stop.eta}
                  </span>

                  <button
                    onClick={() => toggleFavoriteStop(stop.id)}
                    className="p-1 sm:p-1.5 hover:text-emerald-400 text-slate-400 transition"
                    title={isFav ? 'Remove bookmark' : 'Bookmark stop'}
                  >
                    <Bookmark className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
