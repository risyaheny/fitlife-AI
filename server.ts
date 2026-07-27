import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") }); // fallback to .env

console.log("[DEBUG] GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "YES ✓" : "NO ✗");

const app = express();
const PORT = 3001;
const DB_FILE = path.join(process.cwd(), "db.json");

// Middleware
app.use(express.json({ limit: "10mb" }));

// Helper to load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = { users: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading DB file, resetting:", err);
    return { users: [] };
  }
}

// Helper to save DB
function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing DB file:", err);
  }
}

// Lazy load Gemini
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Secrets / environment variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Resilient wrapper that tries top-tier models and falls back if they are overloaded/unavailable
async function generateContentWithFallback(params: {
  contents: any[];
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
}) {
  const ai = getGemini();
  const models = ["gemini-3.5-flash", "gemini-3.1-pro", "gemini-3-flash", "gemini-3.1-flash-lite", "gemini-2.5-pro"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[AI Engine] Menghubungi model ${model}...`);
      const config: any = {};
      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      console.log(`[AI Engine] Berhasil menggunakan model: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[AI Engine] Gagal dengan model ${model}:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`Seluruh mesin AI kami sedang mengalami kapasitas puncak/pemeliharaan. Silakan coba sesaat lagi. Detail: ${lastError?.message || lastError}`);
}

// Custom Auth Middleware using Header
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const emailHeader = req.headers["x-user-email"];
  if (!emailHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing user identity" });
  }
  const db = loadDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === (emailHeader as string).toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }
  (req as any).user = user;
  (req as any).db = db;
  next();
}

// --- API ROUTES ---

// 1. Auth - Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: "Nama lengkap minimal terdiri dari 3 karakter." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Format email tidak valid." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password minimal terdiri dari 8 karakter." });
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return res.status(400).json({ error: "Password harus mengandung kombinasi huruf dan angka." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Password dan konfirmasi password tidak sesuai." });
  }

  const db = loadDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Email sudah digunakan atau terdaftar." });
  }

  // Create new user with incomplete profile and streak of 0 to require onboarding
  const newUser = {
    id: "user_" + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password, // For simulation
    profile: {
      name: name.trim(),
      age: 0,
      gender: "",
      height: 0,
      weight: 0,
      targetWeight: 0,
      dailyActivity: "",
      goal: "",
      preferences: "",
      restrictions: "Tidak Ada",
      allergies: "",
      medicalHistory: "",
      budget: "",
      calorieTarget: 0,
      photo: "",
      streak: 0,
      isNewUser: true,
      isProfileComplete: false,
    },
    waterTracker: {
      current: 0,
      target: 2000,
      history: [],
    },
    weightHistory: [],
    scans: [],
    workouts: [],
    meals: [],
    reminders: [
      { id: "rem_1", title: "Minum Air (Gelas 1)", time: "08:00", active: true, type: "water" },
      { id: "rem_2", title: "Minum Air (Gelas 2)", time: "11:00", active: true, type: "water" },
      { id: "rem_3", title: "Minum Air (Gelas 3)", time: "14:00", active: true, type: "water" },
      { id: "rem_4", title: "Minum Air (Gelas 4)", time: "17:00", active: true, type: "water" },
      { id: "rem_5", title: "Minum Air (Gelas 5)", time: "20:00", active: true, type: "water" },
      { id: "rem_6", title: "Latihan Fisik Harian", time: "16:30", active: true, type: "workout" }
    ],
  };

  db.users.push(newUser);
  saveDB(db);

  return res.json({ success: true, message: "Akun berhasil dibuat! Silakan masuk." });
});

// 2. Auth - Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const db = loadDB();
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Email atau password salah, atau akun belum terdaftar." });
  }

  // Generate simple mock session token (email)
  return res.json({
    success: true,
    token: user.email,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
    }
  });
});

// 3. User Data Sync / Load
app.get("/api/user/data", authenticateUser, (req, res) => {
  const user = (req as any).user;
  return res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      waterTracker: user.waterTracker || { current: 0, target: 2000, history: [] },
      weightHistory: user.weightHistory || [],
      scans: user.scans || [],
      workouts: user.workouts || [],
      meals: user.meals || [],
      reminders: user.reminders || [],
    }
  });
});

