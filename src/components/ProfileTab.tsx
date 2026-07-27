import React, { useState } from "react";
import { User, Edit, Camera, Save, Sparkles } from "lucide-react";
import { UserData, UserProfile } from "../types";

interface ProfileTabProps {
  data: UserData;
  userEmail: string;
  fetchUserData: () => void;
  triggerNotification: (title: string, body: string) => void;
  isOnboarding?: boolean;
}

export default function ProfileTab({ data, userEmail, fetchUserData, triggerNotification, isOnboarding = false }: ProfileTabProps) {
  const p = data.profile;
  const [profileForm, setProfileForm] = useState<UserProfile>({
    ...p,
    name: p.name || "",
    age: p.age === 0 ? "" as any : p.age,
    gender: p.gender || "",
    height: p.height === 0 ? "" as any : p.height,
    weight: p.weight === 0 ? "" as any : p.weight,
    targetWeight: p.targetWeight === 0 ? "" as any : p.targetWeight,
    dailyActivity: p.dailyActivity || "",
    goal: p.goal || "",
    preferences: p.preferences || "",
    allergies: p.allergies || "",
    medicalHistory: p.medicalHistory || "",
    budget: p.budget || "",
    photo: p.photo || "",
    streak: p.streak || 0
  });
  const [saving, setSaving] = useState(false);

  // File Upload base64 converter
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileForm(prev => ({ ...prev, photo: base64String }));
      triggerNotification("Foto Diunggah", "Foto profil baru berhasil dimuat. Klik Simpan untuk memperbarui.");
    };
    reader.readAsDataURL(file);
  };

  // Submit profile changes
  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation
    if (!profileForm.name?.trim()) {
      alert("Nama lengkap wajib diisi.");
      return;
    }
    const ageVal = parseInt(profileForm.age as any);
    if (isNaN(ageVal) || ageVal <= 0) {
      alert("Umur harus berupa angka lebih dari 0.");
      return;
    }
    if (!profileForm.gender) {
      alert("Jenis kelamin wajib dipilih.");
      return;
    }
    const heightVal = parseFloat(profileForm.height as any);
    if (isNaN(heightVal) || heightVal <= 0) {
      alert("Tinggi badan harus berupa angka lebih dari 0.");
      return;
    }
    const weightVal = parseFloat(profileForm.weight as any);
    if (isNaN(weightVal) || weightVal <= 0) {
      alert("Berat badan awal harus berupa angka lebih dari 0.");
      return;
    }
    const targetWeightVal = parseFloat(profileForm.targetWeight as any);
    if (isNaN(targetWeightVal) || targetWeightVal <= 0) {
      alert("Target berat badan harus berupa angka lebih dari 0.");
      return;
    }
    if (!profileForm.dailyActivity) {
      alert("Aktivitas harian wajib dipilih.");
      return;
    }
    if (!profileForm.goal) {
      alert("Tujuan utama wajib dipilih.");
      return;
    }
    if (!profileForm.preferences?.trim()) {
      alert("Referensi diet wajib diisi.");
      return;
    }
    if (!profileForm.allergies?.trim()) {
      alert("Alergi makanan wajib diisi. (Isi dengan 'Tidak ada' jika tidak memiliki alergi)");
      return;
    }
    if (!profileForm.medicalHistory?.trim()) {
      alert("Riwayat penyakit wajib diisi. (Isi dengan 'Tidak ada' jika tidak memiliki riwayat penyakit)");
      return;
    }
    if (!profileForm.budget) {
      alert("Budget makanan wajib dipilih.");
      return;
    }

    setSaving(true);

    // Calculate calorieTarget using Mifflin-St Jeor Formula
    let bmr = 10 * weightVal + 6.25 * heightVal - 5 * ageVal;
    if (profileForm.gender === "Laki-laki") {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Daily Activity factor
    let activityMultiplier = 1.2;
    if (profileForm.dailyActivity.includes("Ringan")) activityMultiplier = 1.375;
    else if (profileForm.dailyActivity.includes("Sedang")) activityMultiplier = 1.55;
    else if (profileForm.dailyActivity.includes("Sangat Aktif")) activityMultiplier = 1.725;

    let targetCalories = Math.round(bmr * activityMultiplier);
    
    // Adjust based on goal
    if (profileForm.goal === "Menurunkan Berat Badan") {
      targetCalories -= 500;
    } else if (profileForm.goal === "Menaikkan Berat Badan") {
      targetCalories += 400;
    } else if (profileForm.goal === "Membentuk Otot") {
      targetCalories += 300;
    }

    // Safe lower bound clamp
    targetCalories = Math.max(1200, targetCalories);

    const bodyData = {
      ...profileForm,
      age: ageVal,
      height: heightVal,
      weight: weightVal,
      targetWeight: targetWeightVal,
      calorieTarget: targetCalories,
      isProfileComplete: true,
      isNewUser: false,
    };

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify(bodyData)
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Gagal memperbarui profil.");
      }

      triggerNotification(
        isOnboarding ? "Onboarding Sukses" : "Profil Diperbarui", 
        isOnboarding 
          ? "Selamat! Informasi profil Anda telah berhasil dikonfigurasi secara lengkap." 
          : "Data biometrik & target kalori berhasil disimpan!"
      );
      
      fetchUserData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const bmi = p.weight > 0 ? (p.weight / ((p.height / 100) * (p.height / 100))) : 0;

  const renderFormFields = () => {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">NAMA LENGKAP</label>
            <input
              type="text"
              required
              placeholder="Nama Lengkap Anda"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">UMUR (TAHUN)</label>
            <input
              type="number"
              required
              placeholder="Contoh: 25"
              value={profileForm.age || ""}
              onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value === "" ? "" as any : parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">JENIS KELAMIN</label>
            <select
              required
              value={profileForm.gender}
              onChange={(e) => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Jenis Kelamin --</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Height */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">TINGGI BADAN (CM)</label>
            <input
              type="number"
              required
              placeholder="Contoh: 170"
              value={profileForm.height || ""}
              onChange={(e) => setProfileForm(prev => ({ ...prev, height: e.target.value === "" ? "" as any : parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">BERAT BADAN AWAL (KG)</label>
            <input
              type="number"
              required
              placeholder="Contoh: 70"
              value={profileForm.weight || ""}
              onChange={(e) => setProfileForm(prev => ({ ...prev, weight: e.target.value === "" ? "" as any : parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Target Weight */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">TARGET BERAT BADAN (KG)</label>
            <input
              type="number"
              required
              placeholder="Contoh: 65"
              value={profileForm.targetWeight || ""}
              onChange={(e) => setProfileForm(prev => ({ ...prev, targetWeight: e.target.value === "" ? "" as any : parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Daily Activity */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">AKTIVITAS HARIAN</label>
            <select
              required
              value={profileForm.dailyActivity}
              onChange={(e) => setProfileForm(prev => ({ ...prev, dailyActivity: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Aktivitas Harian --</option>
              <option value="Sedentary (Jarang olahraga)">Sedentary (Jarang olahraga)</option>
              <option value="Ringan (1–2x per minggu)">Ringan (1–2x per minggu)</option>
              <option value="Sedang (3–5x per minggu)">Sedang (3–5x per minggu)</option>
              <option value="Sangat Aktif (Setiap hari)">Sangat Aktif (Setiap hari)</option>
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">TUJUAN UTAMA</label>
            <select
              required
              value={profileForm.goal}
              onChange={(e) => setProfileForm(prev => ({ ...prev, goal: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Tujuan Utama --</option>
              <option value="Menurunkan Berat Badan">Menurunkan Berat Badan</option>
              <option value="Menjaga Berat Badan">Menjaga Berat Badan</option>
              <option value="Menaikkan Berat Badan">Menaikkan Berat Badan</option>
              <option value="Membentuk Otot">Membentuk Otot</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Diet preference */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">REFERENSI DIET</label>
            <input
              type="text"
              required
              value={profileForm.preferences}
              onChange={(e) => setProfileForm(prev => ({ ...prev, preferences: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Contoh: Bebas, Vegetarian, High Protein, Halal..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Allergies */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">ALERGI</label>
            <input
              type="text"
              required
              value={profileForm.allergies}
              onChange={(e) => setProfileForm(prev => ({ ...prev, allergies: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Contoh: Tidak ada, Seafood, Kacang..."
            />
          </div>

          {/* Medical History */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">RIWAYAT PENYAKIT</label>
            <input
              type="text"
              required
              value={profileForm.medicalHistory}
              onChange={(e) => setProfileForm(prev => ({ ...prev, medicalHistory: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Contoh: Tidak ada, Maag, Hipertensi..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Budget */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">BUDGET MAKANAN</label>
            <select
              required
              value={profileForm.budget}
              onChange={(e) => setProfileForm(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Budget Makanan --</option>
              <option value="Ekonomis">Ekonomis</option>
              <option value="Sedang">Sedang</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </>
    );
  };

  if (isOnboarding) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6 border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <Edit className="w-5 h-5 text-emerald-500" />
          Lengkapi Informasi Profil Wajib Anda
        </h3>

        <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
          {renderFormFields()}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 animate-bounce" />
              {saving ? "Menyimpan & Menghitung..." : "Selesaikan Onboarding & Masuk ke Dashboard 🚀"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-500" />
          Profil Pengguna & Target Biometrik
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Kelola data pribadi Anda, sesuaikan porsi target kalori, kustomisasi alergi makanan, dan ubah foto profil Anda secara fleksibel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PROFILE PICTURE CARD (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center space-y-5">
            
            <div className="relative w-32 h-32 mx-auto">
              {profileForm.photo ? (
                <img 
                  src={profileForm.photo} 
                  alt="Avatar" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-md mx-auto"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <User className="w-14 h-14" />
                </div>
              )}
              
              {/* Photo Input Trigger Badge */}
              <label className="absolute bottom-0 right-2 p-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-full cursor-pointer shadow-lg transition-all">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-800">{p.name}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{userEmail}</p>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg mt-2 border border-amber-100">
                🔥 Streak Aktif: {p.streak || 0} Hari
              </div>
            </div>

            {/* Quick health profile breakdown */}
            <div className="border-t border-slate-100 pt-4 text-left text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span>BMI Saat Ini:</span>
                <span className="font-bold text-slate-800">{bmi > 0 ? bmi.toFixed(1) : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Tinggi Badan:</span>
                <span className="font-bold text-slate-800">{p.height > 0 ? `${p.height} cm` : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Kalori:</span>
                <span className="font-bold text-emerald-600">{p.calorieTarget > 0 ? `${p.calorieTarget} kkal` : "-"}</span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT EDIT PROFILE FORM (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Edit className="w-4.5 h-4.5 text-emerald-500" />
              Edit Informasi Profil Biometrik
            </h3>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              {renderFormFields()}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan perubahan..." : "Simpan Perubahan Biometrik & Foto"}
              </button>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
