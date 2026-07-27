import React, { useState, useEffect } from "react";
import { Sparkles, MessageCircle, Send, RefreshCw, Cpu, CheckCircle2, AlertCircle, HelpCircle, History, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserData } from "../types";

interface AICoachTabProps {
  data: UserData;
  userEmail: string;
  fetchUserData: () => void;
  triggerNotification: (title: string, body: string) => void;
}

export default function AICoachTab({ data, userEmail, fetchUserData, triggerNotification }: AICoachTabProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);

  // Multi-session chat history states
  const [sessions, setSessions] = useState<Array<{
    id: string;
    title: string;
    timestamp: string;
    messages: Array<{ sender: "user" | "ai"; text: string }>;
  }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Sync sessions when userEmail changes or on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`fitlife_chat_sessions_${userEmail}`);
      const parsed = saved ? JSON.parse(saved) : [];
      setSessions(parsed);
      setCurrentSessionId(null);
      setIsSessionActive(false);
      setChatMessages([]);
    } catch {
      setSessions([]);
    }
  }, [userEmail]);

  // Save sessions to localStorage
  const saveSessionsAndSync = (updatedSessions: typeof sessions) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(`fitlife_chat_sessions_${userEmail}`, JSON.stringify(updatedSessions));
    } catch (err) {
      console.error("Gagal menyimpan riwayat chat:", err);
    }
  };

  // Create a brand new session
  const handleStartNewSession = () => {
    const newId = Date.now().toString();
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const formattedDate = now.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const title = `Sesi Chat - ${formattedDate} ${formattedTime}`;

    const initialMsg = {
      sender: "ai" as const,
      text: "Halo! Saya Coach FitLife AI pribadi Anda. Tekan tombol 'Mulai Analisis Biometrik AI' di atas untuk melihat ringkasan kondisi tubuh Anda, atau tanyakan apa saja seputar kesehatan, pola makan, dan latihan fisik Anda di sini."
    };

    const newSession = {
      id: newId,
      title,
      timestamp: now.toISOString(),
      messages: [initialMsg]
    };

    const updated = [newSession, ...sessions];
    saveSessionsAndSync(updated);
    setCurrentSessionId(newId);
    setChatMessages([initialMsg]);
    setIsSessionActive(true);
    triggerNotification("Sesi Chat Dimulai", "Sesi baru berhasil dibuat. Coach AI siap melayani Anda.");
  };

  // Select an old session
  const handleSelectSession = (sessionId: string) => {
    const found = sessions.find(s => s.id === sessionId);
    if (found) {
      setCurrentSessionId(sessionId);
      setChatMessages(found.messages);
      setIsSessionActive(true);
      triggerNotification("Sesi Chat Dimuat", `Melanjutkan: ${found.title}`);
    }
  };

  // Delete a session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessionsAndSync(updated);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setChatMessages([]);
      setIsSessionActive(false);
    }
    triggerNotification("Sesi Dihapus", "Sesi obrolan berhasil dihapus dari riwayat.");
  };

  const p = data.profile;
  const bmi = p.weight / ((p.height / 100) * (p.height / 100));

  // BMI Interpretation
  let bmiStatus = "Normal";
  let bmiColor = "text-emerald-500 bg-emerald-50";
  let bmiRangeDesc = "Kondisi ideal. Jaga pola makan & rutinitas Anda.";

  if (bmi < 18.5) {
    bmiStatus = "Kekurangan Berat Badan";
    bmiColor = "text-amber-500 bg-amber-50";
    bmiRangeDesc = "Tingkatkan kalori padat nutrisi & latihan kekuatan otot.";
  } else if (bmi >= 25 && bmi < 30) {
    bmiStatus = "Kelebihan Berat Badan";
    bmiColor = "text-orange-500 bg-orange-50";
    bmiRangeDesc = "Kurangi asupan gula/minyak & tingkatkan latihan kardio.";
  } else if (bmi >= 30) {
    bmiStatus = "Obesitas";
    bmiColor = "text-rose-500 bg-rose-50";
    bmiRangeDesc = "Rekomendasi diet defisit kalori ketat dan konsultasikan medis.";
  }

  // Trigger Deep Biometric report
  const handleAnalyzeBiometrics = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-biometrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({})
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Gagal menganalisis biometrics.");
      }
      setAiAnalysis(resData.analysis);
      
      const biometricsText = `🧬 **ANALISIS BIOMETRIK SELESAI:**\n\n**BMI:** ${resData.analysis.bmiAnalysis}\n\n**Energi & Kalori:** ${resData.analysis.calorieStatus}\n\n**Rekomendasi Menu:**\n${resData.analysis.mealRecommendations.map((r: string) => `• ${r}`).join("\n")}\n\n**Saran Latihan Fisik:**\n${resData.analysis.workoutRecommendations.map((w: string) => `• ${w}`).join("\n")}\n\n**Saran Hidrasi:** ${resData.analysis.hydrationAdvice}`;

      const aiMsgObj = { sender: "ai" as const, text: biometricsText };

      // Determine session to update or create
      let targetSessionId = currentSessionId;
      let currentSessions = [...sessions];

      if (!targetSessionId || !isSessionActive) {
        // Create a new session for the biometric report
        const newId = Date.now().toString();
        const now = new Date();
        const formattedTime = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const formattedDate = now.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        
        const initialMsg = {
          sender: "ai" as const,
          text: "Halo! Saya Coach FitLife AI pribadi Anda. Tekan tombol 'Mulai Analisis Biometrik AI' di atas untuk melihat ringkasan kondisi tubuh Anda, atau tanyakan apa saja seputar kesehatan, pola makan, dan latihan fisik Anda di sini."
        };

        const newSession = {
          id: newId,
          title: `Biometrik - ${formattedDate} ${formattedTime}`,
          timestamp: now.toISOString(),
          messages: [initialMsg, aiMsgObj]
        };

        currentSessions = [newSession, ...currentSessions];
        saveSessionsAndSync(currentSessions);
        setCurrentSessionId(newId);
        setChatMessages([initialMsg, aiMsgObj]);
        setIsSessionActive(true);
      } else {
        // Update existing session
        const updated = sessions.map(s => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              messages: [...s.messages, aiMsgObj]
            };
          }
          return s;
        });
        saveSessionsAndSync(updated);
        setChatMessages(prev => [...prev, aiMsgObj]);
      }

      triggerNotification("Analisis AI Selesai", "Kecerdasan Buatan telah menyusun rekomendasi personal Anda!");
    } catch (err: any) {
      alert(err.message || "Gagal melakukan analisis.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit chat query to coach
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || !isSessionActive || !currentSessionId) return;

    const userMsg = chatQuery.trim();
    const userMessageObj = { sender: "user" as const, text: userMsg };
    
    // 1. Instantly append user message to chatMessages and update active session
    const newChatMessages = [...chatMessages, userMessageObj];
    setChatMessages(newChatMessages);
    setChatQuery("");
    setSendingChat(true);

    // Update sessions list immediately with user message
    const updatedSessionsWithUser = sessions.map(s => {
      if (s.id === currentSessionId) {
        // Auto-generate a better title if default is used
        let newTitle = s.title;
        if (s.messages.length <= 1) {
          newTitle = userMsg.length > 28 ? userMsg.substring(0, 25) + "..." : userMsg;
        }
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMessageObj]
        };
      }
      return s;
    });
    saveSessionsAndSync(updatedSessionsWithUser);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ message: userMsg, history: chatMessages })
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Gagal menghubungi AI Coach.");
      }
      
      const aiMessageObj = { sender: "ai" as const, text: resData.text };
      const finalChatMessages = [...newChatMessages, aiMessageObj];
      setChatMessages(finalChatMessages);

      // Update sessions list with AI response
      const updatedSessionsWithAI = updatedSessionsWithUser.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMessageObj]
          };
        }
        return s;
      });
      saveSessionsAndSync(updatedSessionsWithAI);

    } catch (err: any) {
      const errorMessageObj = { sender: "ai" as const, text: "Maaf, terjadi kesalahan saat menghubungi Coach AI: " + err.message };
      const errorChatMessages = [...newChatMessages, errorMessageObj];
      setChatMessages(errorChatMessages);

      const updatedSessionsWithError = updatedSessionsWithUser.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, errorMessageObj]
          };
        }
        return s;
      });
      saveSessionsAndSync(updatedSessionsWithError);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-mono rounded font-bold uppercase tracking-wider">FITLIFE KONSULTAN PRIBADI</span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">🧬 Coach Kebugaran AI & Deep Analisis</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Sistem analisis gizi & latihan cerdas berbasis biometrik. Hubungkan data berat badan, tinggi badan, alergi, dan preferensi diet untuk konsultasi dinamis.
          </p>
        </div>

        <button
          onClick={handleAnalyzeBiometrics}
          disabled={analyzing}
          className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg disabled:opacity-50 cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {analyzing ? "Menganalisis..." : "Mulai Analisis Biometrik AI"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE BIOMETRIC DETAILS & REPORT PANELS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* USER BIOMETRIC STATS COMPACT CARD */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
              Kondisi Tubuh Saat Ini
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 block font-bold">INDEKS MASSA TUBUH (BMI)</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{bmi.toFixed(1)}</span>
                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-lg mt-1 ${bmiColor}`}>
                  {bmiStatus}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 block font-bold font-mono">BERAT BADAN</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{p.weight} kg</span>
                <span className="text-[9px] text-slate-400 block mt-1">Target: {p.targetWeight} kg</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
              <strong>Saran Berat Badan:</strong> {bmiRangeDesc}
            </p>
          </div>

          {/* DISPLAY GEMINI GENERATED REPORTS IF AVAILABLE */}
          {aiAnalysis ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-500" />
                Rekomendasi Pintar Gemini
              </h3>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-slate-800 uppercase text-[10px] text-emerald-600">REKOMENDASI HIDANGAN:</h4>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {aiAnalysis.mealRecommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-800 uppercase text-[10px] text-emerald-600">RUTINITAS OLAHRAGA DISARANKAN:</h4>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {aiAnalysis.workoutRecommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-extrabold text-slate-800 uppercase text-[10px] text-sky-600">ANALOGI HIDRASI:</h4>
                  <p className="mt-1 bg-sky-50 text-sky-800 p-2.5 rounded-xl border border-sky-100">{aiAnalysis.hydrationAdvice}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center py-10 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">Belum Ada Analisis Mendalam</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Silakan tekan tombol <strong>Mulai Analisis Biometrik AI</strong> di atas untuk memicu kecerdasan buatan menyusun rancangan diet & fitnes ideal untuk Anda.
              </p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INTERACTIVE CHAT PANEL */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex overflow-hidden h-[520px]">
            
            {/* SESSION HISTORY PANEL */}
            <div className={`border-r border-slate-100 bg-slate-50 flex-col shrink-0 transition-all duration-300 ${
              showHistory ? "w-60 flex" : "w-0 hidden md:w-52 md:flex"
            }`}>
              <div className="p-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riwayat Sesi</span>
                    <button
                      onClick={handleStartNewSession}
                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      + Sesi Baru
                    </button>
                  </div>
                  
                  {/* Session List */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                    {sessions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-[10px] leading-relaxed">
                        Belum ada riwayat sesi. Mulai sesi baru di atas atau ajukan pertanyaan.
                      </div>
                    ) : (
                      sessions.map((s) => {
                        const isCurrent = s.id === currentSessionId;
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSelectSession(s.id)}
                            className={`group p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isCurrent
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                                : "bg-white border-slate-100 hover:bg-slate-100 text-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-emerald-500" : "text-slate-400"}`} />
                              <span className="truncate block leading-tight">{s.title}</span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(s.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded transition-all"
                              title="Hapus Sesi"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                  FitLife Coach Pro
                </div>
              </div>
            </div>

            {/* MAIN WORKSPACE CHAT PANEL */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between h-full min-w-0 bg-white">
              <div className="flex flex-col h-full justify-between">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Toggle button for history sidebar */}
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer animate-pulse"
                      title="Sembunyikan/Tampilkan Riwayat Sesi"
                    >
                      <History className="w-4 h-4 text-emerald-600" />
                    </button>
                    
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800">FitLife AI Chat Coach</h3>
                      <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> {isSessionActive ? "Sesi Berjalan (Gemini)" : "Sesi Tidak Aktif"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSessionActive && (
                      <button
                        onClick={() => {
                          setIsSessionActive(false);
                          setCurrentSessionId(null);
                          setChatMessages([]);
                          triggerNotification("Sesi Chat Diakhiri", "Sesi aktif telah ditutup. Riwayat tetap tersimpan aman.");
                        }}
                        className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-[9px] font-bold text-rose-600 cursor-pointer transition-all flex items-center gap-1"
                        title="Akhiri Sesi & Simpan Obrolan"
                      >
                        Akhiri Sesi 🛑
                      </button>
                    )}
                    <button
                      onClick={handleAnalyzeBiometrics}
                      disabled={analyzing}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Refresh Analisis"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Chat Body: Active vs Inactive Session */}
                {!isSessionActive ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full animate-bounce">
                      <MessageCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Sesi Chat AI Belum Dimulai</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                        Mulai sesi konsultasi gizi & olahraga dengan FitLife AI. Riwayat obrolan Anda akan tersimpan rapi untuk setiap sesi baru, memudahkan Anda meninjau saran latihan fisik dan hidrasi sebelumnya.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartNewSession}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> Mulai Sesi Chat Baru 💬
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    {/* Chat messages */}
                    <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 text-xs mb-3">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            msg.sender === "user" 
                              ? "bg-slate-900 text-white font-medium shadow-sm" 
                              : "bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap shadow-sm"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}

                      {sendingChat && (
                        <div className="flex justify-start">
                          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl italic flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                            Coach sedang memproses keluhan & menyusun analisis Anda...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Submission */}
                    <form onSubmit={handleSendChat} className="border-t border-slate-100 pt-3 flex gap-2 shrink-0">
                      <input
                        type="text"
                        placeholder="Tanyakan resep sehat, gejala sakit, keluhan porsi makan..."
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={sendingChat || !chatQuery.trim()}
                        className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
                
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
