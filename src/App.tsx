import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { HistoryLogs } from "./components/HistoryLogs";
import { Inventory } from "./components/Inventory";
import { Dashboard } from "./components/Dashboard";
import { EditPriceModal } from "./components/EditPriceModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { Pagination } from "./components/Pagination";
import { ImageUploadModal } from "./components/Imageuploadmodal";

// --- เชื่อมต่อ Supabase ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 9;

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

function App() {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"inventory" | "logs" | "dashboard">(
    "dashboard",
  );
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  const [salesData, setSalesData] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);

  const [priceModal, setPriceModal] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
    price: number;
  }>({ isOpen: false, id: 0, name: "", price: 0 });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
  }>({ isOpen: false, id: 0, name: "" });

  // --- Functions ---
  const fetchProducts = async (
    page = currentPage,
    search = searchTerm,
    lowStock = filterLowStock,
  ) => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to);

    if (search) query = query.ilike("name", `%${search}%`);
    if (lowStock) query = query.lt("stock", 5);

    const { data, count } = await query;
    if (data) setProducts(data);
    if (count !== null) setTotalCount(count);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAuditLogs(data);
  };

  const fetchSalesData = async () => {
    const { data: sales } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: true });
    if (sales) {
      const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
          day: days[d.getDay()],
          date: d.toLocaleDateString(),
          amount: 0,
        };
      }).reverse();

      sales.forEach((sale) => {
        const saleDate = new Date(sale.created_at).toLocaleDateString();
        const dayMatch = last7Days.find((d) => d.date === saleDate);
        if (dayMatch) dayMatch.amount += Number(sale.amount);
      });
      setSalesData(last7Days);

      const counts: any = {};
      sales.forEach((sale) => {
        counts[sale.product_name] = (counts[sale.product_name] || 0) + 1;
      });
      const top3 = Object.entries(counts)
        .map(([name, count]) => ({
          name,
          units_sold: count as number,
          price: 0,
        }))
        .sort((a, b) => b.units_sold - a.units_sold)
        .slice(0, 3);
      setTopSellingProducts(top3);
    }
  };

  const saveLog = async (action: string, details: string) => {
    if (!user) return;
    const displayName = user.user_metadata?.full_name || user.email;
    await supabase
      .from("logs")
      .insert([{ user_email: displayName, action, details }]);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error("รหัสผ่านไม่ตรงกัน!");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: `${firstName} ${lastName}`.trim() } },
        });
        if (error) throw error;
        alert("สมัครสมาชิกสำเร็จ!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
      fetchProducts(1);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteModal.id);
    if (!error) {
      await saveLog("ลบสินค้า", `ลบ ${deleteModal.name} ออกจากระบบ`);
      fetchProducts();
    }
  };

  const handleUpdatePrice = (
    id: number,
    currentPrice: number,
    name: string,
  ) => {
    setPriceModal({ isOpen: true, id, name, price: currentPrice });
  };

  const handleConfirmPrice = async (newPrice: number) => {
    const { error } = await supabase
      .from("products")
      .update({ price: newPrice })
      .eq("id", priceModal.id);
    if (!error) {
      await saveLog(
        "แก้ไขราคา",
        `เปลี่ยนราคา ${priceModal.name} เป็น ${newPrice} บ.`,
      );
      fetchProducts();
    }
  };

  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
    imageUrl: string | null;
  }>({ isOpen: false, id: 0, name: "", imageUrl: null });

  const handleUploadImage = (
    id: number,
    name: string,
    imageUrl: string | null,
  ) => {
    setImageModal({ isOpen: true, id, name, imageUrl });
  };

  // Search + filter debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(1, searchTerm, filterLowStock);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterLowStock]);

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
      fetchSalesData();
    }
  }, [user, view]);

  const stats = {
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    lowStockItems: products.filter((p) => p.stock < 5).length,
    topAction: auditLogs.slice(0, 5),
    totalSales: salesData.reduce((sum, d) => sum + d.amount, 0),
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-blue-900 uppercase italic">
              E-Tech Shop
            </h2>
            <p className="text-slate-500 text-sm">
              {isSignUp ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบจัดการสต็อก"}
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
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${loading ? "bg-slate-400" : isSignUp ? "bg-emerald-600" : "bg-blue-800"}`}
            >
              {loading
                ? "กำลังดำเนินการ..."
                : isSignUp
                  ? "สมัครสมาชิก"
                  : "เข้าสู่ระบบ"}
            </button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-6 text-sm text-blue-600 font-medium"
          >
            {isSignUp ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "สมัครสมาชิกที่นี่"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b sticky top-0 z-50 py-3 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-900 italic uppercase">
            E-Tech <span className="text-blue-500 italic">Inventory</span>
          </h1>
          <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl border">
            {["dashboard", "inventory", "logs"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${view === v ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              >
                {v === "dashboard"
                  ? "Dashboard"
                  : v === "inventory"
                    ? "Inventory"
                    : "History"}
              </button>
            ))}
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div key={view} className="animate-fade-up">
          {view === "dashboard" && (
            <Dashboard
              stats={stats}
              products={products}
              salesTrend={salesData}
              topSelling={topSellingProducts}
              onExport={exportToExcel}
              userName={user?.user_metadata?.full_name || "Admin"}
            />
          )}
          {view === "inventory" && (
            <>
              <Inventory
                products={products}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterLowStock={filterLowStock}
                setFilterLowStock={setFilterLowStock}
                onAdd={handleAddProduct}
                onUpdateStock={handleUpdateStock}
                onUpdatePrice={handleUpdatePrice}
                onDelete={handleDelete}
                onUploadImage={handleUploadImage}
                addForm={{
                  name: newName,
                  setName: setNewName,
                  price: newPrice,
                  setPrice: setNewPrice,
                  stock: newStock,
                  setStock: setNewStock,
                }}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  fetchProducts(page);
                }}
              />
            </>
          )}
          {view === "logs" && (
            <HistoryLogs logs={auditLogs} onRefresh={fetchLogs} />
          )}
        </div>
      </main>

      <EditPriceModal
        isOpen={priceModal.isOpen}
        productName={priceModal.name}
        currentPrice={priceModal.price}
        onConfirm={handleConfirmPrice}
        onClose={() => setPriceModal((p) => ({ ...p, isOpen: false }))}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        productName={deleteModal.name}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal((p) => ({ ...p, isOpen: false }))}
      />
      <ImageUploadModal
        isOpen={imageModal.isOpen}
        productId={imageModal.id}
        productName={imageModal.name}
        currentImageUrl={imageModal.imageUrl}
        onSuccess={(url) => {
          fetchProducts();
        }}
        onClose={() => setImageModal((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}

export default App;
