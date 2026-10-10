import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Smartphone,
  Play,
  Pause,
  Zap,
  Sparkles,
  LogOut,
  User,
  Shield,
  Truck,
  GraduationCap,
  ExternalLink,
  QrCode,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  const {
    currentUser,
    notifications,
    unreadCount,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    isSimulationRunning,
    setIsSimulationRunning,
    simulationSpeed,
    setSimulationSpeed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsMobilePreviewOpen,
    setIsAiAssistantOpen,
    setIsQRScannerOpen,
    setIsAuthModalOpen,
    logoutUser,
    loginUser,
    setActiveTab,
    setSelectedRoute,
    routes,
    buses
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Handle Search input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matchingBuses = buses.filter(
      (b) =>
        b.number.toLowerCase().includes(query) ||
        b.routeName.toLowerCase().includes(query) ||
        b.nextStopName.toLowerCase().includes(query)
    );

    const matchingRoutes = routes.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.number.toLowerCase().includes(query) ||
        r.stops.some((s) => s.name.toLowerCase().includes(query))
    );

    setSearchResults({ buses: matchingBuses, routes: matchingRoutes });
  }, [searchQuery, buses, routes]);

  return (
    <header className="h-16 bg-[#0a1713]/90 backdrop-blur-md border-b border-emerald-950/80 px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-[#0f241c] hover:bg-[#153427] border border-emerald-900/60 text-emerald-400 focus:outline-none transition-all"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#122e22] border border-emerald-500/40 p-1 flex items-center justify-center shadow-md group-hover:border-emerald-400 transition-all shrink-0">
            <img
              src="/assets/muet_logo_seal.jpg"
              alt="MUET Seal"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              <span>MUET Point Tracker</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-400/80 tracking-wider uppercase font-semibold hidden xs:block">
              Jamshoro Transport System
            </p>
          </div>
        </div>
      </div>

      {/* Global Search Bar (Matching Mockup) */}
      <div className="relative flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-500/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a bus, route or stop..."
            className="w-full bg-[#0f241c] text-sm text-slate-200 placeholder:text-emerald-700/80 rounded-full pl-10 pr-4 py-2 border border-emerald-900/60 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchQuery && (searchResults.buses?.length > 0 || searchResults.routes?.length > 0) && (
          <div className="absolute top-11 left-0 right-0 bg-[#0c1f17] border border-emerald-800/80 rounded-xl shadow-2xl p-2 z-50 text-xs">
            {searchResults.buses?.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2">Buses</span>
                {searchResults.buses.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setActiveTab('live-tracking');
                      setSearchQuery('');
                    }}
                    className="p-2 hover:bg-[#153427] rounded-lg cursor-pointer flex items-center justify-between text-slate-200"
                  >
                    <span className="font-semibold text-emerald-300">{b.number} ({b.routeName})</span>
                    <span className="text-[11px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                      ETA {b.eta}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.routes?.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2">Routes</span>
                {searchResults.routes.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedRoute(r);
                      setSearchQuery('');
                    }}
                    className="p-2 hover:bg-[#153427] rounded-lg cursor-pointer flex items-center justify-between text-slate-200"
                  >
                    <span>{r.name}</span>
                    <span className="text-slate-400">{r.totalStops} stops</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Simulation Speed Pill */}
        <div className="hidden xl:flex items-center bg-[#0e2119] border border-emerald-900/60 rounded-full px-2 py-1 text-xs gap-1.5 text-slate-300">
          <button
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            title={isSimulationRunning ? 'Pause GPS Simulation' : 'Play GPS Simulation'}
            className="p-1 hover:text-emerald-400 transition"
          >
            {isSimulationRunning ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          <span className="text-[11px] text-slate-400">Sim:</span>
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationSpeed(speed)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                simulationSpeed === speed
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* AI Assistant Pill */}
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">MUET Point AI</span>
        </button>

        {/* Stop QR Code Modal */}
        <button
          onClick={() => setIsQRScannerOpen(true)}
          title="Scan Bus Stop QR Code"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0f241c] hover:bg-[#153427] border border-emerald-900/60 text-emerald-400 hidden sm:flex items-center justify-center transition-all shrink-0"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Mobile View Simulator Button */}
        <button
          onClick={() => setIsMobilePreviewOpen(true)}
          title="Toggle Mobile Simulator (iPhone 15 Mockup)"
          className="h-9 px-2.5 rounded-full bg-[#0f241c] hover:bg-[#153427] border border-emerald-800/80 text-emerald-300 flex items-center gap-1.5 text-xs font-medium transition-all"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="hidden lg:inline text-[11px]">Phone View</span>
        </button>

        {/* Institutional Theme Switcher */}
        <ThemeSwitcher />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen) markAllNotificationsRead();
            }}
            className="relative w-9 h-9 rounded-full bg-[#0f241c] hover:bg-[#153427] border border-emerald-900/60 flex items-center justify-center text-slate-200 transition-all"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a1713]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-[#0c1f17] border border-emerald-800 rounded-xl shadow-2xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/80 mb-2">
                <span className="font-bold text-white">Notifications ({notifications.length})</span>
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setIsNotifOpen(false);
                  }}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setActiveTab('notifications');
                      setIsNotifOpen(false);
                    }}
                    className="p-2 rounded-lg bg-[#0e241c] hover:bg-[#143226] cursor-pointer border border-emerald-950 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-semibold text-emerald-300">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Chip (Matching Mockup "ZA") */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-[#0f241c] hover:bg-[#153427] border border-emerald-800/80 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow">
              {currentUser.initials || 'ZA'}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden md:inline">
              {currentUser.name?.split(' ')[0] || 'Zainab'}
            </span>
          </button>

          {/* User Menu & Role Switcher */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-11 w-64 bg-[#0c1f17] border border-emerald-800 rounded-xl shadow-2xl p-3 z-50 text-xs">
              <div className="pb-3 border-b border-emerald-900/80 mb-2">
                <p className="font-bold text-white text-sm">{currentUser?.name}</p>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {currentUser?.role} {currentUser?.degree ? `• ${currentUser?.degree}` : ''}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentUser?.email}</p>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#153427] text-slate-200 flex items-center gap-2 cursor-pointer transition"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Profile & Settings
                </button>
                <button
                  onClick={() => {
                    logoutUser();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#153427] text-cyan-300 flex items-center gap-2 cursor-pointer transition"
                  title="Log out of current account and return to Sign In page"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Switch Account / Role
                </button>
                <button
                  onClick={() => {
                    logoutUser();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-red-950/40 text-red-400 flex items-center gap-2 cursor-pointer transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