// 4. Update Profile
app.post("/api/user/profile", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;

  // Update profile fields
  user.profile = {
    ...user.profile,
    ...req.body,
    isNewUser: false,
  };

  // Sync weightHistory if weight is changed
  if (req.body.weight) {
    const today = new Date().toISOString().split("T")[0];
    const weightVal = parseFloat(req.body.weight);
    if (!user.weightHistory) user.weightHistory = [];
    
    // Check if entry for today exists
    const todayIdx = user.weightHistory.findIndex((w: any) => w.date === today);
    if (todayIdx !== -1) {
      user.weightHistory[todayIdx].weight = weightVal;
    } else {
      user.weightHistory.push({ date: today, weight: weightVal });
    }
  }

  // Update the user in db array
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, profile: user.profile, weightHistory: user.weightHistory });
});

// 5. Save Meals
app.post("/api/user/meals", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { name, calories, type, date } = req.body;

  if (!name || !calories || !type) {
    return res.status(400).json({ error: "Nama makanan, kalori, dan tipe hidangan wajib diisi." });
  }

  const newMeal = {
    id: "m_" + Date.now(),
    name,
    calories: parseInt(calories),
    type,
    date: date || new Date().toISOString().split("T")[0]
  };

  if (!user.meals) user.meals = [];
  user.meals.push(newMeal);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, meals: user.meals });
});

// 6. Save Workouts
app.post("/api/user/workouts", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { name, duration, calories, status } = req.body;

  if (!name || !duration || !calories) {
    return res.status(400).json({ error: "Nama olahraga, durasi, dan kalori terbakar wajib diisi." });
  }

  const newWorkout = {
    id: "w_" + Date.now(),
    name,
    duration: parseInt(duration),
    calories: parseInt(calories),
    status: status || "Completed",
    date: new Date().toISOString().split("T")[0]
  };

  if (!user.workouts) user.workouts = [];
  user.workouts.push(newWorkout);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, workouts: user.workouts });
});

// Add New Weight Entry
app.post("/api/user/weight", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { weight, date } = req.body;

  if (!weight) {
    return res.status(400).json({ error: "Berat badan wajib diisi." });
  }

  const weightVal = parseFloat(weight);
  if (isNaN(weightVal) || weightVal <= 0) {
    return res.status(400).json({ error: "Berat badan harus berupa angka valid lebih dari 0." });
  }

  const inputDate = date || new Date().toISOString().split("T")[0];

  if (!user.weightHistory) user.weightHistory = [];
  
  // Always append as new data point (do not delete or overwrite previous history)
  user.weightHistory.push({ date: inputDate, weight: weightVal });
  
  // Sort by date ascending to ensure chronological order in charts/tables
  user.weightHistory.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Update current profile weight to latest weight entered
  user.profile.weight = weightVal;

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, weightHistory: user.weightHistory, profile: user.profile });
});

// Update Workout status
app.patch("/api/user/workouts/:id", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { id } = req.params;
  const { status } = req.body;

  if (!user.workouts) user.workouts = [];
  const wIdx = user.workouts.findIndex((w: any) => w.id === id);
  if (wIdx !== -1) {
    user.workouts[wIdx].status = status;
  }

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, workouts: user.workouts });
});

// Delete item helper
app.delete("/api/user/meals/:id", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { id } = req.params;

  user.meals = (user.meals || []).filter((m: any) => m.id !== id);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);
  return res.json({ success: true, meals: user.meals });
});

app.delete("/api/user/workouts/:id", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { id } = req.params;

  user.workouts = (user.workouts || []).filter((w: any) => w.id !== id);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);
  return res.json({ success: true, workouts: user.workouts });
});

