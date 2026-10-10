import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  Truck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building,
  Hash,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ThemeSwitcher from '../common/ThemeSwitcher';

export default function AuthPage() {
  const { loginUser, registerStudent } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('25BSCS016');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration form
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    rollNo: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Systems Engineering'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQuickFill = (role) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (role === 'Student') {
      setIdentifier('25BSCS016');
      setPassword('password123');
    } else if (role === 'Driver') {
      setIdentifier('DRV-7712');
      setPassword('driver123');
    } else if (role === 'Admin') {
      setIdentifier('admin@muet.edu.pk');
      setPassword('admin123');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your University Roll No (e.g. 25BSCS016) or Email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser({ identifier: identifier.trim(), password });
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your Roll No/Email and password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const { fullName, rollNo, email, password: regPassword, confirmPassword, department } = registerForm;

    if (!fullName.trim() || !rollNo.trim() || !regPassword) {
      setErrorMessage('Please fill in all required registration fields (Full Name, Roll Number, Department, Password).');
      return;
    }

    const cleanRoll = rollNo.trim().toUpperCase();
    // Strict MUET Roll Number Pattern: 2-digit year + 4-letter department + 3-digit number (e.g. 25BSCS016)
    const rollPattern = /^[0-9]{2}[A-Z]{4}[0-9]{3}$/;
    if (!rollPattern.test(cleanRoll)) {
      setErrorMessage('Invalid Roll Number format. Must match official MUET pattern: 25BSCS016 (2-digit year, 4-letter department, 3-digit number).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerStudent({
        fullName: fullName.trim(),
        rollNo: cleanRoll,
        email: (email && email.trim()) ? email.trim().toLowerCase() : `${cleanRoll.toLowerCase()}@student.muet.edu.pk`,
        password: regPassword,
        confirmPassword,
        department
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed. Roll number may already exist.');
      } else {
        // Direct the student to the Sign In page with informative message and prefilled roll number
        setMode('login');
        setIdentifier(cleanRoll);
        setPassword('');
        setSuccessMessage(`Account created successfully for Roll No ${cleanRoll}! Please enter your password to sign in.`);
        setRegisterForm({
          fullName: '',
          rollNo: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: 'Computer Systems Engineering'
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-3 sm:p-6 font-sans text-slate-100 overflow-y-auto selection:bg-emerald-500 selection:text-black"
      style={{
        backgroundImage: "url('/images/muet-gate-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark Translucent Overlay matching Institutional Mockup */}
      <div className="auth-overlay absolute inset-0 bg-gradient-to-b from-[#040e0a]/85 via-[#061610]/80 to-[#020a06]/92 backdrop-blur-[3px] pointer-events-none transition-all duration-300" />

      {/* Top Floating Institutional Theme Switcher */}
      <div className="absolute top-3 sm:top-5 right-3 sm:right-5 z-30">
        <ThemeSwitcher />
      </div>

      {/* Main Authentication Container */}
      <div className="relative z-10 w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#091812]/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl ring-1 ring-amber-500/20">
          
          {/* Authentic MUET University Crest Seal Badge */}
          <div className="text-center mb-6">
            <div className="inline-block relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0d271d] border-2 border-emerald-400/50 p-2 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-950/60 ring-2 ring-amber-400/30">
                <img
                  src="/assets/muet_logo_seal.jpg"
                  alt="Mehran University Seal"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow">
                1963
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>MUET Point Tracker</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-400/90 font-medium mt-1">
              Mehran University of Engineering & Technology, Jamshoro
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Official Transit Telemetry & Point Dispatch System
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In / Register) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#06120d] border border-emerald-900/60 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Student
            </button>
          </div>

          {/* Error & Success Notification Banners */}
          {errorMessage && (
            <div className="mb-5 bg-red-950/80 border border-red-500/50 text-red-200 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1">{successMessage}</span>
            </div>
          )}

          {/* ===================== SIGN IN FORM ===================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  University Roll Number or Email
                </label>
                <p className="text-[11px] text-emerald-400/80 mb-1.5">
                  Students: enter your official Roll Number (e.g. <span className="font-mono font-bold text-amber-300">25BSCS016</span>). Staff/Drivers: enter assigned ID or email.
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 25BSCS016 or admin@muet.edu.pk"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#06130e] border border-emerald-900/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Account Password
                  </label>
                  <span className="text-[11px] text-emerald-400 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-[#06130e] border border-emerald-900/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-emerald-900 text-emerald-500 focus:ring-emerald-400 bg-[#06130e]"
                  />
                  <span>Keep session active</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Create Account Direct Link */}
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400">
                  New student?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline transition ml-1 cursor-pointer"
                  >
                    Create Account (Student Registration)
                  </button>
                </p>
              </div>

              {/* Quick Demo Credentials Assistant */}
              <div className="pt-4 mt-2 border-t border-emerald-950/80">
                <p className="text-[11px] text-slate-400 mb-2 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Demo Access (Verified Accounts):</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Requires Sign In</span>
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('Student')}
                    title="Student: 25BSCS016 / password123"
                    className="text-[11px] py-1.5 px-2 rounded-lg bg-[#0c2219] hover:bg-[#123023] border border-emerald-900 text-emerald-300 flex items-center justify-center gap-1 transition"
                  >
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span className="font-semibold">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('Driver')}
                    title="Driver: DRV-7712 / driver123"
                    className="text-[11px] py-1.5 px-2 rounded-lg bg-[#0c2219] hover:bg-[#123023] border border-emerald-900 text-amber-300 flex items-center justify-center gap-1 transition"
                  >
                    <Truck className="w-3 h-3 text-amber-400" />
                    <span className="font-semibold">Driver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('Admin')}
                    title="Admin: admin@muet.edu.pk / admin123"
                    className="text-[11px] py-1.5 px-2 rounded-lg bg-[#0c2219] hover:bg-[#123023] border border-emerald-900 text-purple-300 flex items-center justify-center gap-1 transition"
                  >
                    <Shield className="w-3 h-3 text-purple-400" />
                    <span className="font-semibold">Admin</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  Click a role to load credentials, then click "Sign In to Dashboard" to authenticate.
                </p>
              </div>
            </form>
          )}

          {/* ===================== REGISTRATION FORM ===================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Student Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500/70">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    placeholder="e.g. Bilal Ahmed"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#06130e] border border-emerald-900/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  University Roll Number
                </label>
                <p className="text-[11px] text-emerald-400/80 mb-1">
                  Format: <span className="font-mono font-bold text-amber-300">25BSCS016</span> (2-digit year + 4-letter department + 3-digit number)
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500/70">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={registerForm.rollNo}
                    onChange={(e) => setRegisterForm({ ...registerForm, rollNo: e.target.value.toUpperCase() })}
                    placeholder="e.g. 25BSCS016"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#06130e] border border-emerald-900/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 uppercase font-mono tracking-wide"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500/70">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="student@muet.edu.pk (auto-created if blank)"
                    className="w-full pl-9 pr-3 py-2 bg-[#06130e] border border-emerald-900/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department / Program
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500/70">
                    <Building className="w-4 h-4" />
                  </div>
                  <select
                    value={registerForm.department}
                    onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-[#06130e] border border-emerald-900/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Computer Systems Engineering">Computer Systems Engineering (CS)</option>
                    <option value="Software Engineering">Software Engineering (SW)</option>
                    <option value="Telecommunication Engineering">Telecommunication Engineering (TL)</option>
                    <option value="Electrical Engineering">Electrical Engineering (EL)</option>
                    <option value="Civil Engineering">Civil Engineering (CE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                    <option value="Electronic Engineering">Electronic Engineering (ES)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password (Min 6)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-3 py-2 bg-[#06130e] border border-emerald-900/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      required
                      className="w-full px-3 py-2 bg-[#06130e] border border-emerald-900/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                Public registration registers student accounts. Administrative and Driver accounts are provisioned via university transport section.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Student Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Already registered link */}
              <div className="pt-2 text-center border-t border-emerald-950/80">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline transition ml-1 cursor-pointer"
                  >
                    Sign In to your account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Footer Institutional Tagline */}
          <div className="mt-6 pt-4 border-t border-emerald-950/80 text-center">
            <p className="text-[11px] text-emerald-400/80 font-medium">
              Safe Travels • Better Connectivity • A Smarter MUET
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Directorate of Student Financial Aid & Transport Section, Jamshoro
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
