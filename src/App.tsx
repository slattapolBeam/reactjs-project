import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import { HistoryLogs } from "./components/HistoryLogs";
import { Inventory } from "./components/Inventory";
import { Dashboard } from "./components/Dashboard";

// --- เชื่อมต่อ Supabase ผ่าน .env ---
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

function App() {
  // --- 1. State ทั้งหมด ---
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"inventory" | "logs" | "dashboard">(
    "dashboard",
  );

  // State สำหรับสมัครสมาชิก
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // State สำหรับจัดการสินค้า
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  // --- 2. ฟังก์ชันจัดการข้อมูล (API) ---
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (data) setProducts(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAuditLogs(data);
  };

  const saveLog = async (action: string, details: string) => {
    const displayName = user?.user_metadata?.full_name || user?.email;
    await supabase
      .from("logs")
      .insert([{ user_email: displayName, action, details }]);
  };

  // --- 3. ฟังก์ชัน Authentication ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      // เช็คจุดที่ 1: รหัสผ่านต้องตรงกัน
      if (password !== confirmPassword) {
        alert("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง!");
        return; // หยุดการทำงานทันที ไม่ส่งไป Supabase
      }

      // เช็คจุดที่ 2: ความยาวรหัสผ่าน (แถมให้เพื่อความปลอดภัย)
      if (password.length < 6) {
        alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `${firstName} ${lastName}`.trim() },
        },
      });

      if (error) alert(error.message);
      else alert("สมัครสมาชิกสำเร็จ!");
    } else {
      // ส่วน Login ปกติ...
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };
  // --- 4. ฟังก์ชันจัดการสต็อก/สินค้า ---
  const Scanner = () => {
    useEffect(() => {
      // 1. สร้างตัว Scanner
      const scanner = new Html5QrcodeScanner(
        "reader", // ชื่อ id ของ div ที่จะให้กล้องแสดง
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false,
      );

      // 2. สั่งให้เริ่มทำงาน
      scanner.render(
        (decodedText) => {
          // ถ้าสแกนเจอ จะให้ทำอะไร? เช่น ค้นหาสินค้า
          console.log("สแกนเจอแล้ว!:", decodedText);
          alert("รหัสสินค้าคือ: " + decodedText);
          scanner.clear(); // สแกนเสร็จแล้วปิดกล้อง
        },
        (error) => {
          // กรณีหาไม่เจอ (มันจะรันตลอดเวลาที่กล้องเปิด)
        },
      );

      // 3. Clean up เมื่อปิดหน้าจอ
      return () => {
    // ใช้ .catch เพื่อจัดการกับ Promise แทนการใช้ await
    scanner.clear().catch(error => console.error("Failed to clear", error));
  };
}, []);

    return (
      <div>
        <h2 className="text-xl font-bold mb-4">สแกนรหัสสินค้า</h2>
        <div id="reader"></div> {/* กล้องจะมาโผล่ตรงนี้ครับ */}
      </div>
    );
  };
  const handleUpdateStock = async (
    id: number,
    currentStock: number,
    change: number,
    name: string,
  ) => {
    const nextStock = currentStock + change;
    if (nextStock < 0) return;
    const { error } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", id);
    if (!error) {
      await saveLog(
        change > 0 ? "เพิ่มสต็อก" : "ลดสต็อก",
        `${name} เป็น ${nextStock} ชิ้น`,
      );
      fetchProducts();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    const { error } = await supabase
      .from("products")
      .insert([
        { name: newName, price: Number(newPrice), stock: Number(newStock) },
      ]);
    if (!error) {
      await saveLog("เพิ่มสินค้า", `เพิ่ม ${newName} จำนวน ${newStock} ชิ้น`);
      setNewName("");
      setNewPrice("");
      setNewStock("0");
      fetchProducts();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`ลบสินค้า "${name}" ใช่หรือไม่?`)) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        await saveLog("ลบสินค้า", `ลบ ${name} ออกจากระบบ`);
        fetchProducts();
      }
    }
  };

  const handleUpdatePrice = async (
    id: number,
    currentPrice: number,
    name: string,
  ) => {
    const p = prompt(`ระบุราคาใหม่สำหรับ ${name}:`, currentPrice.toString());
    if (p) {
      const { error } = await supabase
        .from("products")
        .update({ price: Number(p) })
        .eq("id", id);
      if (!error) {
        await saveLog("แก้ไขราคา", `เปลี่ยนราคา ${name} เป็น ${p} บ.`);
        fetchProducts();
      }
    }
  };

  // --- 5. Effects & Helpers ---
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchLogs();
    }
  }, [user, view]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterLowStock ? p.stock < 5 : true),
  );

  const stats = {
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    lowStockItems: products.filter((p) => p.stock < 5).length,
    topAction: auditLogs.slice(0, 5),
  };

  const exportToExcel = () => {
    const headers = ["ชื่อสินค้า", "ราคา", "คงเหลือ", "มูลค่ารวม"];
    const rows = products.map((p) => [
      p.name,
      p.price,
      p.stock,
      p.price * p.stock,
    ]);
    const csvContent =
      "\uFEFF" + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // --- 6. หน้า Login / SignUp ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-blue-900 uppercase">
              E-Tech Shop
            </h2>
            <p className="text-slate-500 text-sm">
              {isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ"}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ชื่อ"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="นามสกุล"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {isSignUp && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${isSignUp ? "bg-emerald-600" : "bg-blue-800"}`}
            >
              {isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
            </button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-6 text-sm text-blue-700 hover:underline"
          >
            {isSignUp
              ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"
              : "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่"}
          </button>
        </div>
      </div>
    );
  }

  // --- 7. หน้าหลักหลัง Login ---
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 py-3 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            {/* โลโก้เน้นสีเข้ม ตัดกับพื้นขาว */}
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-blue-900 leading-none tracking-tighter">
                E-TECH <span className="text-blue-500">INVENTORY</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Smart Management System
              </p>
            </div>

            {/* เมนูแบบ Capsule Button */}
            <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setView("dashboard")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${view === "dashboard" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                สรุปภาพรวม
              </button>
              <button
                onClick={() => setView("inventory")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${view === "inventory" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                คลังสินค้า
              </button>
              <button
                onClick={() => setView("logs")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${view === "logs" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                ประวัติการใช้งาน
              </button>
            </div>
          </div>

          {/* ส่วนชื่อผู้ใช้และ Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-500 leading-none mb-1">
                ยินดีต้อนรับ 👋
              </p>
              <p className="text-sm font-black text-slate-800 leading-none">
                สวัสดี!{" "}
                {user?.user_metadata?.full_name?.split(" ")[0] ||
                  "คุณผู้ใช้งาน"}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all duration-300 active:scale-95 shadow-md shadow-slate-200"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 transition-all duration-500 ease-in-out">
        <div key={view} className="animate-fade-up">
          {view === "dashboard" && (
            <Dashboard
              stats={stats}
              onExport={exportToExcel}
              userName={user?.user_metadata?.full_name || "คุณผู้ใช้งาน"}
            />
          )}
          {view === "inventory" && (
            <Inventory
              products={filteredProducts}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              filterLowStock={filterLowStock}
              setFilterLowStock={setFilterLowStock}
              onAdd={handleAddProduct}
              onUpdateStock={handleUpdateStock}
              onUpdatePrice={handleUpdatePrice}
              onDelete={handleDelete}
              addForm={{
                name: newName,
                setName: setNewName,
                price: newPrice,
                setPrice: setNewPrice,
                stock: newStock,
                setStock: setNewStock,
              }}
            />
          )}
          {view === "logs" && (
            <HistoryLogs logs={auditLogs} onRefresh={fetchLogs} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
