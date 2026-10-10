import React, { useState } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Hash,
  Bookmark,
  Bell,
  CheckCircle,
  Save,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ProfileView() {
  const { currentUser, setCurrentUser, routes, setSelectedRoute, setActiveTab } = useApp();
  const [profileTab, setProfileTab] = useState('profile'); // profile | saved | notif_pref
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser.name || 'Zainab Abdul Qayoom',
    rollNo: currentUser.rollNo || 'MUET-2023-CS-001',
    email: currentUser.email || 'zainab@gmail.com',
    department: currentUser.department || 'Computer Science',
    phone: currentUser.phone || '+92 301 5551234',
    batch: currentUser.batch || '23-CS'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setCurrentUser((prev) => ({
      ...prev,
      ...formData,
      initials: formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }));
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Profile Card matching Mockup */}
      <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center">
        {/* Avatar circle "ZA" */}
        <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-emerald-500/20">
          {currentUser.initials || 'ZA'}
        </div>

        <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
        <p className="text-xs text-emerald-400 font-semibold mt-0.5">
          {currentUser.role} • {currentUser.degree || 'BSCS'}
        </p>

        {/* Tabs: [ Profile | Saved Routes | Notifications ] */}
        <div className="mt-6 flex border-b border-emerald-950">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'saved', label: 'Saved Routes' },
            { id: 'notif_pref', label: 'Preferences' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id)}
              className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all ${
                profileTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {savedSuccess && (
          <div className="mt-4 p-2.5 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {/* Profile Details Tab Content matching Mockup */}
        {profileTab === 'profile' && (
          <form onSubmit={handleSave} className="mt-6 space-y-4 text-left">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0f241c] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-80"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Roll No.
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full bg-[#0f241c] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-80"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Email
              </label>
              <input
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0f241c] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-80"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Department
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-[#0f241c] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-80"
              />
            </div>

            {/* Action Button matching Mockup: "Edit Profile" */}
            <div className="pt-2">
              {isEditing ? (
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
                >
                  <User className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Saved Routes Tab */}
        {profileTab === 'saved' && (
          <div className="mt-6 space-y-3 text-left">
            <p className="text-xs text-slate-400">Your bookmarked university point route:</p>
            {routes.slice(0, 2).map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRoute(r)}
                className="p-3 bg-[#0f241c] border border-emerald-900/70 rounded-xl flex items-center justify-between cursor-pointer hover:bg-[#153427] transition"
              >
                <div>
                  <h4 className="font-bold text-xs text-white">{r.name}</h4>
                  <p className="text-[11px] text-emerald-400">{r.totalStops} stops • {r.estTime}</p>
                </div>
                <Bookmark className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </div>
            ))}
          </div>
        )}

        {/* Preferences Tab */}
        {profileTab === 'notif_pref' && (
          <div className="mt-6 space-y-3 text-left">
            <label className="flex items-center justify-between p-3 bg-[#0f241c] rounded-xl text-xs text-slate-300">
              <span>Push notifications for bus delays</span>
              <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 bg-[#0f241c] rounded-xl text-xs text-slate-300">
              <span>Arrival sound chime (when 2 min away)</span>
              <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 bg-[#0f241c] rounded-xl text-xs text-slate-300">
              <span>Offline timetable caching</span>
              <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
