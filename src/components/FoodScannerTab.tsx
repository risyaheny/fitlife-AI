import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, Plus, Image as ImageIcon, RefreshCw, Trash2, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserData } from "../types";

interface FoodScannerTabProps {
  data: UserData;
  userEmail: string;
  fetchUserData: () => void;
  triggerNotification: (title: string, body: string) => void;
}

export default function FoodScannerTab({ data, userEmail, fetchUserData, triggerNotification }: FoodScannerTabProps) {
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [uploadTimestamp, setUploadTimestamp] = useState<number | null>(null);

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera start handler
  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Kamera tidak dapat diakses atau diblokir oleh iFrame / browser. Harap gunakan fitur Unggah Foto.");
      setIsCameraActive(false);
    }
  };

  // Camera stop handler
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Snap photo handler
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImageUrl(dataUrl);
      
      // Clean up Base64 header for API
      const parts = dataUrl.split(";base64,");
      setBase64Data(parts[1]);
      setMimeType("image/jpeg");
      setUploadTimestamp(Date.now());
      triggerNotification("Kamera Mengambil Gambar", "Foto makanan berhasil diproses!");
    }
    stopCamera();
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle local image upload file conversion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImageUrl(result);
      const parts = result.split(";base64,");
      setBase64Data(parts[1]);
      setUploadTimestamp(Date.now());
      triggerNotification("File Terunggah", `Gambar ${file.name} siap dipindai.`);
    };
    reader.readAsDataURL(file);
  };

  // Submit scan to API
  const handlePerformScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !base64Data) return;

    setScanning(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/ai/scan-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          description: description,
          imageBase64: base64Data,
          mimeType: mimeType || "image/jpeg"
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Gagal memindai makanan.");
      }
      setScanResult(resData.scanResult);
      triggerNotification("Makanan Terpindai", `AI mendeteksi ${resData.scanResult.foodName}!`);
      fetchUserData();
    } catch (err: any) {
      alert(err.message || "Gagal memindai makanan. Pastikan Gemini API Key aktif.");
    } finally {
      setScanning(false);
    }
  };

  const getMealTypeFromTime = (timeMs: number): string => {
    const date = new Date(timeMs);
    const hour = date.getHours();
    if (hour >= 5 && hour < 11) {
      return "Sarapan";
    } else if (hour >= 11 && hour < 15) {
      return "Makan Siang";
    } else if (hour >= 15 && hour < 18) {
      return "Camilan";
    } else if (hour >= 18 && hour < 24) {
      return "Makan Malam";
    } else {
      return "Camilan Malam";
    }
  };

  // Add scan result into daily food log
  const handleAddScanToMeals = async () => {
    if (!scanResult) return;
    const ts = uploadTimestamp || Date.now();
    const computedType = getMealTypeFromTime(ts);
    const computedDate = new Date(ts).toISOString().split("T")[0];

    try {
      const response = await fetch("/api/user/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          name: scanResult.foodName,
          calories: scanResult.calories,
          type: computedType,
          date: computedDate
        })
      });

      if (!response.ok) throw new Error();
      
      triggerNotification("Tersimpan!", `${scanResult.foodName} dimasukkan ke log harian sebagai ${computedType}.`);
      setScanResult(null);
      setDescription("");
      setImageUrl(null);
      setBase64Data(null);
      setUploadTimestamp(null);
      fetchUserData();
    } catch (err) {
      alert("Gagal menyimpan hidangan.");
    }
  };

  // Clear current picture
  const handleClearImage = () => {
    setImageUrl(null);
    setBase64Data(null);
    setMimeType(null);
  };

  const scanHistory = data.scans || [];

  return (
    <div className="space-y-6">
      
      {/* HEADER SUMMARY */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-500" />
          AI Pindai Makanan (Kamera / File)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Ambil foto langsung menggunakan kamera hp/laptop Anda, unggah berkas gambar hidangan, atau ketik nama hidangan untuk dideteksi gizinya oleh Gemini AI secara instant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: UPLOAD / CAMERA SELECTION PANEL */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">INPUT FOTO MAKANAN</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" /> Gunakan Kamera
                </button>
                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 border border-slate-200">
                  <Upload className="w-3.5 h-3.5" /> Unggah Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Camera Video Stream Frame */}
            {isCameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 aspect-video flex flex-col justify-end">
                <video 
                  ref={videoRef} 
                  playsInline 
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Ambil Foto Sesi
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Display error if camera fails */}
            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-normal">{cameraError}</p>
              </div>
            )}

            {/* Image Preview and Analysis form */}
            <form onSubmit={handlePerformScan} className="space-y-4">
              
              {/* Display Captured or Selected Image */}
              {imageUrl ? (
                <div className="relative rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden max-h-72 flex justify-center items-center group">
                  <img src={imageUrl} alt="Pindai makanan" className="object-contain max-h-72 w-full" />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-3 right-3 p-1.5 bg-rose-500 text-white rounded-lg opacity-85 hover:opacity-100 transition-all cursor-pointer shadow"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">Belum ada foto yang dipilih</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Pilih "Gunakan Kamera" untuk berfoto langsung atau klik "Unggah Foto" untuk memilih berkas dari galeri perangkat Anda.
                  </p>
                </div>
              )}

              {/* Text Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">NAMA / DESKRIPSI MAKANAN (MEMBANTU AKURASI AI):</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: 1 porsi gulai kakap, sambal hijau, dan nasi merah setengah porsi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Scan Trigger */}
              <button
                type="submit"
                disabled={scanning || (!description && !base64Data)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
                {scanning ? "Gemini AI Menganalisis Gambar & Gizi..." : "Mulai Pindai Gizi Makanan via Gemini AI"}
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: SCAN RESULTS & HISTORY */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* THE SCAN RESULT */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
              Hasil Pembacaan Gemini AI
            </h3>

            {scanResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                  <div>
                    <span className="text-[10px] text-emerald-700 block font-bold font-mono">
                      HIDANGAN TERDETEKSI ({getMealTypeFromTime(uploadTimestamp || Date.now())} - {new Date(uploadTimestamp || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})
                    </span>
                    <span className="text-sm font-black text-slate-800 leading-tight">{scanResult.foodName}</span>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-xl shadow-sm ${
                    scanResult.fitStatus === "Sangat Cocok" 
                      ? "bg-emerald-500 text-white" 
                      : scanResult.fitStatus === "Kurang Cocok"
                      ? "bg-amber-500 text-white"
                      : "bg-rose-500 text-white"
                  }`}>
                    {scanResult.fitStatus}
                  </span>
                </div>

                {/* Macrominerals breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-emerald-100/30">
                    <span className="text-[8px] text-slate-400 block font-bold">KALORI</span>
                    <span className="text-xs font-extrabold text-slate-800">{scanResult.calories}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">kkal</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100/30">
                    <span className="text-[8px] text-slate-400 block font-bold">PROTEIN</span>
                    <span className="text-xs font-extrabold text-slate-800">{scanResult.protein}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">gram</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100/30">
                    <span className="text-[8px] text-slate-400 block font-bold">KARBOHIDRAT</span>
                    <span className="text-xs font-extrabold text-slate-800">{scanResult.carbs}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">gram</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100/30">
                    <span className="text-[8px] text-slate-400 block font-bold">LEMAK</span>
                    <span className="text-xs font-extrabold text-slate-800">{scanResult.fat}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">gram</span>
                  </div>
                </div>

                {/* Analysis detail text */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100/40 leading-relaxed text-xs text-slate-600">
                  {scanResult.explanation}
                </div>

                <button
                  onClick={handleAddScanToMeals}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Masukkan ke Log Makanan Hari Ini
                </button>
              </motion.div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-600">Menunggu Pemindaian</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Silakan masukkan deskripsi atau foto hidangan Anda, lalu klik "Mulai Pindai Gizi Makanan" untuk memicu analisis nutrisi multimodal dari Gemini AI.
                </p>
              </div>
            )}
          </div>

          {/* HISTORIC SCAN LOG */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-3">Histori Pemindaian Terakhir</span>
            {scanHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada riwayat hasil pemindaian.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {scanHistory.map((scan) => (
                  <div key={scan.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight">{scan.foodName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{scan.date}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        scan.fitStatus === "Sangat Cocok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {scan.fitStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 mt-2 text-center text-[10px] font-mono border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">KALORI</span>
                        <span className="font-bold text-slate-700">{scan.calories} kkal</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">PROT</span>
                        <span className="font-bold text-slate-700">{scan.protein}g</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">KARB</span>
                        <span className="font-bold text-slate-700">{scan.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">LEMAK</span>
                        <span className="font-bold text-slate-700">{scan.fat}g</span>
                      </div>
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