// 7. Water Tracker Update
app.post("/api/user/water", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { amount } = req.body; // e.g., 250ml or total reset

  if (amount === undefined) {
    return res.status(400).json({ error: "Jumlah air wajib diisi." });
  }

  if (!user.waterTracker) {
    user.waterTracker = { current: 0, target: 2000, history: [] };
  }

  user.waterTracker.current = Math.max(0, user.waterTracker.current + parseInt(amount));
  
  // Update today's history
  const today = new Date().toISOString().split("T")[0];
  if (!user.waterTracker.history) user.waterTracker.history = [];
  const hIdx = user.waterTracker.history.findIndex((h: any) => h.date === today);
  if (hIdx !== -1) {
    user.waterTracker.history[hIdx].amount = user.waterTracker.current;
  } else {
    user.waterTracker.history.push({ date: today, amount: user.waterTracker.current });
  }

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, waterTracker: user.waterTracker });
});

// Update Water Target
app.post("/api/user/water/target", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({ error: "Target air wajib diisi." });
  }

  if (!user.waterTracker) {
    user.waterTracker = { current: 0, target: 2000, history: [] };
  }

  user.waterTracker.target = parseInt(target);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, waterTracker: user.waterTracker });
});

// Reset Water Tracker
app.post("/api/user/water/reset", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;

  if (!user.waterTracker) {
    user.waterTracker = { current: 0, target: 2000, history: [] };
  }
  user.waterTracker.current = 0;

  const today = new Date().toISOString().split("T")[0];
  if (!user.waterTracker.history) user.waterTracker.history = [];
  const hIdx = user.waterTracker.history.findIndex((h: any) => h.date === today);
  if (hIdx !== -1) {
    user.waterTracker.history[hIdx].amount = 0;
  } else {
    user.waterTracker.history.push({ date: today, amount: 0 });
  }

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, waterTracker: user.waterTracker });
});

// 8. Reminders Update
app.post("/api/user/reminders", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { id, active, time, title, type } = req.body;

  if (!user.reminders) user.reminders = [];

  if (id) {
    // Edit existing
    const rIdx = user.reminders.findIndex((r: any) => r.id === id);
    if (rIdx !== -1) {
      user.reminders[rIdx] = { ...user.reminders[rIdx], active, time, title };
    }
  } else {
    // Add new
    user.reminders.push({
      id: "rem_" + Date.now(),
      title: title || "Pengingat Hidrasi",
      time: time || "12:00",
      active: active !== undefined ? active : true,
      type: type || "water"
    });
  }

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);

  return res.json({ success: true, reminders: user.reminders });
});

app.delete("/api/user/reminders/:id", authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { id } = req.params;

  user.reminders = (user.reminders || []).filter((r: any) => r.id !== id);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  saveDB(db);
  return res.json({ success: true, reminders: user.reminders });
});

