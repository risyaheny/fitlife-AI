import React, { useState, useEffect } from "react";
import { 
  Heart, User as UserIcon, LogOut, Flame, Droplet, 
  TrendingDown, Plus, Trash2, CheckCircle2, RotateCcw, 
  Camera, Send, Sparkles, MessageCircle, AlertCircle, 
  Dumbbell, Clock, Info, Bell, Menu, X, Calendar, LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserData, UserProfile, Meal, Workout, Reminder } from "../types";

// Import modular sub-components
import DailyWorkoutTab from "./DailyWorkoutTab";
import FoodScannerTab from "./FoodScannerTab";
import AICoachTab from "./AICoachTab";
import ProfileTab from "./ProfileTab";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

type TabType = "overview" | "workout" | "pindai" | "coach" | "profil";

export default function Dashboard({ userEmail, onLogout }: DashboardProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Main Data States
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Inputs for overview meal logger
  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState("");
  const [mealType, setMealType] = useState("Sarapan");

  // Form Inputs for weight progress logger
  const [newWeight, setNewWeight] = useState("");
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingWeight, setSavingWeight] = useState(false);

  // Notifications state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "info" | "success" }>>([]);

  // Fetch complete data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/data", {
        headers: { "x-user-email": userEmail }
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Gagal memuat data kesehatan.");
      }
      setData(resData.data);
    } catch (err: any) {
      setError(err.message || "Gagal menyambung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userEmail]);

  // Toast helper
  const triggerNotification = (title: string, body: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message: `${title}: ${body}`, type: "success" }]);
    
    // Auto speak if audio alerts preferred (optional, fully offline-friendly)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Add Manual Meal on Overview Tab
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || !mealCalories) return;

    try {
      const response = await fetch("/api/user/meals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ name: mealName, calories: mealCalories, type: mealType })
      });
      
      if (!response.ok) throw new Error("Gagal menyimpan makanan.");
      
      setMealName("");
      setMealCalories("");
      triggerNotification("Nutrisi Tercatat", `Berhasil menambahkan hidangan ${mealName}.`);
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete logged meal
  const handleDeleteMeal = async (id: string) => {
    try {
      await fetch(`/api/user/meals/${id}`, { 
        method: "DELETE",
        headers: { "x-user-email": userEmail }
      });
      fetchUserData();
    } catch (err) {
      console.error(err);
    }
  };

  // Water log helper
  const handleLogWater = async (amount: number) => {
    try {
      const response = await fetch("/api/user/water", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error();
      triggerNotification("Hidrasi Bertambah", `Ditambahkan ${amount} ml air minum.`);
      fetchUserData();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Water
  const handleResetWater = async () => {
    try {
      await fetch("/api/user/water/reset", {
        method: "POST",
        headers: { "x-user-email": userEmail }
      });
      triggerNotification("Hidrasi Direset", "Pencatatan air minum dikembalikan ke nol.");
      fetchUserData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save New Weight
  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;
    const weightVal = parseFloat(newWeight);
    if (isNaN(weightVal) || weightVal <= 0) {
      alert("Masukkan berat badan yang valid.");
      return;
    }

    setSavingWeight(true);
    try {
      const response = await fetch("/api/user/weight", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ weight: weightVal, date: newWeightDate })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menyimpan berat badan.");
      }
      
      setNewWeight("");
      triggerNotification("Berat Badan Dicatat", `Berhasil mencatat berat badan baru: ${weightVal} kg.`);
      fetchUserData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan berat badan.");
    } finally {
      setSavingWeight(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RotateCcw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Memuat portal FitLife AI Anda...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Gagal Memuat Data</h3>
          <p className="text-slate-600 text-sm mt-2 mb-6">{error || "Sesi login tidak sah"}</p>
          <button 
            onClick={fetchUserData}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const p = data.profile;
  const loggedMeals = data.meals || [];
  const loggedWorkouts = data.workouts || [];
  const weightHistory = data.weightHistory || [];

  // Strict profile completeness check for onboarding
  const isProfileComplete = 
    p.isProfileComplete && 
    p.name?.trim() && 
    p.age > 0 && 
    p.gender && 
    p.height > 0 && 
    p.weight > 0 && 
    p.targetWeight > 0 && 
    p.dailyActivity && 
    p.goal && 
    p.preferences?.trim() && 
    p.allergies?.trim() && 
    p.medicalHistory?.trim() && 
    p.budget;

  // Intercept for Onboarding Flow
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Simple Header */}
        <header className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-40 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500 text-white rounded-2xl">
                <Heart className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-none">FitLife <span className="text-emerald-400">AI</span></span>
                <span className="text-[8px] text-slate-400 font-mono tracking-wider">ONBOARDING PORTAL</span>
              </div>
            </div>
            <div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-mono rounded font-bold uppercase tracking-widest">FITLIFE PORTAL</span>
                <span className="text-xs text-slate-400 font-mono">PENGGUNA BARU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">Lengkapi Profil Kesehatan Anda 🌟</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Halo, {p.name}! Selamat datang di FitLife AI. Harap lengkapi informasi biometrik dan preferensi Anda agar kami dapat memformulasikan kalori, nutrisi, serta program latihan harian Anda secara spesifik dan akurat.
              </p>
            </div>
          </div>

          <ProfileTab 
            data={data}
            userEmail={userEmail}
            fetchUserData={fetchUserData}
            triggerNotification={triggerNotification}
            isOnboarding={true}
          />
        </main>
      </div>
    );
  }

  // Calculating BMI safely
  const bmi = p.height > 0 ? p.weight / ((p.height / 100) * (p.height / 100)) : 0;
  let bmiStatus = "Normal";
  let bmiColor = "text-emerald-500 bg-emerald-50";
  let bmiRangeDesc = "Kondisi ideal. Jaga pola makan & rutinitas Anda.";

  if (bmi < 18.5) {
    bmiStatus = "Kurang";
    bmiColor = "text-amber-500 bg-amber-50";
    bmiRangeDesc = "Tingkatkan kalori padat nutrisi & latihan kekuatan otot.";
  } else if (bmi >= 25 && bmi < 30) {
    bmiStatus = "Kelebihan";
    bmiColor = "text-orange-500 bg-orange-50";
    bmiRangeDesc = "Kurangi asupan gula & tingkatkan latihan kardio.";
  } else if (bmi >= 30) {
    bmiStatus = "Obesitas";
    bmiColor = "text-rose-500 bg-rose-50";
    bmiRangeDesc = "Konsultasikan dengan ahli medis atau kurangi kalori harian.";
  }

  // Calculating Calories
  const totalCaloriesIn = loggedMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalCaloriesBurned = loggedWorkouts.filter(w => w.status === "Completed").reduce((acc, w) => acc + w.calories, 0);
  const netCalories = totalCaloriesIn - totalCaloriesBurned;

  // Navigation Items definitions
  const NAV_ITEMS = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "workout", label: "Jadwal Olahraga", icon: Dumbbell },
    { id: "pindai", label: "Pindai Makanan", icon: Camera },
    { id: "coach", label: "Coach AI & Analisis", icon: Sparkles },
    { id: "profil", label: "Profil Pengguna", icon: UserIcon },
  ];

  const todayStr = new Date().toLocaleDateString("sv-SE");
  const isTodayStreakClaimed = p.claimedStreakDates?.includes(todayStr) || false;
  const currentHour = new Date().getHours();

  let welcomeTitle = "Selamat Datang Kembali! 👋";
  let welcomeText = (
    <>
      Target: <strong className="text-emerald-400 font-bold">{p.goal}</strong> &bull; {p.weight} kg ke {p.targetWeight} kg dengan pola makan <strong className="text-emerald-400 font-bold">{p.preferences}</strong>.
    </>
  );

  if (currentHour >= 20 && !isTodayStreakClaimed) {
    welcomeTitle = "Pertahankan Momentum Sehatmu! 🔥";
    welcomeText = (
      <span>
        Hari hampir berakhir dan streak harianmu belum menyala! Jangan biarkan perjuanganmu terputus hari ini. Selesaikan sesi olahraga dan klaim streak kebugaran Anda sekarang untuk menjaga momentum tetap menyala! Kamu pasti bisa! 💪🚀
      </span>
    );
  } else if (p.isNewUser) {
    welcomeTitle = `Selamat Datang di FitLife AI, ${p.name}! 🎉`;
    welcomeText = (
      <span>
        Senang sekali membantu Anda memulai perjalanan sehat ini. Target utama Anda adalah <strong className="text-emerald-400 font-bold">{p.goal}</strong>. Mari sesuaikan gizi harian dan olahraga Anda bersama bimbingan AI pintar kami!
      </span>
    );
  } else {
    welcomeTitle = `Selamat Datang Kembali, ${p.name}! 👋`;
    welcomeText = (
      <>
        Target: <strong className="text-emerald-400 font-bold">{p.goal}</strong> &bull; {p.weight} kg ke {p.targetWeight} kg dengan pola makan <strong className="text-emerald-400 font-bold">{p.preferences}</strong>.
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* TOAST PANEL */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-slate-900/90 text-white shadow-2xl rounded-2xl flex items-center gap-3 backdrop-blur-md pointer-events-auto"
            >
              <div className="p-1 bg-emerald-500 rounded-lg text-white">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold flex-1 leading-normal">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOP NAVBAR (ELEGANT, UNIFIED & RESPONSIVE) */}
      <header className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand/Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-white rounded-2xl">
              <Heart className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block leading-none">FitLife <span className="text-emerald-400">AI</span></span>
              <span className="text-[8px] text-slate-400 font-mono tracking-wider">HEALTH WORKSPACE</span>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10" 
                      : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: User Quick Stats & Logout */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5">
              {p.photo ? (
                <img 
                  src={p.photo} 
                  alt="Profile" 
                  className="w-7 h-7 rounded-full object-cover border border-emerald-400"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-left">
                <span className="text-[10px] font-bold text-white block leading-tight">{p.name}</span>
                <span className="text-[9px] text-amber-400 block font-mono leading-none">🔥 {p.streak || 0}d streak</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer transition-all border border-transparent hover:border-rose-900/30"
              title="Keluar Akun"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mobile Right: Hamburger and Streak */}
          <div className="flex lg:hidden items-center gap-2.5">
            <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
              🔥 {p.streak || 0}d
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-4 space-y-4 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? "bg-emerald-500 text-white shadow" 
                        : "bg-slate-850 hover:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                {p.photo ? (
                  <img src={p.photo} alt="User" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="font-semibold text-slate-300 truncate max-w-[120px]">{p.name}</span>
              </div>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg font-bold"
              >
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-y-auto">
        
        {/* TAB RENDERING VIEWPORTS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* WELCOME HEADER HERO */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-mono rounded font-bold uppercase tracking-widest">FITLIFE PORTAL</span>
                  <span className="text-xs text-slate-400 font-mono">DIPERSIAPKAN UNTUK: {p.name.toUpperCase()}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black mt-1">{welcomeTitle}</h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  {welcomeText}
                </p>
              </div>

              {/* Dynamic Health Streak Badge */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3 w-full md:w-auto">
                <Flame className="w-8 h-8 text-orange-400 fill-orange-500 animate-pulse" />
                <div>
                  <span className="text-[9px] text-slate-300 block font-mono font-bold uppercase leading-none">SEHAT STREAK</span>
                  <span className="text-lg font-black text-white block mt-0.5 leading-none">🔥 {p.streak || 0} Hari!</span>
                </div>
              </div>
            </div>

            {/* QUICK HEALTH METRICS DASHBOARD */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* BMI Card */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">Status BMI</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${bmiColor}`}>
                      {bmiStatus}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{bmi.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">kg/m²</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-slate-100 pt-3">
                  {bmiRangeDesc}
                </p>
              </div>

              {/* Weight Log Card */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">BERAT BADAN</span>
                    <TrendingDown className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{p.weight}</span>
                    <span className="text-xs text-slate-400">kg / Target: {p.targetWeight} kg</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Progres Grafik</span>
                    <span>Sisa {Math.abs(p.weight - p.targetWeight).toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(10, Math.min(100, (p.targetWeight / p.weight) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Daily Calories Target Card */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">TARGET ASUPAN KALORI</span>
                    <Flame className="w-4.5 h-4.5 text-orange-500" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{p.calorieTarget}</span>
                    <span className="text-xs text-slate-400">kkal / hari</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-slate-100 pt-3">
                  Pola aktivitas harian bernilai <span className="font-semibold text-slate-700">{p.dailyActivity}</span>.
                </p>
              </div>

            </div>

            {/* BALANCE OF CALORIES TRACKING & MEALS ENTRY */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                Keseimbangan Energi Harian ({new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Visual Ring progress */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="8" fill="transparent" 
                        strokeDasharray={301.6}
                        strokeDashoffset={301.6 - (301.6 * Math.min(1, totalCaloriesIn / p.calorieTarget))}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black text-slate-800">{totalCaloriesIn}</span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wide font-mono">TERMAKAN</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-xs">
                    <p className="text-slate-500 font-medium">Batas Target: <span className="font-bold text-slate-700">{p.calorieTarget} kkal</span></p>
                    <p className="text-slate-500 font-medium">Latihan Terbakar: <span className="font-bold text-rose-500">{totalCaloriesBurned} kkal</span></p>
                    <p className="text-emerald-600 font-extrabold mt-2 font-mono">Net: {netCalories} kkal</p>
                  </div>
                </div>

                {/* Form to log raw meals */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Estimasi Makro Nutrisi</h4>
                    <div className="grid grid-cols-3 gap-3 font-mono">
                      <div className="p-2 bg-emerald-50 rounded-xl text-center">
                        <span className="text-[9px] text-emerald-600 font-bold block">PROTEIN</span>
                        <span className="text-sm font-extrabold text-slate-800">{Math.round(totalCaloriesIn * 0.04)}g</span>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-xl text-center">
                        <span className="text-[9px] text-amber-600 font-bold block">KARBOHIDRAT</span>
                        <span className="text-sm font-extrabold text-slate-800">{Math.round(totalCaloriesIn * 0.12)}g</span>
                      </div>
                      <div className="p-2 bg-rose-50 rounded-xl text-center">
                        <span className="text-[9px] text-rose-600 font-bold block">LEMAK</span>
                        <span className="text-sm font-extrabold text-slate-800">{Math.round(totalCaloriesIn * 0.03)}g</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleAddMeal} className="border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Pencatatan Makanan Manual</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Gado-Gado, Jus Alpukat"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                        className="sm:col-span-5 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        required
                        placeholder="Kalori (kkal)"
                        value={mealCalories}
                        onChange={(e) => setMealCalories(e.target.value)}
                        className="sm:col-span-3 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="sm:col-span-3 px-2 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="Sarapan">Sarapan</option>
                        <option value="Makan Siang">Makan Siang</option>
                        <option value="Makan Malam">Makan Malam</option>
                        <option value="Cemilan">Cemilan</option>
                      </select>
                      <button
                        type="submit"
                        className="sm:col-span-1 p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* Meals list */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Daftar Log Makanan Hari Ini</h4>
                {loggedMeals.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-bold">Belum ada log makanan hari ini. Mulai catat makanan pertamamu.</p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {loggedMeals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-all">
                        <div>
                          <span className="text-xs font-bold text-slate-800">{meal.name}</span>
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 font-bold uppercase rounded font-mono">{meal.type}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-xs font-extrabold text-slate-700">{meal.calories} kkal</span>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* WATER TRACKER & WEIGHT GRAPH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* WATER TRACKER (REDESIGNED TO PERFECTLY MATCH THE WEIGHT PROGRESS CARD) */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-sky-500" />
                      Pelacak Hidrasi Harian
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pantau asupan air minum harian Anda untuk menjaga hidrasi & metabolisme tubuh.</p>
                  </div>
                  <div className="bg-sky-50 text-sky-800 px-3 py-1.5 rounded-xl text-xs font-bold font-mono self-start sm:self-center">
                    Hari Ini: {data.waterTracker?.current || 0} ml
                  </div>
                </div>

                {/* FORM/BUTTONS: Tambah Asupan Air Minum */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-sky-500" />
                    Pencatatan Cepat Air Minum
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                    <button
                      onClick={() => handleLogWater(250)}
                      className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all text-center shadow-md flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 250ml
                    </button>
                    <button
                      onClick={() => handleLogWater(500)}
                      className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all text-center shadow-md flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 500ml
                    </button>
                    <button
                      onClick={() => handleLogWater(-250)}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition-all text-center border border-slate-200"
                    >
                      -250ml
                    </button>
                    <button
                      onClick={handleResetWater}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl cursor-pointer transition-all text-center border border-rose-100 flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                </div>

                {/* VISUALIZATION: Gelas Hidrasi & Status */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Status Hidrasi Tubuh</h4>
                  <div className="h-48 w-full bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-6 relative">
                    
                    {/* Visual Glass */}
                    <div className="relative w-20 h-32 bg-sky-50/50 border-2 border-sky-300 rounded-b-3xl rounded-t-sm overflow-hidden flex flex-col justify-end shadow-inner shrink-0">
                      <div 
                        className="bg-gradient-to-t from-sky-400 to-sky-300 w-full transition-all duration-700"
                        style={{ height: `${Math.min(100, ((data.waterTracker?.current || 0) / (data.waterTracker?.target || 2000)) * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center font-mono">
                        <span className="text-xs font-black text-sky-800">
                          {Math.round(((data.waterTracker?.current || 0) / (data.waterTracker?.target || 2000)) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Stats & Description */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">PROGRESS METRIK</span>
                        <div className="text-2xl font-black text-slate-800 leading-none mt-1">
                          {data.waterTracker?.current || 0} <span className="text-xs text-slate-400 font-normal font-sans">/ {data.waterTracker?.target || 2000} ml</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-sky-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (((data.waterTracker?.current || 0) / (data.waterTracker?.target || 2000)) * 100))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>0 ml</span>
                          <span>Target: {data.waterTracker?.target || 2000} ml</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-normal">
                        Mengkonsumsi air minum yang cukup sangat penting untuk mempercepat proses metabolisme, pembakaran kalori, dan menjaga konsentrasi Anda sepanjang hari.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* HISTORIC WEIGHT PROGRESS & LOGS CHART */}
              {(() => {
                const weights = weightHistory.map((w: any) => w.weight);
                const minW = weights.length > 0 ? Math.min(...weights) : p.weight || 60;
                const maxW = weights.length > 0 ? Math.max(...weights) : p.weight || 60;
                
                // Pad limits slightly so the chart has breathing room
                const minY = Math.max(0, Math.floor(minW - 3));
                const maxY = Math.ceil(maxW + 3);
                const midY = (minY + maxY) / 2;
                const yRange = maxY - minY || 1;

                const viewWidth = 400;
                const viewHeight = 150;

                const mappedPoints = weightHistory.map((w: any, idx: number) => {
                  const x = weightHistory.length > 1 
                    ? (idx / (weightHistory.length - 1)) * viewWidth 
                    : viewWidth / 2;
                  const y = viewHeight - ((w.weight - minY) / yRange) * viewHeight;
                  return { x, y, weight: w.weight, date: w.date };
                });

                const svgPoints = mappedPoints.map((pt: any) => `${pt.x},${pt.y}`).join(" ");
                const svgAreaPath = mappedPoints.length > 0
                  ? `M ${mappedPoints[0].x} ${viewHeight} L ${mappedPoints.map((pt: any) => `${pt.x} ${pt.y}`).join(" L ")} L ${mappedPoints[mappedPoints.length - 1].x} ${viewHeight} Z`
                  : "";

                return (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-emerald-500" />
                          Progress & Manajemen Berat Badan
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Pantau fluktuasi berat badan Anda secara berkala menuju berat badan ideal.</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold font-mono self-start sm:self-center">
                        Sekarang: {p.weight} kg
                      </div>
                    </div>

                    {/* FORM: Tambah Berat Badan Baru */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        Tambah Berat Badan Baru
                      </h4>
                      <form onSubmit={handleSaveWeight} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Berat Badan (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            placeholder="Contoh: 68.5"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Tanggal</label>
                          <input
                            type="date"
                            required
                            value={newWeightDate}
                            onChange={(e) => setNewWeightDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            disabled={savingWeight}
                            className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {savingWeight ? "Menyimpan..." : "Simpan Berat Badan"}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* CHART: Custom SVG Chart with Sumbu X and Sumbu Y */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Grafik Perkembangan Berat Badan</h4>
                      {weightHistory.length === 0 ? (
                        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-150">
                          <p className="text-xs text-slate-400 italic">Belum ada riwayat perkembangan berat badan.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-64 w-full bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between relative">
                            {/* Chart Title Indicator */}
                            <div className="absolute top-2 left-2 text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 z-10">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Visualisasi Berat (kg) vs Tanggal
                            </div>

                            {/* Chart Body */}
                            <div className="relative flex-1 mt-6 flex">
                              
                              {/* Sumbu Y (Berat badan - kg) */}
                              <div className="w-14 flex flex-col justify-between text-[9px] font-mono text-slate-400 text-right pr-2 select-none border-r border-slate-200/80">
                                <span className="font-bold">{maxY.toFixed(1)} kg</span>
                                <span>{midY.toFixed(1)} kg</span>
                                <span className="font-bold">{minY.toFixed(1)} kg</span>
                              </div>

                              {/* Graph Area */}
                              <div className="flex-1 relative h-full pl-2">
                                {/* Horizontal Grid lines */}
                                <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none">
                                  <div className="w-full border-t border-dashed border-slate-200" />
                                  <div className="w-full border-t border-dashed border-slate-200" />
                                  <div className="w-full border-b border-dashed border-slate-200" />
                                </div>

                                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="none">
                                  {/* Area Gradient */}
                                  {svgAreaPath && (
                                    <>
                                      <path
                                        d={svgAreaPath}
                                        fill="url(#weight-gradient-dash)"
                                        opacity="0.15"
                                      />
                                      <defs>
                                        <linearGradient id="weight-gradient-dash" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#10b981" />
                                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                    </>
                                  )}

                                  {/* Line */}
                                  {svgPoints && (
                                    <polyline
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="3.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      points={svgPoints}
                                    />
                                  )}

                                  {/* Dots */}
                                  {mappedPoints.map((pt: any, idx: number) => (
                                    <g key={idx} className="group cursor-pointer">
                                      <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="5"
                                        className="fill-emerald-500 stroke-white stroke-2 hover:fill-emerald-600 transition-all"
                                      />
                                      <title>{`${pt.date}: ${pt.weight} kg`}</title>
                                    </g>
                                  ))}
                                </svg>
                              </div>

                            </div>

                            {/* Sumbu X (Tanggal) */}
                            <div className="h-6 flex items-center justify-between text-[9px] font-mono text-slate-400 pl-14 border-t border-slate-200/80 mt-1 select-none">
                              <span>{weightHistory[0]?.date}</span>
                              {weightHistory.length > 2 && (
                                <span className="opacity-60">{weightHistory[Math.floor(weightHistory.length / 2)]?.date}</span>
                              )}
                              <span>{weightHistory[weightHistory.length - 1]?.date}</span>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>

                    {/* TABLE: Riwayat Berat Badan */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        Riwayat Berat Badan (Tabel)
                      </h4>
                      {weightHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Belum ada catatan tabel berat badan.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                          <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                              <tr>
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5">Berat Badan</th>
                                <th className="px-4 py-2.5 text-right">Perubahan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white font-mono">
                              {[...weightHistory].reverse().map((w: any, rIdx: number) => {
                                // Since we reversed it to show newest on top, we calculate diff based on original array index
                                const originalIdx = weightHistory.length - 1 - rIdx;
                                let changeText = "-";
                                let changeColor = "text-slate-400";
                                
                                if (originalIdx > 0) {
                                  const diff = w.weight - weightHistory[originalIdx - 1].weight;
                                  if (diff > 0) {
                                    changeText = `+${diff.toFixed(1)} kg`;
                                    changeColor = "text-amber-500 font-bold";
                                  } else if (diff < 0) {
                                    changeText = `${diff.toFixed(1)} kg`;
                                    changeColor = "text-emerald-500 font-bold";
                                  } else {
                                    changeText = "0.0 kg";
                                    changeColor = "text-slate-400";
                                  }
                                }
                                
                                return (
                                  <tr key={originalIdx} className="hover:bg-slate-50/50 transition-all">
                                    <td className="px-4 py-2 text-slate-850 font-semibold">{w.date}</td>
                                    <td className="px-4 py-2 font-bold text-slate-800">{w.weight} kg</td>
                                    <td className={`px-4 py-2 text-right ${changeColor}`}>{changeText}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>

          </div>
        )}

        {activeTab === "workout" && (
          <DailyWorkoutTab 
            data={data}
            userEmail={userEmail}
            fetchUserData={fetchUserData}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === "pindai" && (
          <FoodScannerTab 
            data={data}
            userEmail={userEmail}
            fetchUserData={fetchUserData}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === "coach" && (
          <AICoachTab 
            data={data}
            userEmail={userEmail}
            fetchUserData={fetchUserData}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === "profil" && (
          <ProfileTab 
            data={data}
            userEmail={userEmail}
            fetchUserData={fetchUserData}
            triggerNotification={triggerNotification}
          />
        )}

      </main>

    </div>
  );
}
