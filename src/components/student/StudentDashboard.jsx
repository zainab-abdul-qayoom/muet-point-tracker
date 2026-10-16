import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Bus,
  ArrowRight,
  ChevronRight,
  Navigation,
  Star,
  Sparkles,
  Bell,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  CalendarDays,
  Zap,
  Activity,
  Users,
  TrendingUp,
  Shield,
  GraduationCap,
  Route,
  X,
  Radio,
  ChevronDown,
  ExternalLink,
  FileText,
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LeafletBusMap from '../map/LeafletBusMap';
import { getRouteColor, formatPointNumber, getPointShortNumber } from '../../utils/routeColors';

// Important campus points data
const IMPORTANT_CAMPUS_POINTS = [
  { id: 'p03', number: '03', label: 'DMS', sublabel: 'Point 03', color: '#10b981', bg: '#064e3b', lightBg: '#EBF4EF', lightColor: '#087F5B', routeId: 'route-02' },
  { id: 'p29', number: '29', label: 'Gymnasium', sublabel: 'Point 29', color: '#8b5cf6', bg: '#2e1065', lightBg: '#F5F3FF', lightColor: '#6D28D9', routeId: 'route-03' },
  { id: 'p33', number: '33', label: 'Central Library (CL)', sublabel: 'Point 33', color: '#06b6d4', bg: '#083344', lightBg: '#ECFEFF', lightColor: '#0E7490', routeId: 'route-04' },
  { id: 'p32', number: '32', label: 'Zero Point', sublabel: 'Point 32', color: '#f59e0b', bg: '#451a03', lightBg: '#FFFBEB', lightColor: '#D97706', routeId: 'route-02' }
];

// Nearby points with distance info
const NEARBY_POINTS_DATA = [
  { id: 'np1', label: 'Central Library (CL)', sublabel: 'Academic Block', dist: '1.2 km', color: '#06b6d4', icon: BookOpen },
  { id: 'np2', label: 'Gymnasium', sublabel: 'Sports Complex', dist: '1.5 km', color: '#8b5cf6', icon: Activity },
  { id: 'np3', label: 'DMS', sublabel: 'Main Campus', dist: '1.8 km', color: '#10b981', icon: Bus },
  { id: 'np4', label: 'Zero Point', sublabel: 'Main Junction', dist: '2.1 km', color: '#f59e0b', icon: MapPin },
  { id: 'np5', label: 'Central Cafeteria (CC)', sublabel: 'At Zero Point', dist: '2.1 km', color: '#ef4444', icon: Sparkles },
  { id: 'np6', label: 'CC Point Stand', sublabel: 'Cafeteria Stand', dist: '2.2 km', color: '#6366f1', icon: Navigation }
];

