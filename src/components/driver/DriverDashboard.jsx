import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Truck,
  Play,
  Square,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
  MapPin,
  ShieldAlert,
  Users,
  Loader2,
  LocateFixed,
  Gauge,
  Compass,
  Thermometer,
  BatteryCharging,
  PhoneCall,
  Volume2,
  UserPlus,
  UserMinus,
  Clock,
  Activity,
  Send,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPointNumber } from '../../utils/routeColors';
import LeafletBusMap from '../map/LeafletBusMap';

export default function DriverDashboard() {
  const {
    currentUser,
    buses,
    routes,
    startDriverTrip,
    endDriverTrip,
    updateDriverStatus,
    advanceNextStop,
    broadcastAlert,
    authToken,
    refreshAuthToken,
    setBuses,
    theme = 'dark'
  } = useApp();

  const isLight = theme === 'light';

  // Driver assigned bus — match by driver_id or fallback to second bus
  const myBus = buses.find(b => b.driverId === currentUser.id || b.driverName === currentUser.name)
    || buses.find(b => b.number === (currentUser.assignedBus || 'Bus 03'))
    || buses[1]
    || buses[0];

  const myRoute = routes.find(r => r.id === myBus?.routeId) || routes[0];
  const isTripActive = myBus?.status === 'On Route' || myBus?.status === 'Arriving';

  // Live GPS states
  const [usePhoneGps, setUsePhoneGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'acquiring' | 'active' | 'denied' | 'error'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState('');

  // Incident reporting modal
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState('traffic');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentSuccess, setIncidentSuccess] = useState(false);

  // Live passenger headcount
  const busCapacity = Number(myBus?.capacity) || 65;
  const [passengerCount, setPassengerCount] = useState(myBus?.passengers || 44);

  // Driver instant broadcast advisory toast
  const [recentBroadcastToast, setRecentBroadcastToast] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Digital clock
  const [digitalTime, setDigitalTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Live trip elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const watchIdRef = useRef(null);
  const tokenRef = useRef(authToken);
  useEffect(() => { tokenRef.current = authToken; }, [authToken]);

  // Digital clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setDigitalTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trip elapsed timer
  useEffect(() => {
    let interval = null;
    if (isTripActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTripActive]);

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Sync passenger count to local bus object
  const handleUpdatePassengerCount = (delta) => {
    setPassengerCount(prev => {
      const next = Math.max(0, Math.min(busCapacity + 10, prev + delta));
      setBuses(bList => bList.map(b => b.id === myBus?.id ? { ...b, passengers: next } : b));
      return next;
    });
  };

  const handleResetPassengerCount = () => {
    setPassengerCount(0);
    setBuses(bList => bList.map(b => b.id === myBus?.id ? { ...b, passengers: 0 } : b));
  };

  // Quick 1-click broadcast advisory
  const handleQuickBroadcast = async (title, message, severity = 'warning') => {
    if (isBroadcasting) return;
    setIsBroadcasting(true);
    try {
      await broadcastAlert({
        title: `${myBus?.number || 'Point 03'}: ${title}`,
        message,
        type: 'delay',
        severity
      });
      setRecentBroadcastToast(`Advisory Sent: "${title}"`);
      setTimeout(() => setRecentBroadcastToast(''), 4500);
    } catch (e) {
      console.warn('Quick broadcast error:', e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Send GPS coordinates to backend
  const sendLocationToBackend = useCallback(async (lat, lng, accuracy) => {
    if (!myBus) return;
    try {
      let token = tokenRef.current || (await refreshAuthToken('Driver'));
      const res = await fetch(`/api/buses/${myBus.id}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lat, lng, accuracy })
      });
      if (res.status === 401) {
        token = await refreshAuthToken('Driver');
        if (token) {
          await fetch(`/api/buses/${myBus.id}/location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ lat, lng, accuracy })
          });
        }
      }
      // Update local bus coords too
      setBuses(prev => prev.map(b =>
        b.id === myBus.id ? { ...b, coords: [lat, lng], lastUpdate: 'Just now' } : b
      ));
    } catch (err) {
      console.warn('GPS send error:', err);
    }
  }, [myBus, refreshAuthToken, setBuses]);

  const stopWatchingGps = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUsePhoneGps(false);
    setGpsStatus('idle');
    setGpsAccuracy(null);
  }, []);

  const handleTogglePhoneGps = () => {
    if (usePhoneGps) {
      stopWatchingGps();
      return;
    }
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      setGpsStatus('error');
      return;
    }
    setGpsStatus('acquiring');
    setGpsError('');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUsePhoneGps(true);
        setGpsStatus('active');
        setGpsAccuracy(Math.round(accuracy));
        setGpsError('');
        sendLocationToBackend(latitude, longitude, accuracy);
      },
      (err) => {
        stopWatchingGps();
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsError('Location permission denied. Please allow location access in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsStatus('error');
          setGpsError('GPS signal unavailable. Falling back to simulation mode.');
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus('error');
          setGpsError('GPS timed out. Please try again.');
        } else {
          setGpsStatus('error');
          setGpsError('Could not get device location. Reverting to virtual simulation.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleManualLocationPing = () => {
    if (navigator.geolocation) {
      setGpsStatus('acquiring');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGpsStatus('active');
          setGpsAccuracy(Math.round(accuracy));
          sendLocationToBackend(latitude, longitude, accuracy);
        },
        () => {
          // Fallback location transmission for simulated or desktop testing
          const currentLat = myBus?.coords ? myBus.coords[0] : 25.4080;
          const currentLng = myBus?.coords ? myBus.coords[1] : 68.2635;
          const nextLat = currentLat + (Math.random() - 0.5) * 0.001;
          const nextLng = currentLng + (Math.random() - 0.5) * 0.001;
          sendLocationToBackend(nextLat, nextLng, 12);
          setGpsStatus('active');
          setGpsAccuracy(12);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const currentLat = myBus?.coords ? myBus.coords[0] : 25.4080;
      const currentLng = myBus?.coords ? myBus.coords[1] : 68.2635;
      sendLocationToBackend(currentLat + 0.0005, currentLng + 0.0005, 15);
      setGpsStatus('active');
      setGpsAccuracy(15);
    }
  };

  const handleReportIncident = (e) => {
    e.preventDefault();
    broadcastAlert({
      title: `${myBus?.number || 'Bus'} Incident: ${incidentType.toUpperCase()}`,
      message: incidentNote || `Driver reported ${incidentType} on route ${myRoute?.name || 'assigned route'}. Expect delays.`,
      severity: 'warning'
    });
    setIncidentSuccess(true);
    setTimeout(() => {
      setIncidentSuccess(false);
      setIncidentModalOpen(false);
      setIncidentNote('');
    }, 2000);
  };

  if (!myBus) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No bus assigned. Please contact transport administration.
      </div>
    );
  }

  const gpsStatusColor = {
    idle: isLight ? 'text-slate-500' : 'text-slate-400',
    acquiring: isLight ? 'text-amber-600' : 'text-amber-400',
    active: isLight ? 'text-[#087F5B]' : 'text-emerald-400',
    denied: 'text-red-500',
    error: 'text-red-500'
  }[gpsStatus];

  const gpsStatusLabel = {
    idle: 'Virtual Simulation Active',
    acquiring: 'Acquiring GPS Fix…',
    active: gpsAccuracy ? `Real GPS Active (±${gpsAccuracy}m)` : 'Real GPS Active',
    denied: 'GPS Denied',
    error: 'GPS Error'
  }[gpsStatus];

  // Occupancy percentage and thresholds
  const occupancyPercent = Math.min(100, Math.round((passengerCount / busCapacity) * 100));
  const occupancyColor =
    occupancyPercent > 90 ? 'bg-red-500' :
    occupancyPercent > 70 ? 'bg-amber-500' :
    isLight ? 'bg-[#087F5B]' : 'bg-emerald-400';

  const occupancyLabel =
    occupancyPercent >= 95 ? 'At Capacity / Overcrowded' :
    occupancyPercent >= 75 ? 'Moderate Seating Available' :
    'Seats Readily Available';

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      
      {/* 1. Master Driver Header Bar */}
      <div className={`rounded-2xl p-4 sm:p-5 shadow-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
        isLight
          ? 'bg-white border-[#DCE5EC] text-[#172B3A]'
          : 'bg-[#0b1b14] border-emerald-950/80 text-white'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-[#EBF4EF] border-[#B3D4C5]'
                : 'bg-emerald-500/20 border-emerald-500/40'
            }`}>
              <img
                src={currentUser?.avatar || '/images/avatars/driver.jpg'}
                alt={currentUser?.name || 'Driver'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow">
              <Truck className="w-3 h-3" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                Driver Console: {currentUser.name || 'Gul Hassan'}
              </h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-[#EBF4EF] text-[#087F5B] border-[#B3D4C5]'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                License: {currentUser.license || 'PSV-HYD-7712'}
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                Clock: {digitalTime}
              </span>
            </div>
            <p className={`text-xs mt-1 font-medium ${isLight ? 'text-[#526477]' : 'text-slate-300'}`}>
              Assigned Vehicle: <strong className={isLight ? 'text-[#087F5B]' : 'text-emerald-300'}>{formatPointNumber(myBus.number)}</strong> ({myBus.plate}) • Corridor: <strong>{myRoute?.name || 'Main Campus ➔ Tando Bago'}</strong>
            </p>
          </div>
        </div>

        {/* Telemetry Status Indicators & Emergency Contact */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <a
            href="tel:0222771234"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              isLight
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-red-950/60 text-red-300 border-red-800/60 hover:bg-red-900/60'
            }`}
            title="Emergency Radio / Dispatch Hotline"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-500" />
            <span>Dispatch: 022-2771234</span>
          </a>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-[#F4F7FA] border-[#DCE5EC] text-[#172B3A]' : 'bg-[#0e241c] border-emerald-900/60 text-emerald-300'
          }`}>
            {myBus.isOnline ? <Wifi className={`w-3.5 h-3.5 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
            <span className="font-semibold">{myBus.isOnline ? 'Fleet 4G Uplink' : 'Offline'}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${gpsStatusColor} ${
            isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#0e241c] border-emerald-900/60'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${gpsStatus === 'active' ? 'animate-pulse' : ''}`} />
            <span className="font-bold">{gpsStatusLabel}</span>
          </div>
        </div>
      </div>

      {/* GPS Error or Permission Banner */}
      {gpsError && (
        <div className="bg-red-950/80 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Broadcast Toast Banner */}
      {recentBroadcastToast && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 rounded-xl px-4 py-3 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{recentBroadcastToast}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Dispatched to Student App</span>
        </div>
      )}

      {/* 2. Full-Width Turn-by-Turn Waypoint Guidance Ribbon */}
      <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 transition ${
        isLight
          ? 'bg-gradient-to-r from-[#EBF4EF] via-white to-[#F4F7FA] border-[#B3D4C5]'
          : 'bg-gradient-to-r from-[#0d281e] via-[#0b1b14] to-[#0d221a] border-emerald-800/80'
      }`}>
        {/* Next Stop Callout */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isLight ? 'bg-[#087F5B] text-white' : 'bg-emerald-500 text-slate-950 font-black'
          }`}>
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-black uppercase tracking-wider block ${
              isLight ? 'text-[#087F5B]' : 'text-emerald-400'
            }`}>
              Immediate Target Stop
            </span>
            <h3 className={`text-lg sm:text-xl font-black truncate ${
              isLight ? 'text-[#172B3A]' : 'text-white'
            }`}>
              {myBus.nextStopName || 'Main Campus Terminal'}
            </h3>
            <span className={`text-[11px] block ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
              Corridor Point Route: {myRoute?.name || 'Hyderabad Service'}
            </span>
          </div>
        </div>

        {/* Speed Limit & Corridor Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0 text-center">
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
          }`}>
            <span className={`text-[10px] font-bold block ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Est. Distance</span>
            <span className={`font-mono text-sm sm:text-base font-extrabold ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
              450 m
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
          }`}>
            <span className={`text-[10px] font-bold block ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Road Speed</span>
            <span className={`font-mono text-sm sm:text-base font-extrabold flex items-center justify-center gap-1 ${
              isLight ? 'text-[#087F5B]' : 'text-emerald-400'
            }`}>
              <Gauge className="w-3.5 h-3.5" />
              <span>{myBus.speed || '38 km/h'}</span>
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
          }`}>
            <span className={`text-[10px] font-bold block ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Speed Limit</span>
            <span className={`font-mono text-sm sm:text-base font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              50 km/h
            </span>
          </div>
        </div>

        {/* Advance Stop Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => advanceNextStop(myBus.id)}
            className="w-full lg:w-auto bg-[#087F5B] hover:bg-[#066347] text-white font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Mark Arrived at Stop</span>
          </button>
        </div>
      </div>

      {/* 3. Main 12-Column Responsive Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols): Cockpit Map, Occupancy Hub, Student Broadcasts */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section A: Live Navigation Map & Cockpit Telemetry HUD */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl space-y-4 transition ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/80'
          }`}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b ${
              isLight ? 'border-[#E2E8F0]' : 'border-emerald-950'
            }`}>
              <div>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${
                  isLight ? 'text-[#172B3A]' : 'text-white'
                }`}>
                  <LocateFixed className={`w-4 h-4 animate-pulse ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                  <span>Real-Time GPS Map & Vehicle Telemetry</span>
                </h3>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                  Satellite positioning of {formatPointNumber(myBus.number)} on university route corridors
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualLocationPing}
                  className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition cursor-pointer border ${
                    isLight
                      ? 'bg-[#EBF4EF] text-[#087F5B] border-[#B3D4C5] hover:bg-[#d8ece2]'
                      : 'bg-[#0e241c] hover:bg-[#143226] text-emerald-300 border-emerald-800/80'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Sync GPS Telemetry</span>
                </button>
              </div>
            </div>

            {/* Live Cockpit Telemetry HUD Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>GPS Coordinates</span>
                <span className={`font-mono font-bold truncate mt-1 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`}>
                  {myBus.coords ? `${myBus.coords[0].toFixed(4)}°N, ${myBus.coords[1].toFixed(4)}°E` : '25.4080°N, 68.2635°E'}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Heading / Bearing</span>
                <span className={`font-mono font-bold mt-1 flex items-center gap-1 ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  <Compass className={`w-3.5 h-3.5 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                  <span>42° NE (Hatri)</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Satellite Precision</span>
                <span className={`font-bold mt-1 flex items-center gap-1.5 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`}>
                  <span className={`w-2 h-2 rounded-full animate-ping inline-block shrink-0 ${isLight ? 'bg-[#087F5B]' : 'bg-emerald-400'}`} />
                  <span>{gpsAccuracy ? `±${gpsAccuracy}m Lock` : 'RTK Lock (±4m)'}</span>
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Current Landmark</span>
                <span className={`font-bold truncate mt-1 ${isLight ? 'text-[#172B3A]' : 'text-slate-200'}`}>
                  {myBus.currentLocationName || 'Academic Block Gate'}
                </span>
              </div>
            </div>

            {/* Live Leaflet Bus Map for Driver — Prominent & Tall */}
            <div className={`rounded-xl overflow-hidden border shadow-inner ${
              isLight ? 'border-[#DCE5EC]' : 'border-emerald-900/60'
            }`}>
              <LeafletBusMap height="460px" focusedBusId={myBus.id} showControls={true} />
            </div>
          </div>

          {/* Section B: Live Passenger Manifest & Occupancy Telemetry */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl space-y-4 transition ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/80'
          }`}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b gap-2 ${
              isLight ? 'border-[#E2E8F0]' : 'border-emerald-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-[#EBF4EF] text-[#087F5B]' : 'bg-emerald-950 text-emerald-400'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                    Passenger Headcount & Real-Time Capacity
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                    Live occupancy meter broadcasts seating availability to students waiting at stops
                  </p>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                occupancyPercent > 90
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : occupancyPercent > 70
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : isLight
                  ? 'bg-[#EBF4EF] text-[#087F5B] border-[#B3D4C5]'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {occupancyLabel}
              </span>
            </div>

            {/* Occupancy Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isLight ? 'text-[#526477]' : 'text-slate-300'}`}>
                  Seated / Boarded Students
                </span>
                <span className={`font-mono font-bold ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  {passengerCount} / {busCapacity} Seats ({occupancyPercent}%)
                </span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${
                isLight ? 'bg-slate-200' : 'bg-slate-900'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${occupancyColor}`}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>

            {/* Boarding Counter Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleUpdatePassengerCount(1)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-[#EBF4EF] hover:bg-[#d8ece2] text-[#087F5B] border-[#B3D4C5]'
                    : 'bg-[#0e241c] hover:bg-[#143226] text-emerald-300 border-emerald-800/80'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+1 Boarded</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePassengerCount(5)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-[#EBF4EF] hover:bg-[#d8ece2] text-[#087F5B] border-[#B3D4C5]'
                    : 'bg-[#0e241c] hover:bg-[#143226] text-emerald-300 border-emerald-800/80'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>+5 Group Board</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePassengerCount(-1)}
                disabled={passengerCount <= 0}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-40 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>-1 Alighted</span>
              </button>

              <button
                type="button"
                onClick={handleResetPassengerCount}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                    : 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-900/60'
                }`}
              >
                <span>Reset Empty</span>
              </button>
            </div>
          </div>

          {/* Section C: Instant 1-Click Student Broadcast Advisories */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl space-y-3 transition ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className={`w-4 h-4 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                <h4 className={`text-sm font-bold ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  Quick Broadcast Advisories for Waiting Students
                </h4>
              </div>
              <span className={`text-[10px] ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                1-Tap Dispatches to Student Mobile App
              </span>
            </div>

            <p className={`text-xs ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
              Tap any message below while stopping to notify students along Route {myRoute?.number || '02'}:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => handleQuickBroadcast(
                  'Boarding at Stop Now',
                  `${myBus.number} is currently boarding passengers at ${myBus.nextStopName || 'current stop'}. Point departs in 2 minutes.`,
                  'info'
                )}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-[#EBF4EF] hover:bg-[#d8ece2] border-[#B3D4C5] text-[#172B3A]'
                    : 'bg-[#0e241c] hover:bg-[#143226] border-emerald-800/80 text-white'
                }`}
              >
                <Send className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                <div>
                  <strong className="text-xs block">📢 Boarding at Stop (Departing in 2m)</strong>
                  <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-[#526477]' : 'text-slate-300'}`}>
                    Notifies students at this stop to board immediately
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => handleQuickBroadcast(
                  'Traffic Gridlock at Bypass',
                  `${myBus.number} is experiencing slow traffic near Hatri/Jamshoro bypass. Estimated 5-8 min delay.`,
                  'warning'
                )}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950'
                    : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-800/60 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <strong className="text-xs block">⚠️ Highway Traffic Congestion</strong>
                  <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-amber-800' : 'text-amber-300/80'}`}>
                    Informs students of a minor 5-8 min delay
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => handleQuickBroadcast(
                  'Point at Full Seating Capacity',
                  `${myBus.number} has reached maximum safe capacity. Next university point is 8 mins behind.`,
                  'warning'
                )}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-950'
                    : 'bg-red-950/40 hover:bg-red-900/60 border-red-800/60 text-red-200'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <strong className="text-xs block">🛑 Point at Full Capacity</strong>
                  <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-red-800' : 'text-red-300/80'}`}>
                    Advises remaining students to wait for following point
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => handleQuickBroadcast(
                  'On Schedule to University',
                  `${myBus.number} is running smoothly on schedule toward Mehran University Main Gate.`,
                  'info'
                )}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-950'
                    : 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-800/60 text-blue-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <strong className="text-xs block">✅ Operating on Normal Schedule</strong>
                  <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-blue-800' : 'text-blue-300/80'}`}>
                    Reassures students with on-time green telemetry
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Trip Controls, Vehicle Diagnostics, Route Checklist, Incidents */}
        <div className="lg:col-span-4 space-y-6">

          {/* Section D: Trip Operation Controls */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl space-y-4 transition ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/80'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                Trip Controls & Operations
              </h3>
              {isTripActive && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
                  ⏱️ {formatElapsed(elapsedSeconds)}
                </span>
              )}
            </div>

            {/* Trip Action Button */}
            {isTripActive ? (
              <button
                type="button"
                onClick={() => endDriverTrip(myBus.id)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950 cursor-pointer active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>End Active University Trip</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startDriverTrip(myBus.id)}
                className="w-full bg-[#087F5B] hover:bg-[#066347] text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Assigned Point Trip</span>
              </button>
            )}

            {/* Trip Status Selector */}
            <div>
              <label className={`text-[11px] font-bold block mb-1.5 ${
                isLight ? 'text-[#526477]' : 'text-slate-400'
              }`}>
                Current Operational Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'On Route', label: 'On Time' },
                  { id: 'Delayed', label: 'Delayed' },
                  { id: 'Breakdown', label: 'Breakdown' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => updateDriverStatus(myBus.id, st.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      myBus.status === st.id
                        ? 'bg-[#087F5B] text-white border-[#087F5B] shadow-sm'
                        : isLight
                        ? 'bg-[#F4F7FA] text-slate-700 border-[#DCE5EC] hover:bg-[#E2E8F0]'
                        : 'bg-[#0e241c] text-slate-300 border-emerald-900/60 hover:bg-[#143226]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Telemetry Provider Toggle */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#0e241c] border-emerald-900/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  Broadcast Physical Phone GPS
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={usePhoneGps}
                  onClick={handleTogglePhoneGps}
                  disabled={gpsStatus === 'acquiring'}
                  className={`relative w-10 h-5 rounded-full border transition-colors ${
                    usePhoneGps
                      ? 'bg-[#087F5B] border-[#087F5B]'
                      : isLight ? 'bg-slate-300 border-slate-400' : 'bg-[#0b1b14] border-emerald-900'
                  } disabled:opacity-60 cursor-pointer`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      usePhoneGps ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                  {gpsStatus === 'acquiring' && (
                    <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-amber-400" />
                  )}
                </button>
              </div>
              <p className={`text-[10px] leading-relaxed ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                {usePhoneGps
                  ? '✅ Live smartphone GPS coordinates are being transmitted directly to campus dispatch.'
                  : 'Transmit your mobile hardware GPS coordinates to students. When disabled, the university corridor simulation runs.'}
              </p>
            </div>
          </div>

          {/* Section E: Vehicle Diagnostics & Health Telemetry (CAN-Bus / OBD Cluster) */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl space-y-3 transition ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/80'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-[#172B3A]' : 'text-slate-200'
              }`}>
                <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                <span>Vehicle Health & CAN Diagnostics</span>
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLight ? 'bg-emerald-100 text-[#087F5B]' : 'bg-emerald-950 text-emerald-400'
              }`}>
                Systems Nominal
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Thermometer className="w-3 h-3 text-emerald-400" />
                  <span>Engine Temp</span>
                </div>
                <strong className={`font-mono text-sm block mt-1 ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  88°C
                </strong>
                <span className="text-[9px] text-emerald-500 font-semibold">Optimal Range</span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <BatteryCharging className="w-3 h-3 text-emerald-400" />
                  <span>Alternator / Batt</span>
                </div>
                <strong className={`font-mono text-sm block mt-1 ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  27.8 V
                </strong>
                <span className="text-[9px] text-emerald-500 font-semibold">Charging Normal</span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <span className="text-[10px] text-slate-400 block">Diesel Fuel Level</span>
                <strong className={`font-mono text-sm block mt-1 ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  68% (~185 km)
                </strong>
                <span className="text-[9px] text-slate-400 font-semibold">Tank 160L</span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isLight ? 'bg-[#F4F7FA] border-[#DCE5EC]' : 'bg-[#07130e] border-emerald-950'
              }`}>
                <span className="text-[10px] text-slate-400 block">Tire Pressure</span>
                <strong className={`font-mono text-sm block mt-1 ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  110 PSI
                </strong>
                <span className="text-[9px] text-emerald-500 font-semibold">All 6 Wheels OK</span>
              </div>
            </div>
          </div>

          {/* Section F: Route Stops Checklist */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl space-y-3 transition ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/80'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-[#172B3A]' : 'text-slate-200'
              }`}>
                Route Stops Itinerary ({myRoute?.stops?.length || 0} stops)
              </h4>
              <span className={`text-[10px] ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                Sequential Checkpoints
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(myRoute?.stops || []).map((stop, idx) => {
                const isCurrent = stop.name === myBus.nextStopName;

                return (
                  <div
                    key={stop.id || idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      isCurrent
                        ? isLight
                          ? 'bg-[#EBF4EF] border-[#087F5B] text-[#087F5B] font-black ring-1 ring-[#087F5B]'
                          : 'bg-emerald-950/80 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                        : isLight
                        ? 'bg-[#F4F7FA] border-[#DCE5EC] text-[#172B3A]'
                        : 'bg-[#0e241c] border-emerald-900/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-[#087F5B] text-white'
                            : isLight
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-[#153427] text-emerald-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{stop.name}</span>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] bg-[#087F5B] text-white px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                        Next Stop
                      </span>
                    ) : (
                      <span className={`text-[10px] shrink-0 ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                        ETA {stop.eta}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section G: Report Incident & Hazard Button */}
          <button
            type="button"
            onClick={() => setIncidentModalOpen(true)}
            className={`w-full border font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-[#181f18] hover:bg-[#202b20] border-amber-900/60 text-amber-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Report Road Hazard / Incident to Dispatch</span>
          </button>
        </div>
      </div>

      {/* Incident Report Modal */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl ${
            isLight ? 'bg-white border-amber-300' : 'bg-[#0b1b14] border-amber-800'
          }`}>
            <h3 className="font-bold text-base text-amber-500 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <span>Report Driver Road Incident to Campus Dispatch</span>
            </h3>

            {incidentSuccess ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-center text-xs">
                Incident logged and transmitted to campus dispatch office!
              </div>
            ) : (
              <form onSubmit={handleReportIncident} className="space-y-3 text-xs">
                <div>
                  <label className={`block mb-1 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Incident Category
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-[#0f241c] border-amber-900/60 text-white'
                    }`}
                  >
                    <option value="traffic">Traffic Jam / Highway Gridlock</option>
                    <option value="roadblock">Road Blockage / Protest Diversion</option>
                    <option value="breakdown">Mechanical Engine Trouble / Flat Tire</option>
                    <option value="rush">Overcrowded Point / Overflowing Stop</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Details & Location Note
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Container placed at Jamshoro Toll plaza, taking alternate Hatri bypass route..."
                    value={incidentNote}
                    onChange={(e) => setIncidentNote(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        : 'bg-[#0f241c] border-amber-900/60 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIncidentModalOpen(false)}
                    className={`flex-1 py-2.5 rounded-xl font-bold transition ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#122e22] text-slate-300 hover:bg-[#183d2d]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer"
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
