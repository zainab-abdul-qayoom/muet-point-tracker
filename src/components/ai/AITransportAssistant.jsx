import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Bus,
  Clock,
  Navigation,
  Globe2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AITransportAssistant() {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    currentUser,
    buses,
    routes,
    notifications,
    dataError
  } = useApp();

  const isOnline = !dataError;
  const [language, setLanguage] = useState('en'); // 'en' | 'ur'
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Salam ${currentUser.name?.split(' ')[0] || 'Student'}! I am MyMuetien, your MUET Point AI Assistant. You can ask me anything about university bus schedules, live arrivals, less crowded points, or traffic delays in English or Urdu/Sindhi.`,
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    { label: 'When is Bus 03 coming?', query: 'When is Bus 03 arriving at Academic Block?' },
    { label: 'Point to Qasimabad?', query: 'Which bus goes to Qasimabad?' },
    { label: 'بس کب پہنچے گی؟ (Urdu)', query: 'Bus 03 kab pohnchegi?' },
    { label: 'بس ڪڏھن پھچندي؟ (Sindhi)', query: 'Bus 03 kadhan aendi sindhi' },
    { label: 'Suggest less crowded bus', query: 'Recommend the least crowded bus right now' },
    { label: 'Summarize today\'s delays', query: 'Summarize today delays and traffic status' }
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

    // AI Knowledge Engine response generator
    setTimeout(() => {
      const lower = text.toLowerCase();
      let responseText = '';

      const bus03 = buses.find((b) => b.number === 'Bus 03') || buses[1] || { number: 'Bus 03', eta: '4 min', speed: '38 km/h', currentLocationName: 'Academic Block', nextStopName: 'Engineering Faculty', driverName: 'Ahmed Khan', driverPhone: '+92 301 9876543', passengers: 48, capacity: 65 };
      const bus01 = buses.find((b) => b.number === 'Bus 01') || buses[0] || { number: 'Bus 01', eta: '2 min', currentLocationName: 'MUET Main Gate' };
      const bus05 = buses.find((b) => b.number === 'Bus 05') || buses[2] || { number: 'Bus 05', eta: '8 min', currentLocationName: 'Kotri Barrage' };
      const bus07 = buses.find((b) => b.number === 'Bus 07') || buses[3] || { number: 'Bus 07', eta: '12 min', currentLocationName: 'Qasim Chowk' };

      if (lower.includes('sindhi') || lower.includes('ڪڏھن') || lower.includes('پھچندي') || lower.includes('سنڌي') || lower.includes('aendi') || lower.includes('kadhan')) {
        responseText = `🚌 **بس 03 جي تفصيل (Sindhi - Bus 03 Info):**
بس 03 ھن وقت **${bus03.currentLocationName || 'Academic Block'}** وٽ آھي ۽ پھچڻ جو امڪاني وقت تقريباً **${bus03.eta}** آھي. ڊرائيور **${bus03.driverName || 'احمد خان'}** روٽ تي آھن. جامعہ مھران جي روٽ 02 تي ٽريفڪ روان دوان آھي. ڪل سيٽون: ${bus03.passengers || 48}/${bus03.capacity || 65} (آرامده حالت).`;
      } else if (lower.includes('kab') || lower.includes('kithay') || lower.includes('urdu') || lower.includes('point kab') || lower.includes('پہنچے') || lower.includes('کب')) {
        responseText = `🚌 **بس 03 کی تفصیلات (Urdu - Bus 03 Info):**
بس 03 فی الوقت **${bus03.currentLocationName || 'Academic Block'}** کے قریب ہے اور متوقع آمد کا وقت تقریباً **${bus03.eta}** ہے۔ ڈرائیور **${bus03.driverName || 'احمد خان'}** آن روٹ ہیں۔ جامعہ مہران کے روٹ 02 پر ٹریفک رواں دواں ہے۔ مسافر گنجائش: ${bus03.passengers || 48}/${bus03.capacity || 65} (مناسب)۔`;
      } else if (lower.includes('bus 03') || lower.includes('academic block') || lower.includes('when is bus 03')) {
        responseText = `🚍 **Bus 03 (Main Campus ➔ Tando Bago):**
Currently at **${bus03.currentLocationName}**, proceeding towards **${bus03.nextStopName}**.
- **Estimated Arrival:** ${bus03.eta}
- **Current Speed:** ${bus03.speed}
- **Driver:** ${bus03.driverName} (${bus03.driverPhone})
- **Seating:** ${bus03.passengers}/${bus03.capacity} occupied (Comfortable).`;
      } else if (lower.includes('qasimabad') || lower.includes('route 05')) {
        responseText = `🚏 **Buses servicing Qasimabad:**
- **Bus 04 (Route 05):** Currently at Nasim Nagar Chowk, ETA 7 min.
- **Bus 10:** Operating via Prince Town & Alamdar Chowk.
Both buses connect MUET Main Gate directly to Qasimabad without toll delays.`;
      } else if (lower.includes('hala') || lower.includes('matiari')) {
        responseText = `🛣️ **Route 01 (Main Campus ➔ Hala):**
- **Bus 01:** Near MUET Main Gate, ETA ${bus01.eta}.
- **Bus 08:** En route to Hatri Bypass & Matiari Phatak. Total journey: ~42 km.`;
      } else if (lower.includes('crowd') || lower.includes('least crowded') || lower.includes('rush')) {
        responseText = `👥 **Occupancy & Seating Recommendation:**
- **Least Crowded:** **Bus 10** (Only 30/60 seats filled, Low Rush).
- **Optimal:** **Bus 03** (${bus03.passengers}/65 seats filled, Comfortable).
- **High Rush Alert:** **Bus 05** to DMC is at high capacity (58/60 seats). Recommend taking Bus 06 as alternate.`;
      } else if (lower.includes('delay') || lower.includes('traffic') || lower.includes('summarize')) {
        responseText = `⚠️ **AI Transport Status & Delay Summary:**