export default function StudentDashboard() {
  const {
    currentUser,
    theme,
    buses,
    routes,
    notifications,
    setSelectedRoute,
    setSelectedBus,
    setActiveTab,
    setIsReportIssueOpen,
    lastUpdateTime,
    favorites,
    toggleFavoriteRoute,
    isLoadingData,
    loadDataFromBackend
  } = useApp();

  const isLight = theme === 'light';

  // Derived data
  const myRoute = routes.find((r) => r.id === (currentUser?.savedRouteId || 'route-02')) || routes[0] || {};
  const bus03 = buses.find((b) => b.number === 'Bus 03' || b.number === 'Point 03') || buses[0] || {};
  const route02Info = getRouteColor(myRoute?.id || 'route-02');
  const runningBusesCount = buses.filter((b) => b.isOnline && b.status !== 'Maintenance' && b.status !== 'Inactive').length;
  const recentNotifs = (notifications || []).slice(0, 4);
  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  // Route stops for progress display
  const routeStops = [
    { name: 'Tando Bago', sublabel: 'Start', done: true },
    { name: 'DMS', sublabel: 'Point 32', done: true },
    { name: 'Zero Point', sublabel: 'Point 33', done: true },
    { name: 'CC', sublabel: 'Point 29', done: false },
    { name: 'Point 03', sublabel: 'Next Stop', done: false, isNext: true }
  ];

  // Route filter state
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('route-02');
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);

  const studentName = currentUser?.name || 'oawn';
  const firstNameOnly = studentName.split(' ')[0] || 'oawn';
  const studentInitials = currentUser?.initials || (studentName ? studentName.trim().charAt(0).toUpperCase() : 'O');
  const rollNo = currentUser?.rollNo || currentUser?.roll_no || '25MTE033';
  const department = currentUser?.department || 'Mechatronics Engineering';

  // Greeting by time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : 'Good Evening,';

  // Notification severity icon
  const getNotifIcon = (n) => {
    if (n.severity === 'critical' || n.category === 'emergency') return { icon: AlertCircle, color: 'text-red-500' };
    if (n.severity === 'warning' || n.category === 'delay') return { icon: Clock, color: 'text-amber-500' };
    if (n.category === 'broadcast') return { icon: Radio, color: 'text-blue-500' };
    return { icon: Bell, color: 'text-emerald-500' };
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} day ago`;
  };

  if (isLoadingData) {
    return (
      <div className="space-y-4 animate-pulse pb-6">
        <div className={`h-28 rounded-2xl border ${isLight ? 'bg-[#EBF0F5] border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/60'}`} />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className={`xl:col-span-3 h-[500px] rounded-2xl border ${isLight ? 'bg-[#EBF0F5] border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/60'}`} />
          <div className={`h-[500px] rounded-2xl border ${isLight ? 'bg-[#EBF0F5] border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-950/60'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-14 md:pb-4">

      {/* ══════════════════════════════════════════════════════════
          COMPACT WELCOME STRIP — student identity + MUET gate image
          ══════════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden shadow-lg relative ${
        isLight
          ? 'bg-white border-[#DCE5EC]'
          : 'bg-[#0b1b14] border-emerald-900/60'
      }`}>
        {/* MUET Gate Background Image with gentle transparency */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <img
            src="/images/muet-gate-welcome.jpg"
            alt="MUET Gate"
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-full sm:w-3/4 md:w-3/5 lg:w-1/2 object-cover object-center pointer-events-none"
            style={{ opacity: isLight ? 0.32 : 0.42 }}
            onError={(e) => {
              // Fallback to background path if needed
              if (e.target.src.indexOf('muet-gate-welcome.jpg') !== -1) {
                e.target.src = '/images/muet-gate-background.jpg';
              }
            }}
          />
          {/* Smooth contrast gradient overlay */}
          <div className={`absolute inset-0 pointer-events-none ${
            isLight
              ? 'bg-gradient-to-r from-white via-white/85 to-transparent'
              : 'bg-gradient-to-r from-[#0b1b14] via-[#0b1b14]/85 to-transparent'
          }`} />
        </div>

        <div className="relative z-10 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Identity */}
          <div className="flex items-center gap-3">
            {/* Round MUET crest logo badge */}
            <div className={`w-12 h-12 rounded-full p-1 flex items-center justify-center shadow-lg shrink-0 border ${
              isLight
                ? 'bg-white border-[#DCE5EC]'
                : 'bg-[#0f2a1e] border-emerald-500/40'
            }`}>
              <img
                src="/assets/muet_logo_seal.jpg"
                alt="MUET Seal"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                {greeting}
              </p>
              <h2 className={`text-lg sm:text-xl font-black tracking-tight leading-tight ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                {currentUser?.name || studentName}
              </h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-lg ${
                  isLight ? 'bg-[#EBF4EF] text-[#087F5B]' : 'bg-emerald-950 text-emerald-300'
                }`}>Roll No: {currentUser?.rollNo || currentUser?.roll_no || rollNo}</span>
                <span className={`text-[11px] font-semibold truncate max-w-[180px] ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                  | {currentUser?.department || department}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Key metrics strip */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Next Stop */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm ${
              isLight ? 'bg-[#F4F7FA]/90 border-[#DCE5EC]' : 'bg-[#0f241c]/90 border-emerald-900/60'
            }`}>
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
              <div>
                <p className={`text-[9px] uppercase font-bold tracking-wider ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Next Stop</p>
                <p className={`text-xs font-black ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  {formatPointNumber(bus03.number) || 'Point 03'}
                </p>
              </div>
            </div>

            {/* ETA */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm ${
              isLight ? 'bg-[#F4F7FA]/90 border-[#DCE5EC]' : 'bg-[#0f241c]/90 border-emerald-900/60'
            }`}>
              <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
              <div>
                <p className={`text-[9px] uppercase font-bold tracking-wider ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>ETA</p>
                <p className={`text-xs font-black ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  {bus03.eta || '5 min'}
                </p>
              </div>
            </div>

            {/* On Route */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm ${
              isLight ? 'bg-[#F4F7FA]/90 border-[#DCE5EC]' : 'bg-[#0f241c]/90 border-emerald-900/60'
            }`}>
              <Bus className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
              <div>
                <p className={`text-[9px] uppercase font-bold tracking-wider ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>On Route</p>
                <p className={`text-xs font-black ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                  {myRoute?.number || 'Route 02'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Tagline + status */}
          <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 z-10 backdrop-blur-[1px]">
            <p className={`text-sm font-black tracking-wide ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Safe Rides</p>
            <p className={`text-xs font-bold ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`}>Better Journeys</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className={`text-[10px] font-semibold tracking-wide ${isLight ? 'text-[#526477]' : 'text-slate-300'}`}>
                🛡️ MUET Transport System
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN 3-COLUMN LAYOUT: Map (wide) | Right Sidebar
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">

        {/* ─── MAP SECTION (3 cols) ─── */}
        <div className="xl:col-span-3 space-y-3">

          {/* Map Card with Integrated Live Trip Info Panel */}
          <div className={`rounded-2xl border shadow-lg overflow-hidden ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-900/60'
          }`}>
            {/* Map Header */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
              isLight ? 'border-[#DCE5EC]' : 'border-emerald-950/60'
            }`}>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Live Point Tracking</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Route filter dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                      isLight
                        ? 'bg-[#F4F7FA] border-[#DCE5EC] text-[#172B3A] hover:bg-[#EBF0F5]'
                        : 'bg-[#0f241c] border-emerald-900/60 text-white hover:bg-[#153427]'
                    }`}
                  >
                    <span>{routes.find(r => r.id === selectedRouteFilter)?.number || 'Route 02'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {isRouteDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-50 border text-xs overflow-hidden ${
                      isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0c1f17] border-emerald-800'
                    }`}>
                      {routes.map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedRouteFilter(r.id); setIsRouteDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 transition font-medium ${
                            selectedRouteFilter === r.id
                              ? isLight ? 'bg-[#EBF4EF] text-[#087F5B]' : 'bg-emerald-900/40 text-emerald-300'
                              : isLight ? 'text-[#172B3A] hover:bg-[#F4F7FA]' : 'text-slate-300 hover:bg-[#153427]'
                          }`}
                        >
                          {r.number} — {r.name?.split('➔')[1]?.trim() || r.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('live-tracking')}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition cursor-pointer"
                >
                  <span className="hidden sm:inline">View Full Map</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Map Body: Full-width live map */}
            <div className="relative">
              {/* Floating route badge on map top-left */}
              <div className="absolute top-3 left-12 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c2419]/90 backdrop-blur-md border border-emerald-800/80 shadow-lg text-xs">
                <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bus className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-black text-white">{myRoute?.number || 'Route 02'}</span>
                  <span className="text-[10px] text-slate-300 ml-1.5 font-medium">{myRoute?.name || 'Tando Bago ➔ Main Campus'}</span>
                </div>
              </div>

              <LeafletBusMap height="440px" />
            </div>

            {/* Map Legend */}
            <div className={`flex items-center gap-3 flex-wrap px-4 py-2 border-t text-[10px] font-semibold ${
              isLight ? 'border-[#DCE5EC] text-[#526477]' : 'border-emerald-950/60 text-slate-400'
            }`}>
              {[
                { color: '#10b981', label: 'Route 02' },
                { color: '#8b5cf6', label: 'Route 03' },
                { color: '#f59e0b', label: 'Route 04' },
                { color: '#3b82f6', label: 'Bus (Live)' },
                { color: '#64748b', label: 'Stop' },
                { color: '#f59e0b', label: 'Important Point' }
              ].map(item => (
                <span key={item.label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Row: Your Route + Recent Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Your Route Progress */}
            <div className={`rounded-2xl border shadow-md p-4 ${
              isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-900/60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Route className={`w-4 h-4 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                  <h3 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Your Route</h3>
                </div>
                <button
                  onClick={() => setActiveTab('routes')}
                  className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Active Route Badge */}
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-xl border ${
                isLight ? 'bg-[#EBF4EF] border-[#B3D4C5]' : 'bg-emerald-950/40 border-emerald-800/60'
              }`}>
                <div className="flex items-center gap-2">
                  <Bus className={`w-4 h-4 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                  <span className={`text-xs font-bold ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
                    {myRoute?.number || 'Route 02'}
                  </span>
                  <span className={`text-[11px] truncate ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                    {myRoute?.name || 'Tando Bago → Main Campus'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                  Active
                </span>
              </div>

              {/* Route Progress Stops */}
              <div className="flex items-end justify-between gap-1">
                {routeStops.map((stop, i) => (
                  <div key={stop.name} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div className={`w-full h-1 rounded-full ${
                      stop.done
                        ? 'bg-emerald-500'
                        : stop.isNext
                        ? 'bg-emerald-500/50'
                        : isLight ? 'bg-[#DCE5EC]' : 'bg-slate-700'
                    } ${i === 0 ? 'rounded-l-full' : ''} ${i === routeStops.length - 1 ? 'rounded-r-full' : ''}`} />
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition ${
                      stop.done
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : stop.isNext
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md animate-pulse'
                        : isLight
                        ? 'bg-[#EBF0F5] border-[#DCE5EC] text-[#526477]'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}>
                      {stop.isNext ? <Bus className="w-3.5 h-3.5" /> : (stop.done ? '✓' : i + 1)}
                    </div>
                    <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${
                      stop.isNext
                        ? 'text-emerald-400'
                        : isLight ? 'text-[#526477]' : 'text-slate-300'
                    }`}>{stop.name}</span>
                    <span className={`text-[9px] text-center truncate w-full ${isLight ? 'text-[#8FA3B3]' : 'text-slate-500'}`}>
                      {stop.sublabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Notifications */}
            <div className={`rounded-2xl border shadow-md p-4 ${
              isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-900/60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                  <h3 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Recent Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'notif-demo-1', title: 'New broadcast alert from Admin', message: 'All scheduled point corridors operating on time.', time: '15 min ago', icon: Radio, color: 'text-purple-400' },
                  { id: 'notif-demo-2', title: 'Your bus is 4 minutes away from Point 03', message: 'Bus 03 approaching Academic Block main stand.', time: '28 min ago', icon: Bus, color: 'text-blue-400' },
                  { id: 'notif-demo-3', title: 'Route 02 is delayed by 10 minutes', message: 'Road repair works reported near Jamshoro Bypass.', time: '1 hour ago', icon: AlertCircle, color: 'text-red-400' },
                  { id: 'notif-demo-4', title: 'New message from Driver', message: 'Boarding started at Main Campus portico.', time: '2 hours ago', icon: MessageCircle, color: 'text-amber-400' }
                ].map((n) => {
                  const IconComp = n.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setActiveTab('notifications')}
                      className={`w-full text-left flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer ${
                        isLight
                          ? 'hover:bg-[#F4F7FA] border border-transparent hover:border-[#DCE5EC]'
                          : 'hover:bg-[#0f241c] border border-transparent hover:border-emerald-950'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center shrink-0 mt-0.5">
                        <IconComp className={`w-3.5 h-3.5 ${n.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold line-clamp-1 ${isLight ? 'text-[#172B3A]' : 'text-slate-200'}`}>
                          {n.title}
                        </p>
                        <p className={`text-[10px] line-clamp-1 ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                          {n.message}
                        </p>
                      </div>
                      <span className={`text-[9px] shrink-0 whitespace-nowrap ${isLight ? 'text-[#8FA3B3]' : 'text-slate-400'}`}>
                        {n.time}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR (1 col) ─── */}
        <div className="xl:col-span-1 space-y-3">

          {/* 1. Important Campus Points */}
          <div className={`rounded-2xl border shadow-md p-4 ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-900/60'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Important Campus Points</h3>
              </div>
              <button
                onClick={() => setActiveTab('routes')}
                className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {IMPORTANT_CAMPUS_POINTS.map((point) => {
                const bg = isLight ? point.lightBg : point.bg;
                const textColor = isLight ? point.lightColor : point.color;
                return (
                  <button
                    key={point.id}
                    onClick={() => {
                      const r = routes.find(x => x.id === point.routeId);
                      if (r) { setSelectedRoute(r); }
                      setActiveTab('routes');
                    }}
                    className={`relative p-3 rounded-xl text-left transition group cursor-pointer border ${
                      isLight ? 'hover:shadow-md border-[#DCE5EC] hover:border-[#C3D0DA]' : 'hover:brightness-110 border-white/5'
                    }`}
                    style={{ backgroundColor: bg, borderColor: isLight ? undefined : point.color + '33' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-lg font-black leading-none"
                        style={{ color: textColor }}
                      >
                        {point.number}
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition" style={{ color: textColor }} />
                    </div>
                    <p className="text-xs font-bold leading-tight truncate" style={{ color: textColor }}>
                      {point.label}
                    </p>
                    <p className="text-[10px] opacity-70 font-semibold mt-0.5" style={{ color: textColor }}>
                      {point.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Nearby Points */}
          <div className={`rounded-2xl border shadow-md p-4 ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-900/60'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className={`w-4 h-4 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
                <h3 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Nearby Points</h3>
              </div>
              <button
                onClick={() => setActiveTab('routes')}
                className="text-[11px] text-emerald-500 font-semibold flex items-center gap-0.5"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {NEARBY_POINTS_DATA.map((point) => {
                const IconComp = point.icon;
                return (
                  <button
                    key={point.id}
                    onClick={() => setActiveTab('live-tracking')}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                      isLight
                        ? 'hover:bg-[#F4F7FA] border border-transparent hover:border-[#DCE5EC]'
                        : 'hover:bg-[#0f241c] border border-transparent hover:border-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: point.color + '22', border: `1px solid ${point.color}44` }}
                      >
                        <IconComp className="w-3.5 h-3.5" style={{ color: point.color }} />
                      </div>
                      <div className="text-left">
                        <p className={`text-[11px] font-bold leading-tight ${isLight ? 'text-[#172B3A]' : 'text-slate-200'}`}>
                          {point.label}
                        </p>
                        <p className={`text-[10px] ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                          {point.sublabel}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold shrink-0 ${isLight ? 'text-[#526477]' : 'text-slate-300'}`}>
                      {point.dist}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Quick Actions */}
          <div className={`rounded-2xl border shadow-md p-4 ${
            isLight ? 'bg-white border-[#DCE5EC]' : 'bg-[#0b1b14] border-emerald-900/60'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-4 h-4 ${isLight ? 'text-[#087F5B]' : 'text-emerald-400'}`} />
              <h3 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Report Issue', icon: AlertCircle, color: '#f59e0b', action: () => setIsReportIssueOpen(true) },
                { label: 'Saved Routes', icon: Star, color: '#8b5cf6', action: () => setActiveTab('saved-routes') },
                { label: 'View Timetable', icon: CalendarDays, color: '#06b6d4', action: () => setActiveTab('schedule') },
                { label: 'Academic Docs', icon: FileText, color: '#10b981', action: () => setActiveTab('academic-docs') }
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer text-left ${
                      isLight
                        ? 'bg-[#F4F7FA] border-[#DCE5EC] hover:bg-[#EBF0F5] hover:border-[#C3D0DA]'
                        : 'bg-[#0f241c] border-emerald-900/60 hover:bg-[#153427]'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.color + '22', border: `1px solid ${item.color}44` }}
                    >
                      <ItemIcon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <span className={`text-[11px] font-semibold leading-tight ${isLight ? 'text-[#172B3A]' : 'text-slate-200'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
