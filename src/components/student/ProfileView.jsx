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
  ShieldCheck,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ProfileView() {
  const {
    currentUser,
    setCurrentUser,
    routes,
    setSelectedRoute,
    setActiveTab,
    setIsReportIssueOpen,
    authToken
  } = useApp();
  const [profileTab, setProfileTab] = useState('profile'); // profile | saved | reports | notif_pref
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [myIssues, setMyIssues] = useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser?.name || 'Student Name',
    rollNo: currentUser?.rollNo || currentUser?.roll_no || 'Student Roll No',
    email: currentUser?.email || 'student@muet.edu.pk',
    department: currentUser?.department || 'Mehran University',
    phone: currentUser?.phone || '+92 300 1234567',
    batch: currentUser?.batch || '2025'
  });

  // Fetch reports when reports tab is opened
  React.useEffect(() => {
    if (profileTab === 'reports') {
      setIsLoadingIssues(true);
      const token = authToken || sessionStorage.getItem('muet_tracker_token');
      fetch('/api/issues', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setMyIssues(data.data);
          }
        })
        .catch((err) => console.warn('Failed to load issues:', err))
        .finally(() => setIsLoadingIssues(false));
    }
  }, [profileTab, authToken]);

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
        {/* Avatar circle with profile photo */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-500 text-slate-950 font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-emerald-500/20 border-2 border-emerald-400">
          <img
            src={currentUser?.avatar || (currentUser?.role === 'Driver' ? '/images/avatars/driver.jpg' : currentUser?.role === 'Admin' ? '/images/avatars/admin.jpg' : '/images/avatars/student-female.jpg')}
            alt={currentUser?.name || 'Profile'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.parentElement) e.target.parentElement.innerText = currentUser?.initials || 'ZA';
            }}
          />
        </div>

        <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
        <p className="text-xs text-emerald-400 font-semibold mt-0.5">
          {currentUser.role} • {currentUser.degree || 'BSCS'}
        </p>

        {/* Tabs: [ Profile | Saved Routes | My Reports | Preferences ] */}
        <div className="mt-6 flex border-b border-emerald-950">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'saved', label: 'Saved Routes' },
            { id: 'reports', label: 'My Reports' },
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

        {/* My Reports Tab */}
        {profileTab === 'reports' && (
          <div className="mt-6 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Issues and incident feedback submitted by you:</p>
              <button
                type="button"
                onClick={() => setIsReportIssueOpen(true)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-[#0f241c] border border-emerald-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-3 h-3" />
                <span>New Report</span>
              </button>
            </div>

            {isLoadingIssues ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading your reports...</span>
              </div>
            ) : myIssues.length === 0 ? (
              <div className="p-6 text-center bg-[#0f241c] border border-emerald-900/60 rounded-xl">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-300">No issues reported yet</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">Notice point delay, overcrowding, or route changes? Let transport section know.</p>
                <button
                  type="button"
                  onClick={() => setIsReportIssueOpen(true)}
                  className="text-xs font-bold px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition"
                >
                  Report an Issue
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {myIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-[#0f241c] border border-emerald-900/60 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-white line-clamp-1">{issue.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          issue.status === 'Resolved'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : issue.status === 'In Progress'
                            ? 'bg-blue-950 text-blue-400 border-blue-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{issue.description}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
