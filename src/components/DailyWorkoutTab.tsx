import React, { useState, useEffect } from "react";
import { Dumbbell, Clock, Play, Pause, RotateCcw, CheckCircle2, Trash2, Calendar, Flame, AlertCircle, Plus } from "lucide-react";
import { UserData } from "../types";

interface DailyWorkoutTabProps {
  data: UserData;
  userEmail: string;
  fetchUserData: () => void;
  triggerNotification: (title: string, body: string) => void;
}

interface PresetExercise {
  name: string;
  detail: string; // e.g., "3 Set x 12 Reps" or "Sesi 1: 5 menit"
  estCalories: number;
  durationMin: number;
}

interface DayRoutine {
  dayName: string;
  focus: string;
  exercises: PresetExercise[];
}

const PRESET_ROUTINES: Record<string, DayRoutine> = {
  "Senin": {
    dayName: "Senin",
    focus: "Dada & Trisep (Push Day)",
    exercises: [
      { name: "Flat Bench Press", detail: "4 Set x 12 Repetisi (Istirahat 90s)", estCalories: 120, durationMin: 12 },
      { name: "Incline Dumbbell Press", detail: "3 Set x 12 Repetisi (Istirahat 60s)", estCalories: 90, durationMin: 10 },
      { name: "Push Up Klasik", detail: "3 Set x 15 Repetisi (Istirahat 45s)", estCalories: 60, durationMin: 8 },
      { name: "Overhead Dumbbell Extension", detail: "3 Set x 12 Repetisi (Istirahat 60s)", estCalories: 70, durationMin: 8 }
    ]
  },
  "Selasa": {
    dayName: "Selasa",
    focus: "Punggung & Bisep (Pull Day)",
    exercises: [
      { name: "Pull-up / Lat Pulldown", detail: "4 Set x 10 Repetisi (Istirahat 90s)", estCalories: 110, durationMin: 12 },
      { name: "Bent Over Barbell Row", detail: "3 Set x 12 Repetisi (Istirahat 75s)", estCalories: 100, durationMin: 10 },
      { name: "Dumbbell Bicep Curl", detail: "3 Set x 12 Repetisi (Istirahat 60s)", estCalories: 60, durationMin: 8 },
      { name: "Hammer Curl", detail: "3 Set x 12 Repetisi (Istirahat 45s)", estCalories: 55, durationMin: 8 }
    ]
  },
  "Rabu": {
    dayName: "Rabu",
    focus: "Kaki & Bahu (Lower & Shoulder)",
    exercises: [
      { name: "Barbell Back Squat", detail: "4 Set x 12 Repetisi (Istirahat 90s)", estCalories: 150, durationMin: 15 },
      { name: "Dumbbell Shoulder Press", detail: "3 Set x 12 Repetisi (Istirahat 75s)", estCalories: 85, durationMin: 10 },
      { name: "Dumbbell Walking Lunges", detail: "3 Set x 15 Langkah (Istirahat 60s)", estCalories: 95, durationMin: 10 },
      { name: "Lateral Raise", detail: "3 Set x 15 Repetisi (Istirahat 45s)", estCalories: 50, durationMin: 8 }
    ]
  },
  "Kamis": {
    dayName: "Kamis",
    focus: "Istirahat Aktif & Yoga",
    exercises: [
      { name: "Peregangan Dinamis (Stretching)", detail: "Sesi 1: 10 Menit Santai", estCalories: 30, durationMin: 10 },
      { name: "Vinyasa Yoga Pose", detail: "Sesi 2: 20 Menit Fokus Pernapasan", estCalories: 80, durationMin: 20 },
      { name: "Meditasi Relaksasi AI", detail: "Sesi 3: 10 Menit Pikiran Tenang", estCalories: 15, durationMin: 10 }
    ]
  },
  "Jumat": {
    dayName: "Jumat",
    focus: "Full Body HIIT & Cardio",
    exercises: [
      { name: "Jumping Jack", detail: "3 Sesi x 1 Menit (Istirahat 30s)", estCalories: 75, durationMin: 5 },
      { name: "Burpees Energik", detail: "3 Sesi x 45 Detik (Istirahat 45s)", estCalories: 90, durationMin: 5 },
      { name: "Mountain Climber", detail: "3 Sesi x 1 Menit (Istirahat 30s)", estCalories: 70, durationMin: 5 },
      { name: "High Plank Hold", detail: "3 Sesi x 1 Menit (Istirahat 30s)", estCalories: 40, durationMin: 5 }
    ]
  },
  "Sabtu": {
    dayName: "Sabtu",
    focus: "Cardio & Core",
    exercises: [
      { name: "Lari / Jogging Interval", detail: "Sesi 1: 30 Menit Luar Ruangan", estCalories: 280, durationMin: 30 },
      { name: "Abdominal Crunches", detail: "3 Set x 20 Repetisi (Istirahat 45s)", estCalories: 45, durationMin: 8 },
      { name: "Hanging Leg Raise", detail: "3 Set x 15 Repetisi (Istirahat 60s)", estCalories: 50, durationMin: 8 },
      { name: "Plank Klasik", detail: "3 Set x 1 Menit Tahan (Istirahat 45s)", estCalories: 40, durationMin: 6 }
    ]
  },
  "Minggu": {
    dayName: "Minggu",
    focus: "Pemulihan & Relaksasi Aktif",
    exercises: [
      { name: "Peregangan Statis Menyeluruh", detail: "Sesi 1: 15 Menit Pemulihan Otot", estCalories: 40, durationMin: 15 },
      { name: "Jalan Kaki Santai", detail: "Sesi 2: 20 Menit Menghirup Udara Segar", estCalories: 70, durationMin: 20 }
    ]
  }
};

