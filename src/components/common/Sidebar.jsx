import React from 'react';
import {
  Home,
  Navigation,
  Bus,
  MapPin,
  Calendar,
  Bell,
  LogOut,
  Shield,
  Truck,
  MessageSquareWarning,
  Sparkles,
  Star,
  Route,
  Radio,
  BookOpen,
  User,
  MessageCircle,
  BookMarked
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Section label
function SectionLabel({ label }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-[0.14em] select-none sidebar-section-label">
        {label}
      </span>
    </div>
  );
}

// Nav button
function NavButton({ item, isActive, onClick, theme }) {
  const isLight = theme === 'light';
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-[13px] transition-all text-left group ${
        isActive
          ? isLight
            ? 'bg-[#1769E0] text-white shadow-md border-l-2 border-blue-300'
            : 'bg-emerald-600/90 text-white shadow shadow-emerald-950/60 border-l-2 border-emerald-400'
          : isLight
          ? 'text-[#526477] hover:bg-[#EBF0F5] hover:text-[#172B3A] border-l-2 border-transparent'
          : 'text-slate-400 hover:bg-[#0f2a1e] hover:text-emerald-100 border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={`shrink-0 transition-colors ${
            isActive
              ? 'text-white'
              : isLight
              ? 'text-[#526477] group-hover:text-[#087F5B]'
              : 'text-emerald-500/70 group-hover:text-emerald-400'
          }`}
          style={{ width: 17, height: 17 }}
        />
        <span className="truncate">{item.label}</span>
      </div>
      {item.badge > 0 && (
        <span className="ml-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 px-1">
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ onItemClick }) {
  const {
    currentUser,
    theme,
    activeTab,
    setActiveTab,
    unreadCount,
    logoutUser,
    setIsReportIssueOpen,
    setIsAiAssistantOpen
  } = useApp();

  const isLight = theme === 'light';
  const isDriver = currentUser?.role === 'Driver';
  const isAdmin = currentUser?.role === 'Admin';

  const handleNav = (id) => {
    setActiveTab(id);
    if (onItemClick) onItemClick();
  };

  // Student sections — matches reference image navigation order
  const studentSections = [
    {
      label: 'Navigation',
      items: [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'live-tracking', label: 'Live Tracking', icon: Navigation },
        { id: 'routes', label: 'Point Routes', icon: Bus },
        { id: 'schedule', label: 'Timetable', icon: Calendar },
        { id: 'my-stops', label: 'My Stops', icon: MapPin },
        { id: 'saved-routes', label: 'Saved Routes', icon: Star },
      ]
    },
    {
      label: 'My Transport',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { id: 'report-issue', label: 'Report Issue', icon: MessageSquareWarning },
        { id: 'academic-docs', label: 'Academic Docs', icon: BookOpen },
      ]
    },
    {
      label: 'AI & Tools',
      items: [
        { id: 'ai-assistant', label: 'MyMuetien AI', icon: Sparkles },
        { id: 'chatbot', label: 'Chatbot', icon: MessageCircle },
      ]
    }
  ];

  // Driver sections
  const driverSections = [
    {
      label: 'My Shift',
      items: [
        { id: 'driver-trip', label: 'Live Trip & GPS', icon: Truck },
        { id: 'routes', label: 'Route Stops Map', icon: Bus },
        { id: 'schedule', label: 'Point Timetable', icon: Calendar },
      ]
    },
    {
      label: 'Alerts',
      items: [
        { id: 'notifications', label: 'Alerts & Messages', icon: Bell, badge: unreadCount },
        { id: 'report-issue', label: 'Report Issue', icon: MessageSquareWarning },
      ]
    }
  ];

  // Admin sections
  const adminSections = [
    {
      label: 'Fleet',
      items: [
        { id: 'admin-fleet', label: 'Fleet Overview', icon: Shield },
        { id: 'live-tracking', label: 'Live Dispatch Map', icon: Navigation },
        { id: 'routes', label: 'Routes & Stops', icon: Route },
        { id: 'schedule', label: 'Timetable', icon: Calendar },
      ]
    },
    {
      label: 'Management',
      items: [
        { id: 'notifications', label: 'Broadcast Alerts', icon: Radio, badge: unreadCount },
      ]
    }
  ];

  const sections = isDriver ? driverSections : isAdmin ? adminSections : studentSections;

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : currentUser?.initials || '?';

  const rollDisplay = currentUser?.rollNo || currentUser?.roll_no || '';

  return (
    <aside className={`w-full md:w-60 flex flex-col shrink-0 min-h-full md:min-h-[calc(100vh-4rem)] border-r ${
      isLight
        ? 'bg-white border-[#DCE5EC]'
        : 'bg-[#091510] border-emerald-950/70'
    }`}>
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0">
        {sections.map((section, sIdx) => (
          <div key={section.label}>
            {sIdx > 0 && (
              <div className={`mx-3 my-1.5 h-px ${isLight ? 'bg-[#DCE5EC]' : 'bg-emerald-950/70'}`} />
            )}
            <div className="px-3 pt-3 pb-1">
              <span className={`text-[10px] font-bold uppercase tracking-[0.14em] select-none ${
                isLight ? 'text-[#087F5B]/80' : 'text-emerald-600/70'
              }`}>
                {section.label}
              </span>
            </div>
            <div className="px-2 space-y-0.5">
              {section.items.map((item) => {
                // Handle special action items
                if (item.id === 'report-issue') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setIsReportIssueOpen(true); if (onItemClick) onItemClick(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all text-left border-l-2 border-transparent group ${
                        isLight
                          ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                          : 'text-amber-300/80 hover:bg-[#1a1e0e] hover:text-amber-200'
                      }`}
                    >
                      <item.icon style={{ width: 17, height: 17 }} className="shrink-0 text-amber-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                }
                if (item.id === 'ai-assistant') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setIsAiAssistantOpen(true); if (onItemClick) onItemClick(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all text-left border-l-2 border-transparent group ${
                        isLight
                          ? 'text-violet-700 hover:bg-violet-50 hover:text-violet-800'
                          : 'text-violet-300/80 hover:bg-[#15102a] hover:text-violet-200'
                      }`}
                    >
                      <item.icon style={{ width: 17, height: 17 }} className="shrink-0 text-violet-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                }
                if (item.id === 'chatbot') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setIsAiAssistantOpen(true); if (onItemClick) onItemClick(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all text-left border-l-2 border-transparent group ${
                        isLight
                          ? 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                          : 'text-blue-300/80 hover:bg-[#101528] hover:text-blue-200'
                      }`}
                    >
                      <item.icon style={{ width: 17, height: 17 }} className="shrink-0 text-blue-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                }
                return (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    onClick={() => handleNav(item.id)}
                    theme={theme}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* MUET Jamshoro branding footer — matches reference image */}
      <div className={`border-t p-4 shrink-0 ${isLight ? 'border-[#DCE5EC]' : 'border-emerald-950/70'}`}>
        {/* Campus architectural line-art illustration matching reference image */}
        <div className="px-2 mb-2.5 opacity-65 hover:opacity-100 transition">
          <svg viewBox="0 0 160 50" className="w-full h-auto text-emerald-500 stroke-current fill-none stroke-[1.2]" strokeLinecap="round" strokeLinejoin="round">
            {/* Clock tower / central dome */}
            <path d="M75 5 L80 1 L85 5 L85 18 L75 18 Z" />
            <circle cx="80" cy="10" r="2.5" />
            <path d="M73 18 L87 18 L87 48 L73 48 Z" />
            <path d="M76 25 L84 25 M76 32 L84 32 M76 39 L84 39" />
            {/* Left wing with colonnade */}
            <path d="M40 22 L73 22 L73 48 L40 48 Z" />
            <path d="M44 26 L48 26 L48 44 L44 44 Z M52 26 L56 26 L56 44 L52 44 Z M60 26 L64 26 L64 44 L60 44 Z M68 26 L72 26 L72 44 L68 44 Z" />
            {/* Right wing with colonnade */}
            <path d="M87 22 L120 22 L120 48 L87 48 Z" />
            <path d="M91 26 L95 26 L95 44 L91 44 Z M99 26 L103 26 L103 44 L99 44 Z M107 26 L111 26 L111 44 L107 44 Z M115 26 L119 26 L119 44 L115 44 Z" />
            {/* Outer pavilions */}
            <path d="M22 28 L40 28 L40 48 L22 48 Z M28 20 L34 20 L40 28 L22 28 Z" />
            <path d="M120 28 L138 28 L138 48 L120 48 Z M126 20 L132 20 L138 28 L120 28 Z" />
            {/* Ground line */}
            <line x1="10" y1="48" x2="150" y2="48" strokeWidth="1.5" />
          </svg>
        </div>

        {/* MUET Seal + Info */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-9 h-9 rounded-xl p-1 flex items-center justify-center shrink-0 border ${
            isLight ? 'bg-[#EBF4EF] border-[#B3D4C5]' : 'bg-[#0f2a1e] border-emerald-800/60'
          }`}>
            <img
              src="/assets/muet_logo_seal.jpg"
              alt="MUET"
              className="w-full h-full rounded-lg object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-black tracking-tight truncate ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
              MUET Jamshoro
            </p>
            <p className={`text-[10px] ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
              Learn · Grow · Explore
            </p>
          </div>
        </div>

        {/* User info + logout */}
        <div className={`flex items-center gap-2 pt-2.5 border-t ${isLight ? 'border-[#DCE5EC]' : 'border-emerald-950/70'}`}>
          <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 select-none overflow-hidden ${
            isLight ? 'bg-[#087F5B] text-white' : 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
          }`}>
            <img
              src={currentUser?.avatar || (currentUser?.role === 'Driver' ? '/images/avatars/driver.jpg' : currentUser?.role === 'Admin' ? '/images/avatars/admin.jpg' : '/images/avatars/student-female.jpg')}
              alt={currentUser?.name || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.parentElement) e.target.parentElement.innerText = initials;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-semibold truncate ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>
              {currentUser?.name || 'User'}
            </p>
            <p className={`text-[10px] truncate ${isLight ? 'text-[#526477]' : 'text-emerald-400/70'}`}>
              {currentUser?.role}{rollDisplay ? ` · ${rollDisplay}` : ''}
            </p>
          </div>
          <button
            onClick={logoutUser}
            title="Log Out"
            className={`p-1.5 rounded-lg transition shrink-0 ${
              isLight
                ? 'text-[#526477] hover:text-red-600 hover:bg-red-50'
                : 'text-slate-500 hover:text-red-400 hover:bg-red-950/30'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
