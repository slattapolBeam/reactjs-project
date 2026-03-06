import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ImageUploadModalProps {
  isOpen: boolean;
  productId: number;
  productName: string;
  currentImageUrl: string | null;
  onSuccess: (imageUrl: string) => void;
  onClose: () => void;
}

export const ImageUploadModal = ({
  isOpen,
  productId,
  productName,
  currentImageUrl,
  onSuccess,
  onClose,
}: ImageUploadModalProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    setError("");
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const ext = file.name.split(".").pop();
      const path = `products/${productId}_${Date.now()}.${ext}`;

      // ลบรูปเก่าถ้ามี
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split("/product-images/")[1];
        if (oldPath) await supabase.storage.from("product-images").remove([oldPath]);
      }

      // upload รูปใหม่
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // get public URL
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);

      // update product
      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: data.publicUrl })
        .eq("id", productId);

      if (updateError) throw updateError;

      onSuccess(data.publicUrl);
      handleClose();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFile(null);
    setError("");
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-100 text-violet-700 p-1.5 rounded-lg text-sm">🖼️</span>
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">อัปโหลดรูปภาพ</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 leading-tight">{productName}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Drop Zone / Preview */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden mb-4
            ${isDragging ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"}
          `}
          style={{ height: "180px" }}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                <span className="text-white text-sm font-bold">เปลี่ยนรูป</span>
              </div>
            </>
          ) : currentImageUrl ? (
            <>
              <img src={currentImageUrl} alt="current" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                <span className="text-white text-sm font-bold">เปลี่ยนรูป</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <span className="text-4xl">📷</span>
              <p className="text-sm font-medium text-center">
                {isDragging ? "วางรูปที่นี่" : "คลิกหรือลากรูปมาวาง"}
              </p>
              <p className="text-xs text-slate-300">PNG, JPG, WEBP ขนาดไม่เกิน 5MB</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {error && (
          <p className="text-xs text-red-500 font-medium mb-3 ml-1">⚠ {error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all active:scale-95 shadow-lg shadow-violet-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
};