export default function DailyWorkoutTab({ data, userEmail, fetchUserData, triggerNotification }: DailyWorkoutTabProps) {
  // Get current day name
  const getCurrentDayName = () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const d = new Date();
    return days[d.getDay()];
  };

  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDayName());

  // Dynamic Week Dates generator
  const getDatesForCurrentWeek = () => {
    const current = new Date();
    const day = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
    // Monday (Senin) is the first day of our tracker week
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const dates: Record<string, { dateStr: string; formatted: string }> = {};

    daysOfWeek.forEach((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const formatted = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      dates[dayName] = { dateStr, formatted };
    });

    return dates;
  };

  const weekDates = getDatesForCurrentWeek();
  const selectedDayDate = weekDates[selectedDay]?.dateStr || new Date().toISOString().split("T")[0];
  const selectedDayFormatted = weekDates[selectedDay]?.formatted || "";

  // Timer state
  const [timerExerciseName, setTimerExerciseName] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [initialTime, setInitialTime] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerTargetCal, setTimerTargetCal] = useState<number>(50);
  const [timerTargetDuration, setTimerTargetDuration] = useState<number>(10);

  // Manual Exercise inputs for Empty State
  const [manualName, setManualName] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingManual, setSavingManual] = useState(false);

  // Load workout details to timer
  const handleStartTimer = (exerciseName: string, durationSec: number, estCalories: number, durationMin: number) => {
    setTimerExerciseName(exerciseName);
    setTimeLeft(durationSec);
    setInitialTime(durationSec);
    setIsTimerRunning(true);
    setTimerTargetCal(estCalories);
    setTimerTargetDuration(durationMin);
    triggerNotification("Timer Dimulai", `Waktunya fokus latihan: ${exerciseName}`);
  };

  // Timer Effect
  useEffect(() => {
    let intervalId: any = null;
    if (isTimerRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if ("speechSynthesis" in window) {
        const speak = new SpeechSynthesisUtterance("Latihan selesai! Kerja bagus!");
        speak.lang = "id-ID";
        window.speechSynthesis.speak(speak);
      }
      triggerNotification("Sesi Selesai!", `Selamat! Anda menyelesaikan latihan: ${timerExerciseName}`);
    }
    return () => clearInterval(intervalId);
  }, [isTimerRunning, timeLeft]);

  // Log completed exercise directly from Timer
  const handleLogCompletedFromTimer = async () => {
    if (!timerExerciseName) return;
    try {
      const response = await fetch("/api/user/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          name: timerExerciseName,
          duration: timerTargetDuration,
          calories: timerTargetCal,
          status: "Completed",
          date: selectedDayDate
        })
      });

      if (!response.ok) throw new Error();

      triggerNotification("Olahraga Tercatat!", `Sesi ${timerExerciseName} tersimpan.`);
      setTimerExerciseName(null);
      fetchUserData();
    } catch (err) {
      alert("Gagal menyimpan aktivitas latihan.");
    }
  };

  // Log custom manual workout (for empty state and general use)
  const handleSaveManualWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualDuration || !manualCalories) return;

    setSavingManual(true);
    try {
      const response = await fetch("/api/user/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          name: manualName,
          duration: parseInt(manualDuration),
          calories: parseInt(manualCalories),
          status: "Completed",
          date: manualDate
        })
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan aktivitas olahraga.");
      }

      setManualName("");
      setManualDuration("");
      setManualCalories("");
      triggerNotification("Olahraga Tercatat!", `Berhasil mencatat aktivitas: ${manualName}.`);
      fetchUserData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan olahraga.");
    } finally {
      setSavingManual(false);
    }
  };

  // Delete log workout
  const handleDeleteWorkout = async (id: string) => {
    try {
      await fetch(`/api/user/workouts/${id}`, {
        method: "DELETE",
        headers: { "x-user-email": userEmail }
      });
      fetchUserData();
    } catch (err) {
      console.error(err);
    }
  };

  // Complete planned workout directly from lists
  const handleCompleteWorkout = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/user/workouts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ status: "Completed" })
      });

      if (!response.ok) throw new Error();

      triggerNotification("Aktivitas Selesai!", `Latihan ${name} diselesaikan.`);
      fetchUserData();
    } catch (err) {
      alert("Gagal memperbarui status.");
    }
  };

  const loggedWorkouts = data.workouts || [];
  const currentDayRoutine = PRESET_ROUTINES[selectedDay];

  // Helper to check if preset exercise is completed for current selected week day
  const isExerciseCompleted = (exName: string) => {
    return loggedWorkouts.some(
      w => w.name === exName && w.date === selectedDayDate && w.status === "Completed"
    );
  };

  const allExercisesCompleted = currentDayRoutine.exercises.every(ex => isExerciseCompleted(ex.name));
  const isStreakClaimed = data.profile.claimedStreakDates?.includes(selectedDayDate) || false;

  // Formatting time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loggedWorkouts.length === 0) {
    return (
      <div className="space-y-6">
        {/* HEADER SECTION WITHOUT STREAK (Streak is 0 for new user) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-500" />
            Pelacak Aktivitas Kebugaran
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mulai catat olahraga Anda secara mandiri untuk mengaktifkan grafik, tantangan harian, dan streak sehat Anda.
          </p>
        </div>

        {/* Empty State with custom Form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
            <Dumbbell className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800">Belum Ada Riwayat Olahraga</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Anda belum mencatat aktivitas olahraga apa pun. Mulai catat olahraga pertama Anda sekarang juga untuk memicu pelacakan kebugaran personal Anda!
            </p>
          </div>

          {/* Form to log the first exercise */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 text-left space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Catat Olahraga Pertama Anda
            </h4>

            <form onSubmit={handleSaveManualWorkout} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Nama Olahraga / Latihan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jogging, Bersepeda, Yoga"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Durasi (Menit)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 30"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Kalori Terbakar (kkal)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 200"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Tanggal</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingManual}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savingManual ? "Menyimpan..." : "Simpan & Aktifkan Fitur Kebugaran 🚀"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION WITH STREAK BADGE */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-500" />
            Jadwal Olahraga Mingguan Dinamis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lihat rutinitas latihan harian Anda dari Senin hingga Minggu lengkap dengan kalender mingguan dinamis, set, dan timer latihan.
          </p>
        </div>

        {/* Dynamic Flame Streak Counter */}
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="relative">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-800 uppercase font-mono tracking-wider leading-none">STREAK SEHAT</div>
            <div className="text-xl font-black text-amber-900 leading-none mt-1">🔥 {data.profile.streak || 0} Hari!</div>
          </div>
        </div>
      </div>

      {/* WEEKLY SWITCHER CONTAINER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 text-center sm:text-left">PILIH HARI JADWAL RENCANA LATIHAN MINGGU INI:</span>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {Object.keys(PRESET_ROUTINES).map((day) => {
            const isToday = getCurrentDayName() === day;
            const isSelected = selectedDay === day;
            const dayInfo = weekDates[day];
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-2.5 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                  isSelected
                    ? "bg-slate-900 border-slate-950 text-white shadow-md scale-105"
                    : isToday
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                }`}
              >
                <span>{day}</span>
                <span className="text-[9px] font-mono opacity-75 font-normal leading-none block">{dayInfo?.formatted || ""}</span>
                {isToday && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* TWO COLUMN GRID: LEFT: SELECTED DAY ROUTINES, RIGHT: THE TIMER & SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE DAY ROUTINE DETAILS */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* STREAK CLAIM PANEL */}
          {allExercisesCompleted && (
            <div className={`p-5 rounded-3xl border text-center transition-all ${
              isStreakClaimed 
                ? "bg-emerald-50/50 border-emerald-100 text-slate-600" 
                : "bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-600 text-white shadow-lg animate-pulse"
            }`}>
              {isStreakClaimed ? (
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <h4 className="text-sm font-black text-slate-800">Streak Hari Ini Telah Diklaim!</h4>
                  <p className="text-xs text-slate-500">
                    Seluruh latihan hari {selectedDay} ({selectedDayFormatted}) selesai dan streak Anda telah berhasil ditambahkan. Kerja bagus!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Flame className="w-10 h-10 text-amber-300 fill-amber-400 mx-auto" />
                  <h4 className="text-sm font-black">Luar Biasa! Semua Sesi Selesai</h4>
                  <p className="text-xs text-emerald-100">
                    Anda telah menyelesaikan seluruh {currentDayRoutine.exercises.length} sesi olahraga untuk hari {selectedDay} ({selectedDayFormatted}). Klaim streak harian Anda sekarang!
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const claimedStreakDates = data.profile.claimedStreakDates || [];
                        const response = await fetch("/api/user/profile", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "x-user-email": userEmail
                          },
                          body: JSON.stringify({
                            streak: (data.profile.streak || 0) + 1,
                            claimedStreakDates: [...claimedStreakDates, selectedDayDate]
                          })
                        });
                        if (!response.ok) throw new Error();
                        triggerNotification("Streak Bertambah!", `🔥 Selamat! Streak Anda kini menjadi ${(data.profile.streak || 0) + 1} hari.`);
                        fetchUserData();
                      } catch (err) {
                        alert("Gagal mengklaim streak.");
                      }
                    }}
                    className="px-5 py-2 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
                  >
                    Klaim Streak Hari Ini 🔥
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest font-mono">FOKUS HARI {selectedDay.toUpperCase()} ({selectedDayFormatted}):</span>
                <h3 className="text-lg font-black text-slate-800 leading-tight mt-0.5">{currentDayRoutine.focus}</h3>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            {/* List of preset movements */}
            <div className="space-y-3.5">
              {currentDayRoutine.exercises.map((ex, idx) => {
                const isCompleted = isExerciseCompleted(ex.name);
                return (
                  <div 
                    key={idx} 
                    className={`p-4 border rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all group ${
                      isCompleted 
                        ? "bg-emerald-50/20 border-emerald-100/50" 
                        : "bg-slate-50/70 border-slate-100 hover:bg-slate-50 hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 border text-xs font-bold flex items-center justify-center rounded-lg shadow-sm shrink-0 ${
                        isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-white border-slate-200 text-slate-600 font-mono"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4.5 h-4.5" /> : idx + 1}
                      </div>
                      <div>
                        <h4 className={`text-xs font-extrabold transition-colors ${
                          isCompleted ? "text-slate-400 line-through" : "text-slate-800 group-hover:text-emerald-700"
                        }`}>{ex.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 animate-none" />
                          {ex.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono leading-none">Estimasi Bakar</span>
                        <span className={`text-xs font-extrabold ${isCompleted ? "text-slate-400" : "text-orange-500"}`}>{ex.estCalories} kkal</span>
                      </div>

                      {/* Quick Trigger Buttons */}
                      <div className="flex gap-1.5">
                        {isCompleted ? (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Selesai
                          </span>
                        ) : (
                          <>
                            {/* Start Timer */}
                            <button
                              onClick={() => handleStartTimer(ex.name, ex.durationMin * 60, ex.estCalories, ex.durationMin)}
                              className="p-1.5 bg-slate-900 text-white hover:bg-emerald-600 rounded-lg cursor-pointer transition-all"
                              title="Mulai Timer untuk latihan ini"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            {/* Log Immediately */}
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch("/api/user/workouts", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      "x-user-email": userEmail
                                    },
                                    body: JSON.stringify({
                                      name: ex.name,
                                      duration: ex.durationMin,
                                      calories: ex.estCalories,
                                      status: "Completed",
                                      date: selectedDayDate
                                    })
                                  });
                                  if (!response.ok) throw new Error();
                                  triggerNotification("Sesi Selesai!", `Sesi ${ex.name} telah disimpan ke catatan harian.`);
                                  fetchUserData();
                                } catch (err) {
                                  alert("Gagal menyimpan olahraga.");
                                }
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-all"
                              title="Tandai langsung selesai hari ini"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl flex gap-2.5 mt-5">
              <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-800 leading-normal">
                <strong>Tips Kebugaran:</strong> Selesaikan seluruh sesi di atas agar tombol <strong>Klaim Streak 🔥</strong> muncul. Konsistensi harian merupakan kunci utama dalam mencapai tubuh sehat idaman Anda!
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REUSABLE TIMERS & SUMMARY HISTORIES */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* THE TIMER BOX */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-emerald-500" />
              Sesi Timer Latihan Interaktif
            </h3>

            {timerExerciseName ? (
              <div className="text-center space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">SEDANG BERJALAN:</span>
                  <h4 className="text-xs font-extrabold text-slate-800">{timerExerciseName}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Sesi: {timerTargetDuration} Menit &bull; {timerTargetCal} kkal</p>
                </div>

                {/* Main countdown clock */}
                <div className="relative flex items-center justify-center my-2">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="56" 
                      stroke="#10b981" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={351.8}
                      strokeDashoffset={351.8 - (351.8 * (timeLeft / initialTime))}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold font-mono tracking-wide">COUNTDOWN</span>
                  </div>
                </div>

                {/* Play, Pause, Reset Controls */}
                <div className="flex justify-center gap-2">
                  {isTimerRunning ? (
                    <button 
                      onClick={() => setIsTimerRunning(false)}
                      className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Pause className="w-3.5 h-3.5" /> Jeda
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsTimerRunning(true)}
                      disabled={timeLeft === 0}
                      className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" /> Lanjut
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setTimeLeft(initialTime);
                      setIsTimerRunning(false);
                    }}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                  <button
                    onClick={handleLogCompletedFromTimer}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                  >
                    Tandai Selesai & Simpan Log Kalori
                  </button>
                  <button
                    onClick={() => setTimerExerciseName(null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    Batal Sesi Timer
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-extrabold text-slate-700">Timer Belum Aktif</h4>
                <p className="text-[11px] text-slate-500">
                  Pilih salah satu gerakan latihan di samping kiri dan klik tombol <strong>Mulai (Play)</strong> untuk memicu alarm jeda istirahat harian Anda di sini.
                </p>
                <div className="pt-2">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Atur Timer Manual Cepat:</span>
                  <div className="flex justify-center gap-1.5 mt-1.5">
                    <button 
                      onClick={() => handleStartTimer("Istirahat Antar Set", 30, 0, 0.5)}
                      className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg hover:border-emerald-300"
                    >
                      30 Detik
                    </button>
                    <button 
                      onClick={() => handleStartTimer("Istirahat Panjang", 60, 0, 1)}
                      className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg hover:border-emerald-300"
                    >
                      60 Detik
                    </button>
                    <button 
                      onClick={() => handleStartTimer("Plank Challenge", 120, 20, 2)}
                      className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg hover:border-emerald-300"
                    >
                      2 Menit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LIST OF COMPLETED WORKOUTS FOR CURRENT SELECTION */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-3">Sesi Olahraga Selesai ({selectedDayFormatted})</span>
            {loggedWorkouts.filter(w => w.date === selectedDayDate && w.status === "Completed").length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada riwayat olahraga hari ini. Mulai catat aktivitas pertamamu.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {loggedWorkouts.filter(w => w.date === selectedDayDate && w.status === "Completed").map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold block leading-tight text-slate-500 line-through">
                          {w.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {w.duration} m | {w.calories} kkal terbakar
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Selesai
                      </span>
                      <button
                        onClick={() => handleDeleteWorkout(w.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Hapus Log"
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

      </div>

    </div>
  );
}
