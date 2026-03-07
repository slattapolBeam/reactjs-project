import { useEffect } from "react";
import { createPortal } from "react-dom";

interface DeleteSuccessModalProps {
  isOpen: boolean;
  productName: string;
  onClose: () => void;
}

export const DeleteSuccessModal = ({ isOpen, productName, onClose }: DeleteSuccessModalProps) => {
  // ปิดอัตโนมัติหลัง 2 วินาที
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center border border-slate-100"
        style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div
          className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ animation: "bounceIn 0.4s cubic-bezier(0.34,1.8,0.64,1) 0.1s both" }}
        >
          <span className="text-3xl">🗑️</span>
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-1">ลบสำเร็จ!</h2>
        <p className="text-sm text-slate-400 font-medium">
          "{productName}" ถูกลบออกจากระบบแล้ว
        </p>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bounceIn {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};