import React, { useState } from 'react';
import {
  Truck,
  Play,
  Square,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  MapPin,
  Clock,
  ShieldAlert,
  Send,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DriverDashboard() {
  const {
    currentUser,
    buses,
    routes,
    startDriverTrip,
    endDriverTrip,
    updateDriverStatus,
    advanceNextStop,
    broadcastAlert
  } = useApp();

  const [usePhoneGps, setUsePhoneGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState('4 meters (High)');
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState('traffic');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentSuccess, setIncidentSuccess] = useState(false);

  // Driver assigned bus
  const myBus = buses.find((b) => b.number === (currentUser.assignedBus || 'Bus 03')) || buses[1];
  const myRoute = routes.find((r) => r.id === myBus.routeId) || routes[0];
  const isTripActive = myBus.status === 'On Route' || myBus.status === 'Arriving';

  // Toggle phone GPS via HTML5 Geolocation API
  const handleTogglePhoneGps = () => {
    if (!usePhoneGps) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUsePhoneGps(true);
            setGpsAccuracy(`${Math.round(position.coords.accuracy)}m`);
          },
          (err) => {
            alert('Could not access device GPS sensor. Reverting to virtual simulation telemetry.');
            setUsePhoneGps(false);
          }
        );
      } else {
        alert('Geolocation not supported on this browser.');
      }
    } else {
      setUsePhoneGps(false);
    }
  };

  const handleReportIncident = (e) => {
    e.preventDefault();
    broadcastAlert({
      title: `${myBus.number} Incident: ${incidentType.toUpperCase()}`,
      message: incidentNote || `Driver reported ${incidentType} on route ${myRoute.name}. Expect delays.`,
      severity: 'warning'
    });
    setIncidentSuccess(true);
    setTimeout(() => {
      setIncidentSuccess(false);
      setIncidentModalOpen(false);
      setIncidentNote('');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Driver Console: {currentUser.name}</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                License: {currentUser.license || 'PSV-HYD-7712'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Assigned Vehicle: <strong className="text-emerald-300">{myBus.number}</strong> ({myBus.plate}) • Route: {myRoute.name}
            </p>
          </div>
        </div>

        {/* Telemetry Status Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-[#0e241c] border border-emerald-900/60 px-2.5 py-1.5 rounded-lg text-emerald-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0e241c] border border-emerald-900/60 px-2.5 py-1.5 rounded-lg text-emerald-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>GPS: {gpsAccuracy}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Trip Controls + Live Route Waypoint Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Trip Start/End & Status Buttons */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white">Trip Controls</h3>

            {/* Trip Action Button */}
            {isTripActive ? (
              <button
                onClick={() => endDriverTrip(myBus.id)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>End Active Trip</span>
              </button>
            ) : (
              <button
                onClick={() => startDriverTrip(myBus.id)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Assigned Point Trip</span>
              </button>
            )}

            {/* Trip Status Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Current Trip Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'On Route', label: 'On Time', color: 'emerald' },
                  { id: 'Delayed', label: 'Delayed', color: 'amber' },
                  { id: 'Breakdown', label: 'Breakdown', color: 'red' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateDriverStatus(myBus.id, st.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      myBus.status === st.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-[#0e241c] text-slate-300 border-emerald-900/60 hover:bg-[#143226]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Telemetry Provider Toggle */}
            <div className="p-3 bg-[#0e241c] rounded-xl border border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Broadcast Phone GPS</span>
                <input
                  type="checkbox"
                  checked={usePhoneGps}
                  onChange={handleTogglePhoneGps}
                  className="accent-emerald-500 w-4 h-4"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                When active, your real smartphone GPS coordinates will be transmitted to students. When disabled, the university smart virtual simulation is active.
              </p>
            </div>

            {/* Report Road Incident */}
            <button
              onClick={() => setIncidentModalOpen(true)}
              className="w-full bg-[#181f18] hover:bg-[#202b20] border border-amber-900/60 text-amber-300 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Report Road Hazard / Incident</span>
            </button>
          </div>
        </div>

        {/* Right Column: Next Stop Guidance & Waypoints Checklist */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-emerald-950 gap-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Next Designated Stop
                </span>
                <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                  <span>{myBus.nextStopName}</span>
                </h4>
              </div>

              {/* Big "Mark Arrived" Button */}
              <button
                onClick={() => advanceNextStop(myBus.id)}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Arrived at Stop</span>
              </button>
            </div>

            {/* Waypoints List */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">
                Route Stops Checklist ({myRoute.stops.length} stops)
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {myRoute.stops.map((stop, idx) => {
                  const isCurrent = stop.name === myBus.nextStopName;

                  return (
                    <div
                      key={stop.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        isCurrent
                          ? 'bg-emerald-950/60 border-emerald-600 text-white font-bold ring-1 ring-emerald-500/50'
                          : 'bg-[#0e241c] border-emerald-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            isCurrent
                              ? 'bg-emerald-400 text-slate-950 font-bold'
                              : 'bg-[#153427] text-emerald-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{stop.name}</span>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold uppercase">
                          Next Stop
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">ETA {stop.eta}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Report Modal */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b1b14] border border-amber-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl">
            <h3 className="font-bold text-base text-amber-400 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <span>Report Driver Road Incident</span>
            </h3>

            {incidentSuccess ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-center text-xs">
                Incident logged and transmitted to campus dispatch office!
              </div>
            ) : (
              <form onSubmit={handleReportIncident} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Incident Category</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full bg-[#0f241c] border border-amber-900/60 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="traffic">Traffic Jam / Highway Gridlock</option>
                    <option value="roadblock">Road Blockage / Protest Diversion</option>
                    <option value="breakdown">Mechanical Engine Trouble / Flat Tire</option>
                    <option value="rush">Overcrowded Point / Overflowing Stop</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Details & Location Note</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Container placed at Jamshoro Toll plaza, taking alternate Hatri bypass route..."
                    value={incidentNote}
                    onChange={(e) => setIncidentNote(e.target.value)}
                    className="w-full bg-[#0f241c] border border-amber-900/60 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIncidentModalOpen(false)}
                    className="flex-1 bg-[#122e22] text-slate-300 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl"
                  >
                    Transmit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