// 9. AI - Personalized Biometric & Progress Analysis (Highly intelligent and accurate, free!)
app.post("/api/ai/analyze-biometrics", authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { additionalQuery } = req.body;

  try {
    const ai = getGemini();

    const p = user.profile;
    const bmi = p.weight / ((p.height / 100) * (p.height / 100));
    let bmiStatus = "Normal";
    if (bmi < 18.5) bmiStatus = "Kekurangan Berat Badan";
    else if (bmi >= 25) bmiStatus = "Kelebihan Berat Badan";

    // Summarize active records to feed AI
    const workoutsStr = (user.workouts || [])
      .map((w: any) => `- ${w.name}: ${w.duration} menit, terbakar ${w.calories} kkal (${w.status}) pada ${w.date}`)
      .join("\n");

    const mealsStr = (user.meals || [])
      .map((m: any) => `- ${m.name} (${m.type}): ${m.calories} kkal pada ${m.date}`)
      .join("\n");

    const systemPrompt = `Anda adalah ahli gizi dan pelatih kebugaran AI pribadi yang sangat cerdas (tingkat akurasi minimal 90%) bernama FitLife AI.
Gunakan data biometrik pengguna, target, dan riwayat aktivitas berikut untuk memberikan rekomendasi kesehatan, pola makan, latihan fisik, dan hidrasi yang luar biasa personal.
Penting: Jawab secara profesional, ramah, dan ringkas dalam Bahasa Indonesia. Fokus pada saran praktis yang berbasis data ilmiah dan biometrik pengguna.

--- DATA BIOMETRIK & PROFIL PENGGUNA ---
- Nama: ${p.name}
- Umur: ${p.age} tahun
- Jenis Kelamin: ${p.gender}
- Tinggi: ${p.height} cm
- Berat Saat Ini: ${p.weight} kg
- Target Berat: ${p.targetWeight} kg
- BMI Saat Ini: ${bmi.toFixed(1)} (${bmiStatus})
- Aktivitas Harian: ${p.dailyActivity}
- Tujuan Utama: ${p.goal}
- Preferensi Diet: ${p.preferences}
- Pantangan: ${p.restrictions}
- Alergi: ${p.allergies}
- Riwayat Medis: ${p.medicalHistory}
- Anggaran Makanan: ${p.budget}
- Target Kalori Harian: ${p.calorieTarget} kkal
- Status Hidrasi Hari Ini: ${user.waterTracker?.current || 0} / ${user.waterTracker?.target || 2000} ml

--- RIWAYAT MAKANAN HARI INI ---
${mealsStr || "Belum mencatat makanan hari ini."}

--- RIWAYAT OLAHRAGA HARI INI ---
${workoutsStr || "Belum mencatat olahraga hari ini."}

FORMAT OUTPUT HARUS SELALU BERUPA JSON dengan skema berikut agar dapat dirender dengan indah di UI dashboard. Jangan tambahkan penjelasan teks di luar JSON.

Skema JSON:
{
  "bmiAnalysis": "Deskripsi singkat tentang status BMI pengguna dan korelasinya terhadap target berat badan.",
  "calorieStatus": "Analisis asupan kalori hari ini dibandingkan target dan aktivitas.",
  "mealRecommendations": [
    "Rekomendasi hidangan spesifik 1 untuk mencapai target berdasarkan preferensi, alergi, dan pantangan.",
    "Rekomendasi hidangan spesifik 2..."
  ],
  "workoutRecommendations": [
    "Saran olahraga spesifik 1 dengan estimasi durasi dan kalori berdasarkan level aktivitas dan target berat badan.",
    "Saran olahraga spesifik 2..."
  ],
  "hydrationAdvice": "Analisis tingkat hidrasi hari ini dan saran minum air.",
  "generalTips": [
    "Saran nutrisi/kesehatan 1",
    "Saran nutrisi/kesehatan 2"
  ]
}`;

    const userMessage = additionalQuery 
      ? `Pertanyaan Tambahan Pengguna: "${additionalQuery}". Harap sesuaikan analisis Anda agar menjawab pertanyaan ini secara mendalam di bagian 'bmiAnalysis' atau 'generalTips'.`
      : "Lakukan analisis kesehatan personal yang menyeluruh berdasarkan data biometrik saya.";

    const response = await generateContentWithFallback({
      contents: [userMessage],
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bmiAnalysis: { type: Type.STRING },
          calorieStatus: { type: Type.STRING },
          mealRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          workoutRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          hydrationAdvice: { type: Type.STRING },
          generalTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["bmiAnalysis", "calorieStatus", "mealRecommendations", "workoutRecommendations", "hydrationAdvice", "generalTips"]
      }
    });

    const resultText = response.text;
    const jsonAnalysis = JSON.parse(resultText);

    return res.json({ success: true, analysis: jsonAnalysis });
  } catch (err: any) {
    console.error("Error analyzing biometrics with Gemini:", err);
    return res.status(500).json({ error: "Gagal memproses analisis AI. " + err.message });
  }
});

