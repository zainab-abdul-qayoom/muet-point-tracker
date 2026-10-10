import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Shield,
  Truck,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser } = useApp();

  const [authRole, setAuthRole] = useState('Student'); // Student | Admin | Driver
  const [authMode, setAuthMode] = useState('login'); // login | signup | forgot
  const [identifier, setIdentifier] = useState('MUET-2023-CS-001');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup fields
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    rollNo: '',
    dept: 'Computer Science',
    email: '',
    phone: '',
    password: ''
  });

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleRoleChange = (role) => {
    setAuthRole(role);
    if (role === 'Student') {
      setIdentifier('MUET-2023-CS-001');
      setPassword('password123');
    } else if (role === 'Driver') {
      setIdentifier('driver-01');
      setPassword('driver123');
    } else if (role === 'Admin') {
      setIdentifier('admin@muet.edu.pk');
      setPassword('admin123');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    loginUser(authRole, { identifier, password });
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    loginUser('Student', {
      identifier: signupForm.rollNo,
      name: signupForm.fullName
    });
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setAuthMode('login');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      {/* Background container styled with MUET campus overlay matching Page 1 */}
      <div className="relative w-full max-w-md bg-[#0a1813] border border-emerald-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden ring-1 ring-emerald-500/20">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Logo matching Mockup Page 1 */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 p-2 mx-auto flex items-center justify-center shadow-lg">
            <img
              src="/assets/muet_logo_seal.jpg"
              alt="MUET Seal"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h2 className="text-xl font-bold text-white mt-3">MUET Point Tracker</h2>
          <p className="text-xs text-emerald-400/80 font-medium">
            Mehran University of Engineering & Technology, Jamshoro
          </p>
        </div>

        {/* Role Tabs: [ Student | Admin | Driver ] matching Mockup */}
        {authMode === 'login' && (
          <div className="bg-[#0f241c] p-1 rounded-xl border border-emerald-900/60 flex items-center gap-1 mb-5">
            {[
              { id: 'Student', label: 'Student', icon: GraduationCap },
              { id: 'Admin', label: 'Admin', icon: Shield },
              { id: 'Driver', label: 'Driver', icon: Truck }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleRoleChange(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authRole === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {authRole === 'Student'
                  ? 'Email / Roll No.'
                  : authRole === 'Driver'
                  ? 'Driver ID / License'
                  : 'Administrative Email'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    authRole === 'Student'
                      ? 'e.g. MUET-2023-CS-001'
                      : authRole === 'Driver'
                      ? 'e.g. driver-01'
                      : 'admin@muet.edu.pk'
                  }
                  className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password matching Mockup */}
            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-emerald-500 w-3.5 h-3.5 rounded"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="text-emerald-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Big Emerald Login Button */}
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
            >
              <span>Login as {authRole}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Sign up prompt footer */}
            <div className="text-center pt-2 border-t border-emerald-950">
              <span className="text-slate-400 text-xs">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-emerald-400 font-bold hover:underline text-xs"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* Student Signup Form */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Zainab Abdul Qayoom"
                value={signupForm.fullName}
                onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  University Roll No
                </label>
                <input
                  type="text"
                  required
                  placeholder="23CS001"
                  value={signupForm.rollNo}
                  onChange={(e) => setSignupForm({ ...signupForm, rollNo: e.target.value })}
                  className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Department
                </label>
                <select
                  value={signupForm.dept}
                  onChange={(e) => setSignupForm({ ...signupForm, dept: e.target.value })}
                  className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3 py-2 text-white"
                >
                  <option>Computer Science</option>
                  <option>Software Engineering</option>
                  <option>Electrical Eng.</option>
                  <option>Mechanical Eng.</option>
                  <option>Civil Engineering</option>
                  <option>Telecommunication</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Official University Email
              </label>
              <input
                type="email"
                required
                placeholder="student@muet.edu.pk"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs shadow-lg shadow-emerald-950 mt-2"
            >
              Complete Student Registration
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-slate-400 hover:text-white text-xs"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Flow */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
            <p className="text-slate-300 text-xs">
              Enter your registered university email to receive a password reset link.
            </p>

            {forgotSent ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-center">
                Reset instructions dispatched to your inbox!
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Registered University Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="zainab@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#0f241c] border border-emerald-900/80 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={forgotSent}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs shadow-lg"
            >
              Dispatch Password Reset Token
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-slate-400 hover:text-white text-xs"
              >
                ← Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
