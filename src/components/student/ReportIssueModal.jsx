import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquareWarning, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPointNumber } from '../../utils/routeColors';

export default function ReportIssueModal() {
  const { isReportIssueOpen, setIsReportIssueOpen, buses, authToken, refreshAuthToken, theme } = useApp();
  const isLight = theme === 'light';
  const [issueType, setIssueType] = useState('delay');
  const [busNumber, setBusNumber] = useState(buses[0]?.number || 'Bus 03');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isReportIssueOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return; // don't close while submitting
    setIsReportIssueOpen(false);
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent duplicate submissions
    if (!description.trim()) {
      setSubmitError('Please describe the issue before submitting.');
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);
    try {
      let token = authToken || (await refreshAuthToken('Student'));
      if (!token) {
        setSubmitError('Authentication required. Please sign in again.');
        setIsSubmitting(false);
        return;
      }
      const payload = {
        title: issueType,
        description: `Bus: ${busNumber}\n${description.trim()}`
      };
      let res = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      // Attempt token refresh once on 401
      if (res.status === 401) {
        token = await refreshAuthToken('Student');
        if (token) {
          res = await fetch('/api/issues', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        }
      }
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setIsReportIssueOpen(false);
          setDescription('');
          setIssueType('delay');
          setIsSubmitting(false);
        }, 2500);
      } else {
        setSubmitError(data.error || 'Submission failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.warn('Issue submission error:', err);
      setSubmitError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl border ${
        isLight
          ? 'bg-white border-amber-300 text-[#172B3A]'
          : 'bg-[#0b1b14] border-amber-800/80 text-white'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isLight ? 'border-[#DCE5EC]' : 'border-emerald-950'}`}>
          <div className="flex items-center gap-2 text-amber-500">
            <MessageSquareWarning className="w-5 h-5" />
            <h3 className={`font-bold text-base ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Report Point Delay or Issue</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`disabled:opacity-50 transition ${isLight ? 'text-slate-500 hover:text-[#172B3A]' : 'text-slate-400 hover:text-white'}`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className={`font-bold text-sm ${isLight ? 'text-[#172B3A]' : 'text-white'}`}>Feedback Transmitted</h4>
            <p className={`text-xs ${isLight ? 'text-[#526477]' : 'text-slate-300'}`}>
              Your feedback has been logged into the MUET Transport Section dispatch console.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {submitError && (
              <div className={`p-3 border rounded-xl text-xs ${isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/80 border-red-500/50 text-red-300'}`}>
                {submitError}
              </div>
            )}

            <div>
              <label className={`block mb-1 font-medium ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                disabled={isSubmitting}
                className={`w-full border rounded-xl px-3 py-2 disabled:opacity-50 ${
                  isLight
                    ? 'bg-white border-[#C3D0DA] text-[#172B3A]'
                    : 'bg-[#0f241c] border-emerald-900 text-white'
                }`}
              >
                <option value="delay">Point Delayed by &gt; 15 mins</option>
                <option value="missed">Point Missed Designated Stop</option>
                <option value="overcrowd">Severe Overcrowding / No Standing Room</option>
                <option value="reckless">Rash or Unsafe Driving</option>
                <option value="other">Other Inquiry / Feedback</option>
              </select>
            </div>

            <div>
              <label className={`block mb-1 font-medium ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>Concerned Point</label>
              <select
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                disabled={isSubmitting}
                className={`w-full border rounded-xl px-3 py-2 disabled:opacity-50 ${
                  isLight
                    ? 'bg-white border-[#C3D0DA] text-[#172B3A]'
                    : 'bg-[#0f241c] border-emerald-900 text-white'
                }`}
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.number}>
                    {formatPointNumber(b.number)} ({b.routeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block mb-1 font-medium ${isLight ? 'text-[#526477]' : 'text-slate-400'}`}>
                Description / Location Note <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe what occurred, your boarding stop, or timing..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (submitError) setSubmitError('');
                }}
                disabled={isSubmitting}
                className={`w-full border rounded-xl px-3 py-2 disabled:opacity-50 resize-none ${
                  isLight
                    ? 'bg-white border-[#C3D0DA] text-[#172B3A] placeholder-[#8FA3B3]'
                    : 'bg-[#0f241c] border-emerald-900 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-xl font-semibold disabled:opacity-50 transition ${
                  isLight
                    ? 'bg-[#F4F7FA] text-[#526477] hover:bg-[#EBF0F5] border border-[#DCE5EC]'
                    : 'bg-[#122e22] text-slate-300 hover:bg-[#183d2d]'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
