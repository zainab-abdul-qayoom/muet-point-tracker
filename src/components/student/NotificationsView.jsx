import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Filter,
  CheckCheck,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function NotificationsView() {
  const [filterTab, setFilterTab] = useState('all'); // all | alerts | updates
  const { notifications, markAllNotificationsRead } = useApp();

  const filtered = notifications.filter((item) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'alerts') return item.category === 'alert';
    if (filterTab === 'updates') return item.category === 'update';
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span>Service Notifications</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Emergency announcements, route alerts and transport advisories
          </p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 bg-[#0e241c] px-3 py-1.5 rounded-lg border border-emerald-900/60"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      {/* Tabs matching Mockup: [ All | Alerts | Updates ] */}
      <div className="bg-[#0b1b14] p-1 rounded-xl border border-emerald-950/80 flex items-center gap-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'alerts', label: 'Alerts' },
          { id: 'updates', label: 'Updates' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterTab === tab.id
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List matching Mockup exactly */}
      <div className="space-y-3">
        {filtered.map((notif) => {
          const isDanger = notif.severity === 'danger' || notif.type === 'delay' || notif.type === 'route_closure';
          const isSuccess = notif.severity === 'success' || notif.type === 'new_route';
          const isWarning = notif.severity === 'warning' || notif.type === 'maintenance';

          return (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all shadow-md flex items-start gap-3.5 ${
                isDanger
                  ? 'bg-[#1a1414] border-red-900/50 hover:border-red-700/60'
                  : isWarning
                  ? 'bg-[#1c1811] border-amber-900/50 hover:border-amber-700/60'
                  : 'bg-[#0c1f17] border-emerald-900/50 hover:border-emerald-700/60'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDanger
                    ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                    : isWarning
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                    : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                }`}
              >
                {isDanger ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : isWarning ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-white">{notif.title}</h3>
                  <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {notif.time}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
