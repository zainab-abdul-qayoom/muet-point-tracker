import React, { useState } from 'react';
import {
  Shield,
  Bus,
  Users,
  Route as RouteIcon,
  Navigation,
  Plus,
  Radio,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Trash2,
  Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPointNumber } from '../../utils/routeColors';

export default function AdminDashboard() {
  const {
    buses,
    drivers,
    routes,
    adminActivities,
    broadcastAlert,
    addBus,
    deleteBus,
    updateBus,
    setActiveTab,
    authToken
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState('overview'); // overview | buses | drivers | broadcast
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [issuesList, setIssuesList] = useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  // Load issues from backend
  const loadAdminIssues = React.useCallback(async () => {
    setIsLoadingIssues(true);
    try {
      const token = authToken || sessionStorage.getItem('muet_tracker_token');
      const res = await fetch('/api/issues', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setIssuesList(data.data);
      }
    } catch (err) {
      console.warn('Failed to load issues for admin:', err);
    } finally {
      setIsLoadingIssues(false);
    }
  }, [authToken]);

  React.useEffect(() => {
    loadAdminIssues();
  }, [loadAdminIssues]);

  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    try {
      const token = authToken || sessionStorage.getItem('muet_tracker_token');
      await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      setIssuesList((prev) =>
        prev.map((iss) => (iss.id === issueId ? { ...iss, status: newStatus } : iss))
      );
    } catch (err) {
      console.warn('Failed to update issue status:', err);
    }
  };

  // New bus form state
  const [newBusForm, setNewBusForm] = useState({
    number: `Bus ${String(buses.length + 1).padStart(2, '0')}`,
    plate: 'GSA-8800',
    routeName: 'Main Campus ➔ Hyderabad',
    routeId: 'route-04',
    driverName: 'Sikandar Jamali',
    capacity: 65,
    status: 'Arriving',
    isOnline: true
  });

  // Broadcast alert form state
  const [alertForm, setAlertForm] = useState({
    title: 'Severe Traffic Delay near Jamshoro Bypass',
    message: 'Due to road maintenance on Indus Highway, buses on Route 01 and 02 may experience 10-15 minute delays.',
    severity: 'warning'
  });

  // Calculate statistics
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.isOnline && b.status !== 'Maintenance' && b.status !== 'Inactive').length;
  const maintenanceBuses = buses.filter((b) => b.status === 'Maintenance').length;
  const inactiveBuses = buses.filter((b) => b.status === 'Inactive' || (!b.isOnline && b.status !== 'Maintenance')).length;
  const totalDrivers = drivers.length;
  const totalRoutes = routes.length;

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Bus Number,License Plate,Route,Status,Speed,Next Stop,Driver,Capacity\n' +
      buses
        .map(
          (b) =>
            `"${b.number}","${b.plate}","${b.routeName}","${b.status}","${b.speed}","${b.nextStopName}","${b.driverName}",${b.capacity}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MUET_Fleet_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bus submission feedback
  const [isSubmittingBus, setIsSubmittingBus] = useState(false);
  const [busSubmitError, setBusSubmitError] = useState(null);

  const handleCreateBus = async (e) => {
    e.preventDefault();
    setIsSubmittingBus(true);
    setBusSubmitError(null);
    try {
      await addBus({
        ...newBusForm,
        coords: [25.4057, 68.2618],
        eta: '5 min',
        speed: '40 km/h',
        passengers: 0,
        targetProgress: 0.1,
        badgeType: 'green'
      });
      setShowAddBusModal(false);
      setNewBusForm({
        number: `Bus ${String(buses.length + 2).padStart(2, '0')}`,
        plate: `GSA-${Math.floor(1000 + Math.random() * 9000)}`,
        routeName: 'Main Campus ➔ Hyderabad',
        routeId: 'route-04',
        driverName: 'Assigned Driver',
        capacity: 65,
        status: 'Arriving',
        isOnline: true
      });
    } catch (err) {
      setBusSubmitError(err.message || 'Error saving bus to database');
    } finally {
      setIsSubmittingBus(false);
    }
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    broadcastAlert(alertForm);
    setShowAlertModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Admin Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-purple-500/40 bg-purple-950/30 shrink-0">
            <img
              src="/images/avatars/admin.jpg"
              alt="Admin"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Transport Administration Control Center</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Director: <strong className="text-white">Dr. Asif Shah</strong> • Transport Directorate
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAlertModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Broadcast Alert</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-[#122e22] hover:bg-[#183d2d] border border-emerald-800 text-emerald-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={() => setShowAddBusModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Point</span>
          </button>
        </div>
      </div>

      {/* Stats Cards matching Mockup exactly */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Points */}
        <div className="bg-[#0b1b14] border border-emerald-900/70 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Points</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalBuses}</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Bus className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Active Points */}
        <div className="bg-[#0b1b14] border border-emerald-900/70 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Active Points</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{activeBuses}</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Navigation className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Drivers */}
        <div className="bg-[#0b1b14] border border-emerald-900/70 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Drivers</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalDrivers}</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Routes */}
        <div className="bg-[#0b1b14] border border-emerald-900/70 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Routes</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalRoutes}</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-orange-400 shrink-0">
            <RouteIcon className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Bus Status Donut Chart + Recent Activity Feed matching Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bus Status Donut Widget */}
        <div className="lg:col-span-5 bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <h3 className="font-bold text-sm text-white mb-3">Point Fleet Status</h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-[#10241b]"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Active circle (green) */}
                <path
                  className="text-emerald-500"
                  strokeDasharray="83, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Maintenance (amber) */}
                <path
                  className="text-amber-500"
                  strokeDasharray="8, 100"
                  strokeDashoffset="-83"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Inactive (slate) */}
                <path
                  className="text-slate-500"
                  strokeDasharray="9, 100"
                  strokeDashoffset="-91"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{activeBuses}</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Active</span>
              </div>
            </div>

            {/* Legend matching Mockup */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300">Active</span>
                <strong className="text-white ml-auto">{activeBuses}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-300">Maintenance</span>
                <strong className="text-white ml-auto">{maintenanceBuses}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                <span className="text-slate-300">Inactive</span>
                <strong className="text-white ml-auto">{inactiveBuses}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List matching Mockup */}
        <div className="lg:col-span-7 bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-5 shadow-xl">
          <h3 className="font-bold text-sm text-white mb-3">Recent Activity</h3>

          <div className="space-y-3 max-h-56 overflow-y-auto">
            {adminActivities.map((act) => (
              <div
                key={act.id}
                className="p-2.5 bg-[#0e241c] rounded-xl border border-emerald-900/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-slate-200">{act.text}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Management Table */}
      <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white">MUET Point Fleet Roster</h3>
          <span className="text-xs text-slate-400">Total {buses.length} registered vehicles</span>
        </div>

        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-emerald-950 text-slate-400">
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Plate No.</th>
                <th className="py-2.5 px-3">Route Assignment</th>
                <th className="py-2.5 px-3">Driver</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-[#0e241c] transition">
                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                    <Bus className="w-4 h-4 text-emerald-400" />
                    <span>{formatPointNumber(bus.number)}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono">{bus.plate}</td>
                  <td className="py-3 px-3 text-slate-300">{bus.routeName}</td>
                  <td className="py-3 px-3 text-slate-300">{bus.driverName}</td>
                  <td className="py-3 px-3 text-slate-300">{bus.speed}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        bus.status === 'Arriving' || bus.status === 'On Route'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : bus.status === 'Maintenance'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        updateBus(bus.id, {
                          status: bus.status === 'Maintenance' ? 'On Route' : 'Maintenance'
                        });
                      }}
                      title="Toggle Maintenance"
                      className="p-1 hover:text-amber-400 text-slate-400 rounded transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBus(bus.id)}
                      title="Decommission Bus"
                      className="p-1 hover:text-red-400 text-slate-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Incident & Transport Grievance Reports Section */}
      <div className="bg-[#0b1b14] border border-emerald-950/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-950 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Campus Incident & Grievance Reports</span>
              <span className="text-xs bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full border border-amber-800">
                {issuesList.filter((i) => i.status === 'Open').length} Open
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review passenger incident submissions, point delays, and overcrowding reports from students
            </p>
          </div>
          <button
            onClick={loadAdminIssues}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2.5 py-1 bg-[#0f241c] border border-emerald-900 rounded-lg transition"
          >
            Refresh Reports
          </button>
        </div>

        {isLoadingIssues ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading grievances...</span>
          </div>
        ) : issuesList.length === 0 ? (
          <div className="p-8 text-center bg-[#091812] border border-emerald-900/40 rounded-xl">
            <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">No grievance reports currently pending</p>
            <p className="text-[11px] text-slate-500 mt-0.5">All student transport reports have been reviewed and resolved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#07130e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-emerald-950">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Title & Details</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60">
                {issuesList.map((issue) => (
                  <tr key={issue.id} className="hover:bg-[#0e241c]/60 transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400 font-bold whitespace-nowrap">
                      {issue.id}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <p className="font-bold text-white text-xs">{issue.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{issue.description}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {issue.user_id}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          issue.status === 'Resolved'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : issue.status === 'In Progress'
                            ? 'bg-blue-950 text-blue-400 border-blue-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                      {issue.status !== 'In Progress' && issue.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateIssueStatus(issue.id, 'In Progress')}
                          className="px-2 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 rounded text-[10px] font-semibold transition"
                        >
                          In Progress
                        </button>
                      )}
                      {issue.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateIssueStatus(issue.id, 'Resolved')}
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-[10px] font-semibold transition"
                        >
                          Resolve
                        </button>
                      )}
                      {issue.status === 'Resolved' && (
                        <span className="text-[10px] text-slate-500 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b1b14] border border-emerald-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-3">Register New University Point</h3>
            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Point Number (e.g. Point 13)</label>
                <input
                  type="text"
                  required
                  value={newBusForm.number}
                  onChange={(e) => setNewBusForm({ ...newBusForm, number: e.target.value })}
                  className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Registration Plate</label>
                <input
                  type="text"
                  required
                  value={newBusForm.plate}
                  onChange={(e) => setNewBusForm({ ...newBusForm, plate: e.target.value })}
                  className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Route Assignment</label>
                <select
                  value={newBusForm.routeId}
                  onChange={(e) => {
                    const r = routes.find((x) => x.id === e.target.value);
                    setNewBusForm({
                      ...newBusForm,
                      routeId: e.target.value,
                      routeName: r ? r.name : 'Main Campus ➔ Hyderabad'
                    });
                  }}
                  className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.number}: {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Assigned Driver</label>
                <input
                  type="text"
                  required
                  value={newBusForm.driverName}
                  onChange={(e) => setNewBusForm({ ...newBusForm, driverName: e.target.value })}
                  className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
                />
              </div>
              {busSubmitError && (
                <div className="p-2.5 bg-red-950/70 border border-red-800 text-red-300 rounded-xl text-xs">
                  {busSubmitError}
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  disabled={isSubmittingBus}
                  onClick={() => setShowAddBusModal(false)}
                  className="flex-1 bg-[#122e22] text-slate-300 py-2.5 rounded-xl transition hover:bg-[#183d2d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBus}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingBus ? (
                    <span>Saving to SQLite...</span>
                  ) : (
                    <span>Confirm & Add Point</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b1b14] border border-amber-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl">
            <h3 className="font-bold text-base text-amber-400 flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Broadcast Emergency Delay Alert</span>
            </h3>
            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Alert Headline</label>
                <input
                  type="text"
                  required
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="w-full bg-[#0f241c] border border-amber-900/60 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Detailed Message for Students</label>
                <textarea
                  rows={3}
                  required
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  className="w-full bg-[#0f241c] border border-amber-900/60 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 bg-[#122e22] text-slate-300 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl"
                >
                  Dispatch to All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
