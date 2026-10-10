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
  BookOpen,
  MessageSquareWarning,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ onItemClick }) {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    unreadCount,
    logoutUser,
    setIsReportIssueOpen,
    setIsAiAssistantOpen
  } = useApp();

  const isStudent = currentUser?.role === 'Student';
  const isDriver = currentUser?.role === 'Driver';
  const isAdmin = currentUser?.role === 'Admin';

  const studentNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'live-tracking', label: 'Live Tracking', icon: Navigation },
    { id: 'routes', label: 'Bus Routes', icon: Bus },
    { id: 'my-stops', label: 'My Stops', icon: MapPin },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'academic', label: 'Academic & SE Docs', icon: BookOpen, tag: 'Viva Prep' }
  ];

  const driverNavItems = [
    { id: 'driver-trip', label: 'Live Trip & GPS', icon: Truck },
    { id: 'routes', label: 'Route Stops Map', icon: Bus },
    { id: 'schedule', label: 'Bus Timetable', icon: Calendar },
    { id: 'notifications', label: 'Alerts & Messages', icon: Bell, badge: unreadCount },
    { id: 'academic', label: 'System SRS & Docs', icon: BookOpen }
  ];

  const adminNavItems = [
    { id: 'admin-fleet', label: 'Admin Fleet Overview', icon: Shield },
    { id: 'live-tracking', label: 'Live Dispatch Map', icon: Navigation },
    { id: 'routes', label: 'Manage Routes & Stops', icon: Bus },
    { id: 'schedule', label: 'Timetable Schedules', icon: Calendar },
    { id: 'notifications', label: 'Broadcast Alerts', icon: Bell, badge: unreadCount },
    { id: 'academic', label: 'Software Eng. Submission', icon: BookOpen, tag: 'Full Report' }
  ];

  const navItems = isDriver ? driverNavItems : isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside className="w-full md:w-64 bg-[#091510] border-r border-emerald-950/70 flex flex-col justify-between shrink-0 min-h-full md:min-h-[calc(100vh-4rem)]">
      {/* Top Nav links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-emerald-500/70 uppercase tracking-wider">
          {currentUser?.role || 'University'} Portal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onItemClick) onItemClick();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-950 font-semibold'
                  : 'text-slate-300 hover:bg-[#0f241c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-emerald-400/80'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}

              {item.tag && (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-semibold">
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick action: Report Delay/Issue */}
        <div className="pt-4 mt-2 border-t border-emerald-950/80">
          <button
            onClick={() => setIsReportIssueOpen(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-amber-300/90 bg-[#162719] hover:bg-[#1c3321] border border-amber-900/40 transition"
          >
            <MessageSquareWarning className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Report Bus Delay / Issue</span>
          </button>
        </div>
      </div>

      {/* User Footer Snippet matching Mockup */}
      <div className="p-3 border-t border-emerald-950/80">
        <div className="bg-[#0c1f17] border border-emerald-900/60 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0 shadow">
              {currentUser.name ? currentUser.name.charAt(0) : 'Z'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {currentUser.name || 'Zainab Abdul Qayoom'}
              </p>
              <p className="text-[11px] text-emerald-400/90 truncate font-medium">
                {currentUser.role} {currentUser.degree ? `• ${currentUser.degree}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={logoutUser}
            title="Log Out"
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#142e22] transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
