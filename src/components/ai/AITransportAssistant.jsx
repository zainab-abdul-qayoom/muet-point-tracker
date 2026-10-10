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
    buses,
    routes,
    notifications,
    currentUser
  } = useApp();

  const [language, setLanguage] = useState('en'); // 'en' | 'ur'
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Salam ${currentUser.name?.split(' ')[0] || 'Student'}! I am your MUET Point AI Assistant. You can ask me anything about university bus schedules, live arrivals, less crowded points, or traffic delays in English or Urdu/Sindhi.`,
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isAiAssistantOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0b1b14] border border-emerald-800 rounded-2xl w-full max-w-lg h-[620px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0d2a1e] to-[#0c2219] border-b border-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>MUET Point AI Assistant</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">
                  GPT-Powered
                </span>
              </h3>
              <p className="text-[11px] text-emerald-400/80">
                Natural-language fleet tracking & multilingual guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="text-xs bg-[#122e22] text-emerald-300 border border-emerald-800 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-[#183d2d] transition"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'English' : 'اردو / Sindhi'}</span>
            </button>
            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestions Strip */}
        <div className="p-2.5 bg-[#091711] border-b border-emerald-950/80 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Quick:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="shrink-0 bg-[#0f241c] hover:bg-[#153427] text-emerald-300 border border-emerald-900/60 rounded-full px-3 py-1 text-[11px] transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-bold text-[11px]'
                    : 'bg-[#153427] text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {m.sender === 'user' ? (
                  currentUser.initials || 'ZA'
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md font-medium'
                    : 'bg-[#0f241c] border border-emerald-900/60 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-line text-[11.5px]">{m.text}</div>
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
              <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
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
          className="p-3 bg-[#0d2219] border-t border-emerald-950 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI in English or Urdu: 'Bus 03 kab aayegi?'..."
            className="flex-1 bg-[#091711] text-xs text-slate-200 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 border border-emerald-900/70 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center transition shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
