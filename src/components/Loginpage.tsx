import type { FormEvent } from "react";

interface LoginPageProps {
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}

export const LoginPage = ({
  isSignUp, setIsSignUp,
  firstName, setFirstName, lastName, setLastName,
  email, setEmail, password, setPassword,
  confirmPassword, setConfirmPassword,
  loading, onSubmit,
}: LoginPageProps) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-900 uppercase italic">E-Tech Shop</h2>
        <p className="text-slate-500 text-sm">
          {isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบจัดการสต็อก"}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {isSignUp && (
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="text" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
        {isSignUp && (
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${loading ? "bg-slate-400" : isSignUp ? "bg-emerald-600" : "bg-blue-800"}`}
        >
          {loading ? "กำลังดำเนินการ..." : isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
        </button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-sm text-blue-600 font-medium">
        {isSignUp ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "สมัครสมาชิกที่นี่"}
      </button>
    </div>
  </div>
);