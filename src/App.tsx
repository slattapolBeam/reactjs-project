import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";

const supabaseUrl = "https://ohwjlfgstgxiwicbipuq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od2psZmdzdGd4aXdpY2JpcHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg3NzYsImV4cCI6MjA4Njk0NDc3Nn0.vORh39uFUNp6wSa_6PoMDHxyb40QA5MX9VnDoO7LY1I";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"inventory" | "logs" | "dashboard">(
    "dashboard",
  );
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  const saveLog = async (action: string, details: string) => {
    await supabase
      .from("logs")
      .insert([{ user_email: user?.email, action, details }]);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAuditLogs(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchLogs();
    }
  }, [user, view]);

  useEffect(() => {
    let scanner: any = null;
    if (isScanning) {
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false,
        );
        scanner.render(
          (decodedText: string) => {
            setSearchTerm(decodedText);
            setIsScanning(false);
            scanner.clear();
          },
          (error: any) => {
            console.warn(error);
          },
        );
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner
            .clear()
            .catch((err: any) => console.error("Scanner clear error", err));
        }
      };
    }
  }, [isScanning]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLowStock = filterLowStock ? product.stock < 5 : true;
    return matchesSearch && matchesLowStock;
  });

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
      const actionType = change > 0 ? "เพิ่มสต็อก" : "ลดสต็อก";
      await saveLog(
        actionType,
        `${actionType}สินค้า: ${name} เป็น ${nextStock} ชิ้น`,
      );
      fetchProducts();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    const { error } = await supabase.from("products").insert([
      {
        name: newName,
        price: Number(newPrice),
        stock: Number(newStock),
        description: "เพิ่มโดย AJ.BEAM",
      },
    ]);
    if (!error) {
      await saveLog(
        "เพิ่มสินค้า",
        `เพิ่มสินค้าใหม่: ${newName} ราคา ${newPrice} บ. จำนวน ${newStock} ชิ้น`,
      );
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
        await saveLog("ลบสินค้า", `ลบสินค้า: ${name} ออกจากระบบ`);
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
        await saveLog(
          "แก้ไขราคา",
          `เปลี่ยนราคา ${name} จาก ${currentPrice} เป็น ${p} บ.`,
        );
        fetchProducts();
      }
    }
  };

  const stats = {
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    lowStockItems: products.filter((p) => p.stock < 5).length,
    topAction: auditLogs.slice(0, 5),
  };

  // ฟังก์ชันสำหรับส่งออกไฟล์ Excel (CSV)
  const exportToExcel = () => {
    // 1. เตรียมข้อมูลหัวตาราง
    const headers = ["ID", "ชื่อสินค้า", "ราคา", "คงเหลือ", "มูลค่ารวม"];

    // 2. เตรียมข้อมูลสินค้า
    const rows = products.map((p) => [
      p.id,
      p.name,
      p.price,
      p.stock,
      p.price * p.stock,
    ]);

    // 3. รวมร่างข้อมูลและจัดการเรื่องภาษาไทย (UTF-8 BOM)
    const csvContent =
      "\uFEFF" + [headers, ...rows].map((e) => e.join(",")).join("\n");

    // 4. สร้างไฟล์และสั่งดาวน์โหลด
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `E-Tech_Inventory_Report_${new Date().toLocaleDateString()}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-md border-t-8 border-blue-800">
          <div className="text-center mb-8 font-black">
            <h2 className="text-3xl text-blue-900 uppercase tracking-tighter">
              E-Tech Shop
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-normal">
              {isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบคลังสินค้า"}
            </p>
          </div>
          <form
            onSubmit={
              isSignUp
                ? (e) => {
                    e.preventDefault();
                    supabase.auth
                      .signUp({ email, password })
                      .then(({ error }) =>
                        error ? alert(error.message) : alert("สำเร็จ!"),
                      );
                  }
                : (e) => {
                    e.preventDefault();
                    supabase.auth
                      .signInWithPassword({ email, password })
                      .then(({ error }) => error && alert(error.message));
                  }
            }
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${isSignUp ? "bg-emerald-600" : "bg-blue-800"}`}
            >
              {isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
            </button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-6 text-sm text-blue-700 font-medium hover:underline"
          >
            {isSignUp
              ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"
              : "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-10 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-widest uppercase">
              E-Tech Inventory
            </h1>
            <div className="flex gap-2 bg-blue-800/50 p-1 rounded-xl font-bold text-[10px] md:text-xs">
              <button
                onClick={() => setView("inventory")}
                className={`px-3 md:px-4 py-1.5 rounded-lg transition-all ${view === "inventory" ? "bg-white text-blue-900 shadow" : "hover:bg-white/10"}`}
              >
                คลังสินค้า
              </button>
              <button
                onClick={() => setView("logs")}
                className={`px-3 md:px-4 py-1.5 rounded-lg transition-all ${view === "logs" ? "bg-white text-blue-900 shadow" : "hover:bg-white/10"}`}
              >
                ประวัติ
              </button>
              <button
                onClick={() => setView("dashboard")}
                className={`px-3 md:px-4 py-1.5 rounded-lg transition-all ${view === "dashboard" ? "bg-white text-blue-900 shadow" : "hover:bg-white/10"}`}
              >
                แดชบอร์ด
              </button>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all text-red-200 hover:text-white"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {view === "dashboard" && (
          <div className="animate-in fade-in zoom-in duration-500 space-y-8">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-xl">📊</span>{" "}
              สรุปภาพรวมคลังสินค้า
            </h2>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="p-2 bg-blue-100 rounded-xl">📊</span>{" "}
                สรุปภาพรวมคลังสินค้า
              </h2>

              <button
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                📥 ดาวน์โหลดรายงาน (Excel)
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">
                  มูลค่าสินค้าในคลัง
                </p>
                <h3 className="text-3xl font-black text-blue-700">
                  ฿{stats.totalValue.toLocaleString()}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">
                  จำนวนสินค้าทั้งหมด
                </p>
                <h3 className="text-3xl font-black text-slate-800">
                  {stats.totalItems.toLocaleString()} ชิ้น
                </h3>
              </div>
              <div
                className={`p-6 rounded-[2rem] shadow-sm border ${stats.lowStockItems > 0 ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}
              >
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">
                  รายการที่ต้องเติมของ
                </p>
                <h3
                  className={`text-3xl font-black ${stats.lowStockItems > 0 ? "text-red-600" : "text-slate-800"}`}
                >
                  {stats.lowStockItems} รายการ
                </h3>
              </div>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <h4 className="text-xl font-bold mb-6 text-blue-400">
                🕒 กิจกรรมล่าสุด
              </h4>
              <div className="space-y-4">
                {stats.topAction.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center border-b border-white/10 pb-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {log.action}
                      </p>
                      <p className="text-xs text-slate-500 italic">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString("th-TH")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "inventory" && (
          <div className="animate-in fade-in duration-500">
            {isScanning && (
              <div className="mb-6 bg-white p-4 rounded-3xl shadow-lg border-4 border-blue-500">
                <div id="reader"></div>
                <button
                  onClick={() => setIsScanning(false)}
                  className="mt-4 w-full py-2 bg-red-100 text-red-600 rounded-xl font-bold"
                >
                  ปิดกล้อง
                </button>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsScanning(true)}
                  className="px-6 py-3.5 bg-blue-700 text-white rounded-2xl font-bold text-sm"
                >
                  📷 สแกน QR
                </button>
                <button
                  onClick={() => setFilterLowStock(!filterLowStock)}
                  className={`px-6 py-3.5 rounded-2xl font-bold text-xs border ${filterLowStock ? "bg-red-500 text-white" : "bg-white"}`}
                >
                  สต็อกต่ำ
                </button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
              <form
                onSubmit={handleAddProduct}
                className="flex flex-col md:flex-row gap-3 text-sm"
              >
                <input
                  className="flex-1 px-4 py-3 border rounded-xl"
                  placeholder="ชื่อสินค้า"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  className="w-full md:w-32 px-4 py-3 border rounded-xl"
                  placeholder="ราคา"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
                <input
                  className="w-full md:w-24 px-4 py-3 border rounded-xl"
                  placeholder="สต็อก"
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold"
                >
                  บันทึก
                </button>
              </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between mb-3 font-bold">
                    <h2 className="text-xl text-slate-800">{product.name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdatePrice(
                            product.id,
                            product.price,
                            product.name,
                          )
                        }
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-blue-700 mb-4">
                    ฿{Number(product.price).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-dashed">
                    <span className="text-xs font-bold text-slate-400">
                      คงเหลือ
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleUpdateStock(
                            product.id,
                            product.stock,
                            -1,
                            product.name,
                          )
                        }
                        className="w-10 h-10 bg-white border rounded-xl shadow-sm font-bold"
                      >
                        -
                      </button>
                      <span
                        className={`text-xl font-black ${product.stock < 5 ? "text-red-600 animate-pulse" : "text-slate-800"}`}
                      >
                        {product.stock}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateStock(
                            product.id,
                            product.stock,
                            1,
                            product.name,
                          )
                        }
                        className="w-10 h-10 bg-white border rounded-xl shadow-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "logs" && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold">📜 History Logs</h3>
              <button
                onClick={fetchLogs}
                className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-black">
                  <tr>
                    <th className="px-6 py-4">วัน-เวลา</th>
                    <th className="px-6 py-4">การกระทำ</th>
                    <th className="px-6 py-4">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4 text-xs">
                        {new Date(log.created_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${log.action.includes("เพิ่ม") ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 italic">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
