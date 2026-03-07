import { useEffect } from "react";
import { createPortal } from "react-dom";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  productName,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) => {
  // ปิดด้วย ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-2xl p-4">
            <span className="text-3xl">🗑️</span>
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-slate-800 mb-1">ลบสินค้านี้ใช่ไหม?</h2>
          <p className="text-sm text-slate-500">
            คุณกำลังจะลบ{" "}
            <span className="font-bold text-slate-700">"{productName}"</span>
            <br />
            ออกจากระบบ การกระทำนี้<span className="text-red-500 font-bold">ไม่สามารถย้อนกลับได้</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100"
          >
            ลบสินค้า
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