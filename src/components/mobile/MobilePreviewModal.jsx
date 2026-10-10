import React, { useState } from 'react';
import {
  X,
  Wifi,
  Battery,
  Bell,
  Home,
  Navigation,
  Bus,
  User,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LeafletBusMap from '../map/LeafletBusMap';

export default function MobilePreviewModal() {
  const {
    isMobilePreviewOpen,
    setIsMobilePreviewOpen,
    buses,
    routes,
    currentUser,
    setSelectedRoute
  } = useApp();

  const [mobileTab, setMobileTab] = useState('home'); // home | map | routes | profile

  if (!isMobilePreviewOpen) return null;

  const bus03 = buses.find((b) => b.number === 'Bus 03') || buses[1];
  const myRoute = routes.find((r) => r.id === bus03.routeId) || routes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative flex flex-col items-center">
        {/* Close Button Top Right */}
        <button
          onClick={() => setIsMobilePreviewOpen(false)}
          className="absolute -top-10 right-0 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs bg-[#122e22] px-3 py-1.5 rounded-full border border-emerald-800"
        >
          <X className="w-4 h-4" />
          <span>Close Mobile Preview</span>
        </button>

        {/* Smartphone Hardware Frame (iPhone 15 Pro mockup matching image) */}
        <div className="w-[calc(100vw-32px)] max-w-[360px] sm:max-w-[380px] h-[min(740px,88vh)] bg-[#07130e] border-[6px] sm:border-[8px] border-[#1a382b] rounded-[36px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-emerald-500/30">
          {/* Dynamic Island / Speaker Notch */}
          <div className="w-full h-8 bg-[#07130e] px-7 flex items-center justify-between text-[11px] text-slate-300 font-semibold pt-1 shrink-0 z-30">
            <span>9:41</span>
            <div className="w-20 h-4 bg-black rounded-full flex items-center justify-end px-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-slate-300" />
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>

          {/* Mobile App Bar */}
          <div className="h-12 bg-[#0a1713] border-b border-emerald-950 px-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 p-0.5 border border-emerald-400/40">
                <img src="/assets/muet_logo_seal.jpg" alt="MUET" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="font-bold text-xs text-white">MUET Point Tracker</span>
            </div>
            <button className="text-slate-300 relative">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="w-2 h-2 bg-red-500 rounded-full absolute -top-0.5 -right-0.5"></span>
            </button>
          </div>

          {/* Mobile Screen Content (Switches by Bottom Nav) */}
          <div className="flex-1 overflow-y-auto bg-[#07130e] relative flex flex-col">
            {mobileTab === 'home' || mobileTab === 'map' ? (
              <div className="flex-1 flex flex-col relative h-full">
                {/* Live Map viewport */}
                <div className="flex-1 min-h-[360px]">
                  <LeafletBusMap height="100%" showControls={false} />
                </div>

                {/* Floating Bottom Card matching Mockup exactly */}
                <div className="p-3 bg-gradient-to-t from-[#07130e] via-[#091811] to-transparent shrink-0">
                  <div className="bg-[#0c1f17] border border-emerald-900/80 rounded-2xl p-3.5 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          <Bus className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{bus03.number}</h4>
                          <p className="text-[10px] text-slate-400">{bus03.routeName}</p>
                        </div>
                      </div>

                      <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                        {bus03.status}
                      </span>
                    </div>

                    {/* Progress Track Line matching Mockup */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 pt-1">
                      <div className="flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="mt-0.5">Main Campus</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-emerald-600/40 mx-2"></div>
                      <div className="flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 animate-pulse"></span>
                        <span className="mt-0.5 font-bold text-emerald-300">Academic Block</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-emerald-950 mx-2"></div>
                      <div className="flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        <span className="mt-0.5">Tando Bago</span>
                      </div>
                    </div>

                    {/* Next Stop & ETA Row */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Next Stop</span>
                        <strong className="text-white text-xs">{bus03.nextStopName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">ETA</span>
                        <strong className="text-emerald-400 text-xs font-bold">{bus03.eta}</strong>
                      </div>
                    </div>

                    {/* Button matching Mockup: "View Full Route" */}
                    <button
                      onClick={() => {
                        setSelectedRoute(myRoute);
                        setIsMobilePreviewOpen(false);
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                    >
                      <span>View Full Route</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : mobileTab === 'routes' ? (
              <div className="p-3 space-y-2.5">
                <h4 className="text-xs font-bold text-white mb-2">University Point Corridors</h4>
                {routes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedRoute(r);
                      setIsMobilePreviewOpen(false);
                    }}
                    className="p-2.5 bg-[#0c1f17] border border-emerald-900/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white text-[11px]">{r.name}</p>
                      <p className="text-[10px] text-slate-400">{r.totalStops} stops • {r.estTime}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 font-bold text-xl flex items-center justify-center mx-auto">
                  {currentUser.initials || 'ZA'}
                </div>
                <h4 className="font-bold text-sm text-white">{currentUser.name}</h4>
                <p className="text-xs text-emerald-400">{currentUser.rollNo} • {currentUser.department}</p>
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation matching Mockup: [ Home | Live Map | Routes | Profile ] */}
          <div className="h-14 bg-[#0a1713] border-t border-emerald-950 px-4 flex items-center justify-around shrink-0 z-20">
            <button
              onClick={() => setMobileTab('home')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                mobileTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setMobileTab('map')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                mobileTab === 'map' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Live Map</span>
            </button>

            <button
              onClick={() => setMobileTab('routes')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                mobileTab === 'routes' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Routes</span>
            </button>

            <button
              onClick={() => setMobileTab('profile')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
                mobileTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
