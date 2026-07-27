25.01.53.0008 – RISYA HENY PUTRI SUKMAWAR ||
25.01.53.0012 – NUR JIHAN SALSABILA

# FitLife AI — Health Dashboard

FitLife AI adalah platform kesehatan digital yang mengintegrasikan kecerdasan buatan (AI) ke dalam rutinitas kesehatan sehari-hari. Dirancang untuk siapa saja yang ingin menjalani gaya hidup sehat dengan panduan yang personal, akurat, dan mudah diakses.

---

## Latar Belakang

Gaya hidup tidak sehat merupakan salah satu tantangan terbesar masyarakat modern. Kesibukan sehari-hari membuat banyak orang kesulitan memantau pola makan, rutinitas olahraga, dan kondisi tubuh mereka secara konsisten. Di sisi lain, layanan konsultasi kesehatan dan nutrisi profesional seringkali tidak terjangkau dari segi biaya maupun akses.

Berdasarkan data WHO, lebih dari 1 miliar orang di dunia mengalami obesitas, dan sebagian besar kasus penyakit kronis seperti diabetes tipe 2 dan hipertensi berkaitan langsung dengan pola makan dan aktivitas fisik yang buruk. Di Indonesia sendiri, prevalensi obesitas terus meningkat setiap tahunnya.

Kemajuan teknologi kecerdasan buatan, khususnya model bahasa besar (Large Language Model) seperti Google Gemini, membuka peluang untuk menghadirkan layanan konsultasi kesehatan yang personal, cerdas, dan terjangkau langsung di genggaman tangan pengguna.

---

## Tujuan

1. Membantu pengguna memantau kondisi kesehatan secara mandiri melalui data biometrik seperti BMI, berat badan, dan kalori harian.
2. Memberikan rekomendasi nutrisi dan olahraga yang dipersonalisasi berdasarkan profil kesehatan masing-masing pengguna.
3. Meningkatkan kesadaran masyarakat terhadap pentingnya pola makan bergizi dan aktivitas fisik yang teratur.
4. Menyediakan akses konsultasi kesehatan berbasis AI yang mudah digunakan, gratis, dan dapat diakses kapan saja.
5. Membangun kebiasaan sehat jangka panjang melalui fitur streak harian dan jadwal olahraga mingguan yang terstruktur.

---

## Solusi yang Ditawarkan

FitLife AI menjawab permasalahan di atas melalui pendekatan teknologi yang terintegrasi:

| Masalah | Solusi FitLife AI |
|---------|-------------------|
| Sulit memantau asupan kalori harian | Log makanan manual + Pindai makanan via AI (foto/teks) dengan analisis nutrisi otomatis |
| Tidak tahu olahraga yang sesuai kondisi tubuh | Jadwal latihan mingguan preset + rekomendasi olahraga personal dari Coach AI |
| Konsultasi gizi mahal dan tidak mudah diakses | Chat interaktif dengan Coach AI berbasis Gemini yang tersedia 24/7 |
| Tidak konsisten dalam menjaga gaya hidup sehat | Sistem streak harian 🔥 dan notifikasi untuk menjaga motivasi pengguna |
| Tidak memahami kondisi tubuh sendiri | Analisis biometrik mendalam (BMI, kalori, hidrasi) dengan penjelasan yang mudah dipahami |
| Tidak tahu makanan mana yang cocok untuk dietnya | Fitur Pindai Makanan AI yang menilai kesesuaian makanan berdasarkan alergi, pantangan, dan tujuan diet |

---

## Fitur Utama

### Autentikasi
- Register akun baru dengan validasi lengkap (nama, email, password kombinasi huruf & angka)
- Login dengan sesi tersimpan (Remember Me via localStorage)
- Onboarding profil wajib untuk pengguna baru sebelum masuk dashboard

### Dashboard Overview
- Ringkasan BMI real-time dengan status (Normal / Kurang / Kelebihan / Obesitas)
- Pelacak kalori harian (masuk vs terbakar) dengan visual ring progress
- Estimasi makro nutrisi (protein, karbohidrat, lemak)
- Log makanan harian manual dengan pilihan tipe (Sarapan, Makan Siang, dll)
- Pelacak berat badan dengan grafik progres menuju target
- Pelacak hidrasi harian dengan tombol tambah air cepat (+250ml, +500ml)
- Streak kesehatan harian dengan badge 🔥

### Jadwal Olahraga Mingguan
- Jadwal latihan preset per hari (Senin–Minggu) dengan fokus berbeda:
  - Senin: Dada & Trisep (Push Day)
  - Selasa: Punggung & Bisep (Pull Day)
  - Rabu: Kaki & Bahu
  - Kamis: Istirahat Aktif & Yoga
  - Jumat: Full Body HIIT
  - Sabtu: Cardio & Core
  - Minggu: Pemulihan & Relaksasi
- Timer latihan per sesi dengan countdown
- Klaim streak otomatis setelah semua sesi selesai
- Log olahraga manual (nama, durasi, kalori, tanggal)

### Pindai Makanan AI (Gemini Multimodal)
- Scan makanan via kamera langsung (webcam/kamera HP)
- Upload foto makanan dari galeri perangkat
- Input deskripsi teks makanan
- Analisis nutrisi otomatis: kalori, protein, karbohidrat, lemak
- Status kesesuaian makanan: Sangat Cocok / Kurang Cocok / Hindari
- Riwayat hasil pemindaian tersimpan per akun
- Tambah hasil scan langsung ke log makanan harian

### Coach AI & Analisis Biometrik
- Analisis biometrik mendalam via Gemini AI:
  - Status dan saran BMI
  - Analisis kalori harian
  - Rekomendasi menu makan personal
  - Saran rutinitas olahraga
  - Saran hidrasi
- Chat interaktif dengan Coach AI (multi-sesi)
- Riwayat sesi chat tersimpan per akun via localStorage
- Bisa melanjutkan sesi lama atau memulai sesi baru

### Profil Pengguna
- Edit data biometrik lengkap: nama, umur, jenis kelamin, tinggi, berat badan
- Upload foto profil
- Pemilihan tujuan: Menurunkan / Menjaga / Menaikkan Berat Badan / Membentuk Otot
- Pengaturan aktivitas harian, preferensi diet, alergi, riwayat penyakit, budget makanan
- Kalkulasi target kalori otomatis menggunakan rumus Mifflin-St Jeor

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express, TypeScript (tsx) |
| AI Engine | Google Gemini API (`@google/genai`) dengan fallback multi-model |
| Database | JSON file lokal (`db.json`) |
| Build Tool | Vite 6 |
| Icon | Lucide React |

---

## Cara Menjalankan (Development)

### 1. Clone Repository

```bash
git clone https://github.com/username/fitlife-ai-health-dashboard.git
cd fitlife-ai-health-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Buat File Environment

Salin template environment:

```bash
copy .env.example .env.local
```

Kemudian isi file `.env.local` dengan API key Anda:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APP_URL=http://localhost:3001
DISABLE_HMR=true
```

> Dapatkan Gemini API Key gratis di: https://makersuite.google.com/app/apikey

### 4. Jalankan Server

```bash
npm run dev
```

### 5. Buka Browser

```
http://localhost:3001
```

---
