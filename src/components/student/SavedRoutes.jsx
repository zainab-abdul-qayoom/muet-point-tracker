import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRouteColor } from '../../utils/routeColors';

export default function SavedRoutes() {
  const { routes, favorites, toggleFavoriteRoute, setSelectedRoute, setActiveTab } = useApp();

  const savedRouteIds = favorites?.routes || [];
  const savedRoutes = routes.filter((r) => savedRouteIds.includes(r.id));

  if (savedRoutes.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 mx-auto text-emerald-500/70" />
        <p className="mt-4 text-sm text-slate-400">You have no saved routes yet.</p>
        <p className="text-xs text-slate-500 mt-2">Explore routes and click the star icon to save them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Saved Routes
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Your favorite routes are listed here for quick access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedRoutes.map((route) => {
          const color = getRouteColor(route.id);
          const isFav = true; // Already saved
          return (
            <div
              key={route.id}
              className="route-card bg-[#0b1b14] hover:bg-[#0e241c] border border-emerald-950/80 hover:border-emerald-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-full border shadow-sm"
                      style={{
                        backgroundColor: `${color.primary}20`,
                        color: color.primary,
                        borderColor: `${color.primary}50`
                      }}
                    >
                      {route.number}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteRoute(route.id);
                      }}
                      className="p-1 rounded-lg hover:bg-emerald-900/40 transition"
                      title="Remove from favorites"
                    >
                      <Star
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    </button>
                  </div>
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

              <div className="pt-4 mt-4 border-t border-emerald-950 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Hours: {route.serviceHours}</span>
                <button
                  onClick={() => {
                    setSelectedRoute(route);
                    setActiveTab('routes');
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  <span>View Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
