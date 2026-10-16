import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Bus,
  CheckCircle2,
  Download,
  Filter,
  User
} from 'lucide-react';
import { SCHEDULE_DATA } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { formatPointNumber, getRouteColor } from '../../utils/routeColors';

export default function BusSchedule() {
  const [dayTab, setDayTab] = useState('today');
  const { setSelectedBus, buses, setActiveTab } = useApp();

  const currentSchedule = dayTab === 'today' ? SCHEDULE_DATA.today : SCHEDULE_DATA.tomorrow;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>MUET Point Schedule</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Official operational timings for Jamshoro university point fleet
          </p>
        </div>

        {/* Day Tabs matching Mockup */}
        <div className="bg-[#0e241c] p-1 rounded-xl border border-emerald-900/60 flex items-center gap-1">
          <button
            onClick={() => setDayTab('today')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dayTab === 'today'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDayTab('tomorrow')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dayTab === 'tomorrow'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {currentSchedule.map((item, idx) => {
          const matchingBus = buses.find((b) => b.number === item.bus);
          const color = getRouteColor(matchingBus?.routeId || 'route-02');

          return (
            <div
              key={idx}
              className="bg-[#0b1b14] hover:bg-[#0e241c] border border-emerald-950/80 hover:border-emerald-800/80 rounded-2xl p-4 transition-all shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${color.primary}18`,
                    borderColor: `${color.primary}40`,
                    color: color.primary
                  }}
                >
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{formatPointNumber(item.bus)}</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {item.route}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-400" /> Driver: {item.driver}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timing & Action */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-emerald-950 pt-2 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Departure: <strong className="text-white">{item.departure}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Return: <strong className="text-slate-300">{item.return}</strong>
                  </div>
                </div>

                {matchingBus && (
                  <button
                    onClick={() => {
                      setSelectedBus(matchingBus);
                      setActiveTab('live-tracking');
                    }}
                    className="bg-[#122e22] hover:bg-emerald-600 hover:text-white text-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition border border-emerald-800"
                  >
                    Track Live
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note footer */}
      <div className="p-4 bg-[#0a1713] rounded-xl border border-emerald-950 text-xs text-slate-400 leading-relaxed">
        <strong className="text-emerald-400">Important Advisory:</strong> University points depart strictly on scheduled timings from both Main Campus terminal and peripheral town junctions. Students are advised to arrive 5 minutes prior to listed departure times.
      </div>
    </div>
  );
}
