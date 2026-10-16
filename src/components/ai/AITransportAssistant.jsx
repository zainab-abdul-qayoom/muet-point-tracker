import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Minus,
  Bot,
  User,
  Navigation,
  Globe2,
  AlertTriangle,
  Clock,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRouteColor, formatPointNumber } from '../../utils/routeColors';

export default function AITransportAssistant() {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    currentUser,
    buses,
    routes,
    dataError,
    setIsReportIssueOpen,
    setSelectedRoute
  } = useApp();

  const isOnline = !dataError;
  const [language, setLanguage] = useState('en'); // 'en' | 'ur'
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Salam ${currentUser?.name?.split(' ')[0] || 'there'}! Ask me about points, routes, or your schedule.`,
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    { label: 'Next point?', query: 'Next point to Tando Bago?' },
    { label: 'My route', query: 'Show my assigned point route' },
    { label: 'Schedule', query: 'When does the next point arrive?' },
    { label: 'Report delay', query: 'Report a point delay' }
  ];

  const handleSendMessage = (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // AI Knowledge Engine response generator using real state data
    setTimeout(() => {
      const lower = text.toLowerCase();
      let responseObj = {
        id: Date.now(),
        sender: 'bot',
        time: 'Just now'
      };

      const point03 = buses.find((b) => b.number === 'Bus 03' || b.number === 'Point 03') || buses[1] || buses[0] || {
        number: 'Point 03',
        routeName: 'Main Campus ➔ Tando Bago',
        eta: '1 min',
        status: 'Arriving',
        currentLocationName: 'Academic Block',
        nextStopName: 'Engineering Faculty',
        driverName: 'Ahmed Khan',
        driverPhone: '+92 301 9876543',
        passengers: 48,
        capacity: 65,
        routeId: 'route-02'
      };

      if (lower.includes('next point') || lower.includes('tando bago') || lower.includes('bus 03') || lower.includes('point 03') || lower.includes('academic block') || lower.includes('coming') || lower.includes('next')) {
        // Render rich answer card matching user design reference
        responseObj.richCard = {
          number: formatPointNumber(point03.number),
          route: point03.routeName || 'Main Campus to Tando Bago',
          eta: point03.eta || '1 min',
          status: point03.status || 'Arriving',
          routeId: point03.routeId || 'route-02'
        };
        responseObj.text = `Live point telemetry updated. ${formatPointNumber(point03.number)} is currently on schedule.`;
      } else if (lower.includes('my route') || lower.includes('route')) {
        const savedRoute = routes.find((r) => r.id === (currentUser?.savedRouteId || 'route-02')) || routes[0];
        responseObj.text = `📍 **Your Assigned Corridor:** ${savedRoute.name} (${savedRoute.number})\n- **Total Stops:** ${savedRoute.totalStops} stops\n- **Service Hours:** ${savedRoute.serviceHours}\n- **Nearest Boarding:** ${currentUser?.nearestStop || 'Academic Block'}`;
      } else if (lower.includes('schedule') || lower.includes('timing')) {
        responseObj.text = `⏰ **Today's Point Dispatch Schedule:**\n- Morning Inbound: 07:30 AM - 08:30 AM\n- Afternoon Return: 01:30 PM & 03:30 PM\n- Evening Express: 05:00 PM (Latifabad & Qasimabad)\nAll corridors operate Mon-Fri.`;
      } else if (lower.includes('delay') || lower.includes('report') || lower.includes('issue')) {
        responseObj.text = `⚠️ If your point is delayed or you observed an incident on your route, please file a report to help university dispatch adjust schedules.`;
        responseObj.actionButton = {
          label: 'Open Report Delay Form',
          action: () => setIsReportIssueOpen(true)
        };
      } else if (lower.includes('sindhi') || lower.includes('ڪڏھن') || lower.includes('پھچندي') || lower.includes('سنڌي') || lower.includes('aendi') || lower.includes('kadhan')) {
        responseObj.text = `🚌 **پوائنٽ 03 جي تفصيل (Sindhi):**\nپوائنٽ 03 ھن وقت **${point03.currentLocationName || 'Academic Block'}** وٽ آھي ۽ پھچڻ جو وقت تقريباً **${point03.eta}** آھي. ڊرائيور **${point03.driverName || 'احمد خان'}** روٽ تي آھن.`;
      } else if (lower.includes('kab') || lower.includes('kithay') || lower.includes('urdu') || lower.includes('پہنچے') || lower.includes('کب')) {
        responseObj.text = `🚌 **پوائنٹ 03 کی تفصیلات (Urdu):**\nپوائنٹ 03 فی الوقت **${point03.currentLocationName || 'Academic Block'}** کے قریب ہے اور متوقع آمد کا وقت **${point03.eta}** ہے۔ ڈرائیور **${point03.driverName || 'احمد خان'}** آن روٹ ہیں۔`;
      } else {
        responseObj.text = `I am not sure about this specific request, but I can help you check live points, your route schedule, or file a transport report.`;
        responseObj.actionButton = {
          label: 'Report Delay / Issue',
          action: () => setIsReportIssueOpen(true)
        };
      }

      setMessages((prev) => [...prev, responseObj]);
      setIsTyping(false);
    }, 600);
  };

  // 1. Floating Assistant Bubble (When Closed)
  // Matching user's exact specification:
  // Dark navy in dark mode (#111827), clean white in light mode (#FFFFFF), MUET emblem avatar with 3px violet ring and small green online dot
  if (!isAiAssistantOpen) {
    return (
      <div className="mymuetien-root fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="mm-floating-pill group relative flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 sm:py-2 rounded-full shadow-[0_8px_25px_-4px_rgba(109,93,251,0.35)] hover:shadow-[0_10px_30px_-2px_rgba(139,92,246,0.5)] border transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ring-1 ring-black/5"
          title="Open MyMuetien Assistant"
          aria-label="Open MyMuetien AI Assistant"
        >
          {/* Identity Avatar: circle with official MUET logo, 3px violet ring, small green online dot */}
          <div
            className="relative w-8 h-8 rounded-full ring-[3px] ring-[#6D5DFB] p-0.5 flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: 'var(--mm-bg)' }}
          >
            <img
              src="/assets/muet_logo_seal.jpg"
              alt="MUET Seal"
              className="w-full h-full object-cover rounded-full"
            />
            {/* Small green Online status dot on bottom-right of avatar circle */}
            <span
              className={`mm-online-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                isOnline ? 'animate-pulse' : 'opacity-40'
              }`}
            />
          </div>

          {/* Assistant Name & Online Status */}
          <div className="flex flex-col text-left pr-0.5">
            <span className="mm-floating-title font-bold text-xs leading-tight">
              MyMuetien
            </span>
            <div className="flex items-center gap-1 text-[10px] leading-tight">
              <span className="mm-floating-status font-semibold">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // 2. Chat Panel (When Open: Matching user's exact specification & reference images)
  return (
    <div className="mymuetien-root">
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        onClick={() => setIsAiAssistantOpen(false)}
      />

      <div className="mm-panel fixed inset-x-2 bottom-20 top-14 md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[600px] md:max-h-[85vh] max-md:h-[calc(100dvh-5.5rem)] z-50 flex flex-col border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="mm-header p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Avatar circle with 3px violet ring and small green online dot */}
            <div
              className="relative w-9 h-9 rounded-full ring-[3px] ring-[#6D5DFB] p-0.5 flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: 'var(--mm-bg)' }}
            >
              <img
                src="/assets/muet_logo_seal.jpg"
                alt="MUET Seal"
                className="w-full h-full object-cover rounded-full"
              />
              <span
                className={`mm-online-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                  isOnline ? 'animate-pulse' : 'opacity-40'
                }`}
              />
            </div>

            <div>
              <h3 className="mm-title font-bold text-sm">
                MyMuetien
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-medium">
                <span className="mm-muted">MUET Agent</span>
                <span className="mm-muted">·</span>
                <span className="mm-status-green font-semibold">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="mm-btn text-xs border px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
              title="Toggle Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span className="text-[11px] font-medium">{language === 'en' ? 'EN' : 'اردو/سنڌي'}</span>
            </button>
            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="mm-btn min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border transition cursor-pointer"
              title="Minimize MyMuetien"
              aria-label="Minimize MyMuetien"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="mm-btn min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border transition cursor-pointer"
              title="Close MyMuetien"
              aria-label="Close MyMuetien"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat History Container */}
        <div className="mm-body mm-scrollbar flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs overscroll-contain">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1.5 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              {m.sender === 'user' ? (
                <div className="mm-bubble-user rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] font-medium shadow-md break-words leading-relaxed">
                  {m.text}
                </div>
              ) : (
                <div className="space-y-2 max-w-[90%]">
                  {/* Bot Text Bubble */}
                  {m.text && (
                    <div className="mm-bubble-bot border rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm break-words leading-relaxed whitespace-pre-line">
                      {m.text}
                    </div>
                  )}

                  {/* Rich Answer Card matching user's design reference */}
                  {m.richCard && (
                    <div className="mm-card border rounded-xl p-3 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                      <div className="flex items-center gap-3">
                        <div className="mm-card-badge w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 font-black text-xs">
                          {m.richCard.number.replace(/\D/g, '') || '03'}
                        </div>
                        <div>
                          <h4 className="mm-title font-bold text-sm">
                            {m.richCard.number}
                          </h4>
                          <p className="mm-muted text-[11px]">
                            {m.richCard.route}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="mm-eta font-bold text-sm">
                          {m.richCard.eta}
                        </p>
                        <p className="mm-status-green text-[11px] font-semibold">
                          {m.richCard.status}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Unsure / Delay Action Button */}
                  {m.actionButton && (
                    <button
                      onClick={m.actionButton.action}
                      className="mm-action-btn mt-1 border px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{m.actionButton.label}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing dots indicator */}
          {isTyping && (
            <div className="mm-typing-pill inline-flex items-center gap-1.5 border px-3 py-2 rounded-full shadow-sm animate-pulse">
              <span className="mm-typing-dot w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="mm-typing-dot w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="mm-typing-dot w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Strip matching user's design reference */}
        <div className="mm-suggestions-bar px-3 py-2 border-t overflow-x-auto flex items-center gap-2 text-xs no-scrollbar shrink-0">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="mm-chip shrink-0 border rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Composer Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mm-composer-bar p-3 border-t flex items-center gap-2 shrink-0 safe-area-bottom"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask MyMuetien..."
            className="mm-input flex-1 text-xs rounded-xl px-3.5 py-2.5 border focus:outline-none focus:ring-1 focus:ring-[#6D5DFB] min-w-0 transition"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="w-9 h-9 rounded-xl bg-[#6D5DFB] hover:bg-[#5e4dfa] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-md shadow-violet-950/40 shrink-0 cursor-pointer touch-feedback"
            title="Send Message"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