// 9.5 AI - Conversational Coach Chat
app.post("/api/ai/chat", authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Pesan wajib diisi." });
  }

  try {
    const ai = getGemini();
    const p = user.profile;
    const bmi = p.weight / ((p.height / 100) * (p.height / 100));

    const systemPrompt = `Anda adalah Coach FitLife AI, konsultan kesehatan, gizi, dan kebugaran pribadi yang sangat ahli, cerdas, ramah, dan profesional.
Anda memiliki akses ke profil kesehatan pengguna saat ini untuk memberikan saran yang luar biasa personal dan akurat:
- Nama: ${p.name}
- Umur: ${p.age} tahun
- Jenis Kelamin: ${p.gender}
- Tinggi: ${p.height} cm
- Berat: ${p.weight} kg (Target: ${p.targetWeight} kg)
- BMI: ${bmi.toFixed(1)}
- Aktivitas Harian: ${p.dailyActivity}
- Tujuan Utama: ${p.goal}
- Diet & Pantangan: Preferensi diet: ${p.preferences}, Alergi: ${p.allergies}, Riwayat Medis: ${p.medicalHistory}

Tugas Anda: Jawab pertanyaan pengguna dengan cerdas, ilmiah, ramah, praktis, dan menyemangati. Fokus pada solusi gizi dan olahraga yang dipersonalisasi sesuai profil di atas. Gunakan Bahasa Indonesia yang baik dan santun. Jawablah langsung secara percakapan hangat, ringkas tapi mendalam (jangan berupa kode JSON mentah, melainkan teks percakapan biasa dengan format Markdown jika diperlukan).`;

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithFallback({
      contents,
      systemInstruction: systemPrompt,
    });

    return res.json({ success: true, text: response.text });
  } catch (err: any) {
    console.error("Error in AI Chat:", err);
    return res.status(500).json({ error: "Gagal memproses pesan AI. " + err.message });
  }
});

// 10. AI - Scan Food / Meal Analysis (using image or text)
app.post("/api/ai/scan-food", authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const db = (req as any).db;
  const { imageBase64, mimeType, description } = req.body;

  if (!description && !imageBase64) {
    return res.status(400).json({ error: "Harap masukkan deskripsi makanan atau unggah foto makanan." });
  }

  try {
    const ai = getGemini();
    const p = user.profile;

    const systemPrompt = `Anda adalah FitLife AI, asisten pemindai makanan pintar (tingkat akurasi minimal 90%).
Tugas Anda adalah menganalisis makanan berdasarkan deskripsi atau gambar yang diunggah oleh pengguna.
Hitung estimasi kalori, protein, karbohidrat, dan lemak secara akurat.
Sesuaikan juga dengan preferensi diet pengguna (${p.preferences}), alergi (${p.allergies}), pantangan (${p.restrictions}), dan target kalori (${p.calorieTarget} kkal).
Berikan saran apakah makanan ini cocok dikonsumsi dan bagaimana porsinya.

FORMAT OUTPUT HARUS SELALU BERUPA JSON dengan skema berikut. Jangan tambahkan teks di luar JSON.

Skema JSON:
{
  "foodName": "Nama hidangan yang terdeteksi atau dianalisis",
  "calories": 450, // Angka integer estimasi kalori
  "protein": 20,    // Angka integer gram protein
  "carbs": 50,      // Angka integer gram karbohidrat
  "fat": 15,        // Angka integer gram lemak
  "fitStatus": "Sangat Cocok" atau "Kurang Cocok" atau "Hindari",
  "explanation": "Penjelasan detail mengapa makanan ini cocok/kurang cocok berdasarkan alergi, pantangan, dan tujuan berat badan pengguna (${p.goal})."
}`;

    let contents: any[] = [];
    if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      });
    }
    contents.push({
      text: description ? `Analisis makanan ini: ${description}` : "Analisis makanan pada foto yang saya unggah ini.",
    });

    const response = await generateContentWithFallback({
      contents,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          calories: { type: Type.INTEGER },
          protein: { type: Type.INTEGER },
          carbs: { type: Type.INTEGER },
          fat: { type: Type.INTEGER },
          fitStatus: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["foodName", "calories", "protein", "carbs", "fat", "fitStatus", "explanation"]
      }
    });

    const resultText = response.text;
    const scanResult = JSON.parse(resultText);

    // Save scan to user's scan history
    const newScan = {
      id: "scan_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      ...scanResult,
    };

    if (!user.scans) user.scans = [];
    user.scans.unshift(newScan);

    // Automatically add to logged meals if requested or make it easy
    const uIdx = db.users.findIndex((u: any) => u.id === user.id);
    db.users[uIdx] = user;
    saveDB(db);

    return res.json({ success: true, scanResult: newScan, scans: user.scans });
  } catch (err: any) {
    console.error("Error scanning food with Gemini:", err);
    return res.status(500).json({ error: "Gagal memindai makanan menggunakan AI. " + err.message });
  }
});


// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