1. **Bus 03:** Minor 5-min delay logged near Jamshoro Bypass road works.
2. **Route 02:** Normal flow restored past Wadhu Wah road.
3. **Punctuality Metric:** 94.2% of university points are operating strictly on schedule today.`;
      } else {
        responseText = `ℹ️ I scanned all 12 university points across Jamshoro & Hyderabad.
- **Active Fleet:** ${buses.filter((b) => b.isOnline).length} buses running.
- **Your Saved Route:** ${currentUser.savedRouteName || 'Main Campus ➔ Tando Bago'}.
- **Nearest Point Arrival:** ${bus03.number} arriving at ${currentUser.nearestStop || 'Academic Block'} in ${bus03.eta}.
Let me know if you would like walking directions or morning schedule timings!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: responseText,
          time: 'Just now'
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  // 1. Floating Assistant Bubble (When Closed)
  if (!isAiAssistantOpen) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#6D5DFB] to-[#8B5CF6] hover:from-[#5e4dfa] hover:to-[#7c3aed] text-white pl-2 pr-3.5 py-1.5 sm:py-2 rounded-full shadow-[0_8px_25px_-4px_rgba(109,93,251,0.45)] hover:shadow-[0_10px_30px_-2px_rgba(139,92,246,0.6)] border border-violet-300/30 transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ring-1 ring-white/10"
          title="Open MyMuetien Assistant"
          aria-label="Open MyMuetien AI Assistant"
        >
          {/* Identity Avatar with official project MUET seal */}
          <div className="relative w-8 h-8 rounded-full bg-[#111827] border border-violet-200/40 p-0.5 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/assets/muet_logo_seal.jpg"
              alt="MUET Agent"
              className="w-full h-full object-contain rounded-full"
            />
            {/* Status dot on avatar: Green #22C55E */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111827] ${
                isOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>

          {/* Assistant Name & Real Availability Status */}
          <div className="flex flex-col text-left pr-0.5">
            <span className="font-bold text-xs text-white leading-tight flex items-center gap-1.5 drop-shadow-sm">
              <span>MyMuetien</span>
              <Sparkles className="w-3 h-3 text-violet-200 shrink-0" />
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-violet-100 font-medium leading-tight">
              <span
                className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                  isOnline ? 'bg-[#22C55E] ring-1 ring-white/40' : 'bg-slate-400'
                }`}
              />
              <span className="tracking-wide">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // 2. Chat Panel (When Open: Floating on Desktop, Safe-Sized on Mobile)
  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        onClick={() => setIsAiAssistantOpen(false)}
      />

      <div className="fixed inset-x-2 bottom-20 top-16 md:inset-auto md:bottom-6 md:right-6 md:w-[410px] md:h-[590px] md:max-h-[85vh] z-50 flex flex-col bg-[#111827] border border-violet-500/25 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-violet-950/40 border border-violet-500/30 p-1 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/muet_logo_seal.jpg"
                alt="MUET Agent"
                className="w-full h-full object-contain rounded-lg"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${
                  isOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>MyMuetien</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 font-bold px-1.5 py-0.5 rounded border border-violet-500/30">
                  MUET Agent
                </span>
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-medium">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-[#22C55E]' : 'bg-slate-400'
                  }`}
                />
                <span className={isOnline ? 'text-slate-200 font-semibold' : 'text-slate-400'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Transit Telemetry</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="text-xs bg-slate-800/90 text-violet-300 hover:text-white border border-slate-700 hover:border-violet-500/40 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-violet-950/40 transition cursor-pointer"
              title="Toggle Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] font-medium">{language === 'en' ? 'EN' : 'اردو/سنڌي'}</span>
            </button>
            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close / Minimize MyMuetien"
              aria-label="Close MyMuetien"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestions Strip */}
        <div className="p-2 bg-[#0b1120] border-b border-slate-800/80 overflow-x-auto flex items-center gap-1.5 text-xs no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-violet-400/80 uppercase tracking-wider shrink-0 pl-1">
            Quick:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="shrink-0 bg-[#1e293b]/70 hover:bg-violet-950/60 text-slate-300 hover:text-violet-200 border border-slate-700/60 hover:border-violet-500/40 rounded-full px-2.5 py-0.5 text-[10.5px] transition cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs overscroll-contain bg-[#111827]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-[#6D5DFB] to-[#8B5CF6] text-white font-bold text-[11px] shadow-sm'
                    : 'bg-[#1e293b] text-violet-400 border border-violet-500/30'
                }`}
              >
                {m.sender === 'user' ? (
                  currentUser?.initials || 'ZA'
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-2.5 leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-[#6D5DFB] to-[#7C3AED] text-white rounded-tr-none shadow-md shadow-violet-950/30 font-medium'
                    : 'bg-[#1e293b] border border-slate-700/80 text-slate-100 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line text-[11.5px] break-words">{m.text}</div>
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-violet-200/90' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
              <Bot className="w-4 h-4 text-violet-400 animate-spin" />
              <span className="italic text-[11px]">Analyzing MUET fleet telemetry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-2.5 bg-[#0f172a] border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask MyMuetien: 'Bus 03 kab aayegi?'..."
            className="flex-1 bg-[#1e293b]/80 text-xs text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2 border border-slate-700/80 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 min-w-0 transition"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#6D5DFB] to-[#8B5CF6] hover:from-[#5e4dfa] hover:to-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-md shadow-violet-950/40 shrink-0 cursor-pointer"
            title="Send Message"
            aria-label="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}
