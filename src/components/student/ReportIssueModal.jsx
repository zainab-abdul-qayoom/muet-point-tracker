import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ReportIssueModal() {
  const { isReportIssueOpen, setIsReportIssueOpen, buses } = useApp();
  const [issueType, setIssueType] = useState('delay');
  const [busNumber, setBusNumber] = useState('Bus 03');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isReportIssueOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsReportIssueOpen(false);
      setDescription('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0b1b14] border border-amber-800/80 rounded-2xl w-full max-w-md p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950 mb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <MessageSquareWarning className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Report Point Delay or Issue</h3>
          </div>
          <button onClick={() => setIsReportIssueOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">Feedback Transmitted</h4>
            <p className="text-xs text-slate-300">
              Your feedback has been logged into the MUET Transport Section dispatch console.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
              >
                <option value="delay">Bus Delayed by &gt; 15 mins</option>
                <option value="missed">Bus Missed Designated Stop</option>
                <option value="overcrowd">Severe Overcrowding / No Standing Room</option>
                <option value="reckless">Rash or Unsafe Driving</option>
                <option value="other">Other Inquiry / Feedback</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Concerned Point</label>
              <select
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.number}>
                    {b.number} ({b.routeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Description / Location Note</label>
              <textarea
                rows={3}
                required
                placeholder="Describe what occurred, your boarding stop, or timing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0f241c] border border-emerald-900 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportIssueOpen(false)}
                className="flex-1 bg-[#122e22] text-slate-300 py-2.5 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
