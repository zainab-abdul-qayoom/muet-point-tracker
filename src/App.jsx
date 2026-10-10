import React from 'react';
import { Home, Navigation, Bus, Calendar, Menu, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import StudentDashboard from './components/student/StudentDashboard';
import LiveTrackingView from './components/student/LiveTrackingView';
import BusRoutesView from './components/student/BusRoutesView';
import MyStopsView from './components/student/MyStopsView';
import BusSchedule from './components/student/BusSchedule';
import NotificationsView from './components/student/NotificationsView';
import ProfileView from './components/student/ProfileView';
import AdminDashboard from './components/admin/AdminDashboard';
import DriverDashboard from './components/driver/DriverDashboard';
import AcademicDocsView from './components/academic/AcademicDocsView';
import RouteDetailsModal from './components/student/RouteDetailsModal';
import AuthModal from './components/auth/AuthModal';
import MobilePreviewModal from './components/mobile/MobilePreviewModal';
import AITransportAssistant from './components/ai/AITransportAssistant';
import ReportIssueModal from './components/student/ReportIssueModal';
import StopQRModal from './components/stops/StopQRModal';
import AuthPage from './components/auth/AuthPage';

function MainLayout() {
  const {
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    currentUser,
    dataError,
    isLoadingData,
    loadDataFromBackend
  } = useApp();

  return (
    <div className="min-h-screen bg-[#07130e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      {/* Top Header */}
      <Header />

      {/* Backend Sync Error Banner with Retry */}
      {dataError && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Connection to local SQLite backend offline ({dataError}). Operating with cached snapshot.</span>
          </div>
          <button
            onClick={loadDataFromBackend}
            disabled={isLoadingData}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            Retry Connection
          </button>
        </div>
      )}

      {/* Mobile Drawer Navigation (Tablet & Mobile Screens < md) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#091510] h-full shadow-2xl flex flex-col z-10 border-r border-emerald-950/80">
            <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#122e22] border border-emerald-500/40 p-1 flex items-center justify-center">
                  <img src="/assets/muet_logo_seal.jpg" alt="MUET" className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="font-bold text-sm text-white">MUET Point Tracker</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#0e241c] border border-emerald-900/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Body: Sidebar + Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 bg-[#07130e] pb-24 md:pb-8">
          {activeTab === 'home' && <StudentDashboard />}
          {activeTab === 'live-tracking' && <LiveTrackingView />}
          {activeTab === 'routes' && <BusRoutesView />}
          {activeTab === 'my-stops' && <MyStopsView />}
          {activeTab === 'schedule' && <BusSchedule />}
          {activeTab === 'notifications' && <NotificationsView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'academic' && <AcademicDocsView />}

          {/* Role Protected Admin Tab */}
          {activeTab === 'admin-fleet' && (
            currentUser?.role === 'Admin' ? (
              <AdminDashboard />
            ) : (
              <div className="max-w-md mx-auto my-12 p-6 bg-[#091812] border border-red-500/40 rounded-2xl text-center shadow-xl">
                <h3 className="text-base font-bold text-red-400 mb-1">Administrative Privilege Required</h3>
                <p className="text-xs text-slate-300 mb-4">
                  The Fleet Overview and Administrative Command Center is restricted to authorized university administrators.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Return to Student Dashboard
                </button>
              </div>
            )
          )}

          {/* Role Protected Driver Tab */}
          {activeTab === 'driver-trip' && (
            (currentUser?.role === 'Driver' || currentUser?.role === 'Admin') ? (
              <DriverDashboard />
            ) : (
              <div className="max-w-md mx-auto my-12 p-6 bg-[#091812] border border-amber-500/40 rounded-2xl text-center shadow-xl">
                <h3 className="text-base font-bold text-amber-400 mb-1">Driver Console Restricted</h3>
                <p className="text-xs text-slate-300 mb-4">
                  Live trip management, waypoint progression, and telemetry broadcasting are reserved for authorized university point drivers.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Return to Student Dashboard
                </button>
              </div>
            )
          )}

          {/* Bottom Brand Tagline matching Mockup Footer */}
          <footer className="mt-12 pt-6 pb-4 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-400/90 font-medium tracking-wide">
                Safe Travels • Better Connectivity • A Smarter MUET
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mehran University of Engineering & Technology, Jamshoro, Sindh, Pakistan
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on < md screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1713]/95 backdrop-blur-lg border-t border-emerald-950/90 h-16 safe-area-bottom flex items-center justify-around px-2 text-[10px]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('live-tracking')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'live-tracking' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'routes' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Routes</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'schedule' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 transition ${
            isMobileMenuOpen ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Modals & Simulators */}
      <RouteDetailsModal />
      <AuthModal />
      <MobilePreviewModal />
      <AITransportAssistant />
      <ReportIssueModal />
      <StopQRModal />
    </div>
  );
}

function AppContent() {
  const { currentUser } = useApp();

  // If user is unauthenticated, ALWAYS show the official MUET AuthPage first
  if (!currentUser || !currentUser.isAuthenticated) {
    return <AuthPage />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
