import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface EditPriceModalProps {
  isOpen: boolean;
  productName: string;
  currentPrice: number;
  onConfirm: (newPrice: number) => void;
  onClose: () => void;
}

export const EditPriceModal = ({
  isOpen,
  productName,
  currentPrice,
  onConfirm,
  onClose,
}: EditPriceModalProps) => {
  const [value, setValue] = useState(currentPrice.toString());
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentPrice.toString());
      setError("");
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [isOpen, currentPrice]);

  // ปิดด้วย ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    const parsed = Number(value);
    if (!value || isNaN(parsed)) {
      setError("กรุณากรอกตัวเลข");
      return;
    }
    if (parsed <= 0) {
      setError("ราคาต้องมากกว่า 0");
      return;
    }
    if (parsed > 9_999_999) {
      setError("ราคาสูงเกินไป");
      return;
    }
    onConfirm(parsed);
    onClose();
  };

  const diff = Number(value) - currentPrice;
  const hasValidDiff = !isNaN(diff) && Number(value) > 0 && Number(value) !== currentPrice;

  if (!isOpen) return null;

  return createPortal(
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal Card */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg text-sm">✏️</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">แก้ไขราคา</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 leading-tight">{productName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Current Price Badge */}
        <div className="bg-slate-50 rounded-2xl p-3 mb-4 flex items-center justify-between border border-dashed border-slate-200">
          <span className="text-xs text-slate-400 font-medium">ราคาปัจจุบัน</span>
          <span className="text-sm font-black text-slate-600">
            ฿{currentPrice.toLocaleString()}
          </span>
        </div>

        {/* Input */}
        <div className="mb-2">
          <label className="text-xs font-bold text-slate-500 mb-1.5 block">ราคาใหม่ (บาท)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">฿</span>
            <input
              ref={inputRef}
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              className={`w-full pl-8 pr-4 py-3.5 rounded-2xl border-2 font-bold text-slate-800 outline-none transition-all text-lg
                ${error
                  ? "border-red-400 bg-red-50 focus:border-red-500"
                  : "border-slate-200 bg-white focus:border-blue-500"
                }`}
              placeholder="0"
              min={1}
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">⚠ {error}</p>
          )}
        </div>

        {/* Price diff indicator */}
        {hasValidDiff && (
          <div className={`text-xs font-bold px-3 py-2 rounded-xl mb-4 inline-flex items-center gap-1
            ${diff > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
            {diff > 0 ? "▲" : "▼"} {diff > 0 ? "+" : ""}฿{diff.toLocaleString()} จากราคาเดิม
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-100"
          >
            บันทึก
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