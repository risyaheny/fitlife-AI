import React, { useState } from "react";
import { Mail, Lock, Heart, LogIn, KeyRound } from "lucide-react";
import { motion } from "motion/react";

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (email: string, user: any) => void;
}

export default function LoginPage({ onNavigateToRegister, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan masuk.");
      }

      setSuccess("Login berhasil! Memuat dashboard Anda...");
      if (rememberMe) {
        localStorage.setItem("fitlife_remembered_email", email);
      } else {
        localStorage.removeItem("fitlife_remembered_email");
      }

      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Email atau password salah, atau terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="p-2.5 bg-emerald-500 rounded-2xl shadow-md text-white">
            <Heart className="w-8 h-8 animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800">FitLife <span className="text-emerald-500">AI</span></span>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800">
          Selamat Datang Kembali
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Masuk untuk memantau biometrik, makanan, latihan, dan saran AI Anda
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-lg text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-lg text-sm font-medium animate-pulse">
                {success}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="budi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  Ingat Password
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer transition-all"
              >
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">Belum memiliki akun?</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={onNavigateToRegister}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 border border-slate-200 rounded-2xl shadow-sm text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer transition-all"
              >
                Daftar Akun Baru
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
