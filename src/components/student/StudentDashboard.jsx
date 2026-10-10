import React from 'react';
import {
  Bus,
  Clock,
  MapPin,
  Navigation,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LeafletBusMap from '../map/LeafletBusMap';

export default function StudentDashboard() {
  const {
    currentUser,
    buses,
    routes,
    setSelectedRoute,
    setSelectedBus,
    setActiveTab,
    lastUpdateTime
  } = useApp();

  // Find saved route & next bus
  const myRoute = routes.find((r) => r.id === (currentUser.savedRouteId || 'route-02')) || routes[0];
  const bus03 = buses.find((b) => b.number === 'Bus 03') || buses[0];

  // Active buses count
  const runningBusesCount = buses.filter((b) => b.isOnline && b.status !== 'Maintenance' && b.status !== 'Inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Campus Alert Banner */}
      <div className="bg-gradient-to-r from-[#0d2a1e] via-[#103828] to-[#0c231a] border border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Bus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Salam, {currentUser.name?.split(' ')[0] || 'Zainab'}!</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                {myRoute.number} Active
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Live tracking is operational. All 5 university point corridors are currently in transit.
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedRoute(myRoute)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center gap-1.5 shrink-0"
        >
          <span>View My Schedule</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: Left Map (approx 2/3) + Right Nearby Buses (approx 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Map Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-4 shadow-xl">
            {/* Map Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-bold text-sm sm:text-base text-white">Live Bus Tracking</h3>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • Updated {lastUpdateTime ? `${Math.floor((new Date() - lastUpdateTime) / 1000)}s ago` : '2 min ago'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('live-tracking')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
                >
                  <span>Fullscreen View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Leaflet Bus Map */}
            <LeafletBusMap height="390px" />
          </div>

          {/* Bottom Quick Info strip matching Mockup exactly */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Next Bus */}
            <div className="stat-card bg-[#0f241c] border border-emerald-900/60 rounded-xl p-3.5 shadow-md flex flex-col justify-between hover:border-emerald-700/60 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Bus className="w-4 h-4 text-emerald-400" />
                <span>Next Bus</span>
              </div>
              <div>
                <p className="text-base font-bold text-white">{bus03.number}</p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> ETA {bus03.eta}
                </p>
              </div>
            </div>

            {/* Card 2: Your Route */}
            <div className="stat-card bg-[#0f241c] border border-emerald-900/60 rounded-xl p-3.5 shadow-md flex flex-col justify-between hover:border-emerald-700/60 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Your Route</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white truncate">{myRoute.name}</p>
                <button
                  onClick={() => setSelectedRoute(myRoute)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 mt-1"
                >
                  <span>View Route</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Card 3: Nearest Stop */}
            <div className="stat-card bg-[#0f241c] border border-emerald-900/60 rounded-xl p-3.5 shadow-md flex flex-col justify-between hover:border-emerald-700/60 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Nearest Stop</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white truncate">{currentUser.nearestStop || 'Academic Block'}</p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span>{currentUser.walkTime || '2 min walk'}</span>
                </p>
              </div>
            </div>

            {/* Card 4: Total Buses */}
            <div className="stat-card bg-[#0f241c] border border-emerald-900/60 rounded-xl p-3.5 shadow-md flex flex-col justify-between hover:border-emerald-700/60 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Total Buses</span>
              </div>
              <div>
                <p className="text-base font-bold text-white">{buses.length}</p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{runningBusesCount} Running</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Nearby Buses List matching Mockup */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/80 mb-3">
              <h3 className="font-bold text-base text-white">Nearby Buses</h3>
              <button
                onClick={() => setActiveTab('routes')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Bus Cards List */}
            <div className="space-y-3">
              {buses.slice(0, 5).map((bus) => {
                const isArriving = bus.status === 'Arriving';
                const isPurple = bus.badgeType === 'purple';
                const isOrange = bus.badgeType === 'orange';
                const isCyan = bus.badgeType === 'cyan';

                let badgeClass = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                if (isPurple) badgeClass = 'bg-purple-950 text-purple-300 border-purple-800';
                if (isOrange) badgeClass = 'bg-orange-950 text-orange-300 border-orange-800';
                if (isCyan) badgeClass = 'bg-cyan-950 text-cyan-300 border-cyan-800';

                return (
                  <div
                    key={bus.id}
                    onClick={() => {
                      setSelectedBus(bus);
                      const r = routes.find((x) => x.id === bus.routeId);
                      if (r) setSelectedRoute(r);
                    }}
                    className="p-3 bg-[#0f241c] hover:bg-[#153427] border border-emerald-900/60 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isPurple
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                            : isOrange
                            ? 'bg-orange-900/40 text-orange-300 border border-orange-700/50'
                            : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                        }`}
                      >
                        <Bus className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                            {bus.number}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate max-w-[150px]">
                          {bus.routeName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-slate-200">
                        {bus.eta}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}
                      >
                        {bus.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Action Widget: Bus Crowding Recommendation */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-[#122b20] to-[#0c1f17] border border-emerald-800/60 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Commute Tip</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Bus 03 to Tando Bago has comfortable seating (48/65 seats). Catch it from Academic Block in 4 minutes for a guaranteed seat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
