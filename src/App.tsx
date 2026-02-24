import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import { HistoryLogs } from "./components/HistoryLogs";
import { Inventory } from "./components/Inventory";
import { Dashboard } from "./components/Dashboard";

// --- เชื่อมต่อ Supabase ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

// ✅ 1. ย้าย Scanner ออกมาไว้นอก App เพื่อป้องกันการ Re-render จนกล้องค้าง
const QRScanner = ({ onScan }: { onScan: (text: string) => void }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(
      (text) => {
        onScan(text);
        scanner.clear();
      },
      () => {}
    );
    return () => {
      scanner.clear().catch((err) => console.error("Scanner clear error", err));
    };
  }, [onScan]);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-dashed border-blue-200 mb-6">
      <h2 className="text-center font-bold text-blue-800 mb-2">วาง QR Code ในกรอบ</h2>
      <div id="reader"></div>
    </div>
  );
};

function App() {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"inventory" | "logs" | "dashboard">("dashboard");
  const [loading, setLoading] = useState(false);

  // Auth States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Inventory States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  // --- Functions ---
  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (data) setProducts(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from("logs").select("*").order("created_at", { ascending: false });
    if (data) setAuditLogs(data);
  };

  const saveLog = async (action: string, details: string) => {
    if (!user) return;
    const displayName = user.user_metadata?.full_name || user.email;
    await supabase.from("logs").insert([{ user_email: displayName, action, details }]);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (password !== confirmPassword) return alert("รหัสผ่านไม่ตรงกัน!");
      if (password.length < 6) return alert("รหัสผ่านต้อง 6 ตัวขึ้นไป");
    }

    setLoading(true);
    // หน่วงเวลา 1 วินาทีให้เห็น Loading
    await new Promise(res => setTimeout(res, 1000));

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: `${firstName} ${lastName}`.trim() } },
        });
        if (error) throw error;
        alert("สมัครสมาชิกสำเร็จ!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id: number, currentStock: number, change: number, name: string) => {
    const nextStock = currentStock + change;
    if (nextStock < 0) return;
    const { error } = await supabase.from("products").update({ stock: nextStock }).eq("id", id);
    if (!error) {
      await saveLog(change > 0 ? "เพิ่มสต็อก" : "ลดสต็อก", `${name} เป็น ${nextStock} ชิ้น`);
      fetchProducts();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    const { error } = await supabase.from("products").insert([{ name: newName, price: Number(newPrice), stock: Number(newStock) }]);
    if (!error) {
      await saveLog("เพิ่มสินค้า", `เพิ่ม ${newName} จำนวน ${newStock} ชิ้น`);
      setNewName(""); setNewPrice(""); setNewStock("0");
      fetchProducts();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`ลบสินค้า "${name}" ใช่หรือไม่?`)) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        await saveLog("ลบสินค้า", `ลบ ${name} ออกจากระบบ`);
        fetchProducts();
      }
    }
  };

  const handleUpdatePrice = async (id: number, currentPrice: number, name: string) => {
    const p = prompt(`ระบุราคาใหม่สำหรับ ${name}:`, currentPrice.toString());
    if (p) {
      const { error } = await supabase.from("products").update({ price: Number(p) }).eq("id", id);
      if (!error) {
        await saveLog("แก้ไขราคา", `เปลี่ยนราคา ${name} เป็น ${p} บ.`);
        fetchProducts();
      }
    }
  };

  // --- Effects ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) { fetchProducts(); fetchLogs(); }
  }, [user, view]);

  // --- Helpers ---
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterLowStock ? p.stock < 5 : true));
  const stats = {
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    lowStockItems: products.filter(p => p.stock < 5).length,
    topAction: auditLogs.slice(0, 5),
  };

  const exportToExcel = () => {
    const headers = ["ชื่อสินค้า", "ราคา", "คงเหลือ", "มูลค่ารวม"];
    const rows = products.map(p => [p.name, p.price, p.stock, p.price * p.stock]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // --- UI Login ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-blue-900 uppercase">E-Tech Shop</h2>
            <p className="text-slate-500 text-sm">{isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบเพื่อจัดการสต็อก"}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />
            {isSignUp && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" required />}
            <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-200 shadow-lg active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : isSignUp ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-800 hover:bg-blue-900'}`}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  กำลังดำเนินการ...
                </div>
              ) : (isSignUp ? "สมัครสมาชิกใหม่" : "เข้าสู่ระบบ")}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-600 hover:underline font-medium">
              {isSignUp ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- UI Main ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b sticky top-0 z-50 py-3 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-blue-900 leading-none">E-TECH <span className="text-blue-500">INVENTORY</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Smart Management System</p>
          </div>
          <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl border">
            {["dashboard", "inventory", "logs"].map((v) => (
              <button key={v} onClick={() => setView(v as any)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${view === v ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
                {v === "dashboard" ? "สรุปภาพรวม" : v === "inventory" ? "คลังสินค้า" : "ประวัติ"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800">สวัสดี! {user?.user_metadata?.full_name?.split(" ")[0] || "คุณผู้ใช้งาน"}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 active:scale-95 transition-all">ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {isScanning && <QRScanner onScan={(text) => { alert("สแกนเจอ: " + text); setIsScanning(false); }} />}
        
        {view === "dashboard" && <Dashboard stats={stats} onExport={exportToExcel} userName={user?.user_metadata?.full_name || "คุณผู้ใช้งาน"} />}
        {view === "inventory" && (
          <Inventory 
            products={filteredProducts} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            isScanning={isScanning} setIsScanning={setIsScanning} filterLowStock={filterLowStock} setFilterLowStock={setFilterLowStock}
            onAdd={handleAddProduct} onUpdateStock={handleUpdateStock} onUpdatePrice={handleUpdatePrice} onDelete={handleDelete}
            addForm={{ name: newName, setName: setNewName, price: newPrice, setPrice: setNewPrice, stock: newStock, setStock: setNewStock }}
          />
        )}
        {view === "logs" && <HistoryLogs logs={auditLogs} onRefresh={fetchLogs} />}
      </main>
    </div>
  );
}

export default App;