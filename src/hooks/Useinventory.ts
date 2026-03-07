import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 9;

export const useInventory = (user: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
    if (!sales) return;

    const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { day: days[d.getDay()], date: d.toLocaleDateString(), amount: 0 };
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
      .map(([name, count]) => ({ name, units_sold: count as number, price: 0 }))
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 3);
    setTopSellingProducts(top3);
  };

  const saveLog = async (action: string, details: string) => {
    if (!user) return;
    const displayName = user.user_metadata?.full_name || user.email;
    await supabase.from("logs").insert([{ user_email: displayName, action, details }]);
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

  const handleAddProduct = async (e: React.FormEvent, form: { name: string; price: string; stock: string }, onDone: () => void) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const { error } = await supabase
      .from("products")
      .insert([{ name: form.name, price: Number(form.price), stock: Number(form.stock) }]);
    if (!error) {
      await saveLog("เพิ่มสินค้า", `เพิ่ม ${form.name} จำนวน ${form.stock} ชิ้น`);
      onDone();
      fetchProducts(1);
    }
  };

  const handleConfirmDelete = async (id: number, name: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      await saveLog("ลบสินค้า", `ลบ ${name} ออกจากระบบ`);
      fetchProducts();
    }
  };

  const handleConfirmPrice = async (id: number, name: string, newPrice: number) => {
    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", id);
    if (!error) {
      await saveLog("แก้ไขราคา", `เปลี่ยนราคา ${name} เป็น ${newPrice} บ.`);
      fetchProducts();
    }
  };

  const exportToExcel = () => {
    const headers = ["ชื่อสินค้า", "ราคา", "คงเหลือ", "มูลค่ารวม"];
    const rows = products.map((p) => [p.name, p.price, p.stock, p.price * p.stock]);
    const csvContent = "\uFEFF" + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(1, searchTerm, filterLowStock);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterLowStock]);

  const stats = {
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    lowStockItems: products.filter((p) => p.stock < 5).length,
    topAction: auditLogs.slice(0, 5),
    totalSales: salesData.reduce((sum, d) => sum + d.amount, 0),
  };

  return {
    products, auditLogs, salesData, topSellingProducts, stats,
    searchTerm, setSearchTerm, filterLowStock, setFilterLowStock,
    currentPage, setCurrentPage, totalCount, PAGE_SIZE,
    fetchProducts, fetchLogs, fetchSalesData,
    handleUpdateStock, handleAddProduct, handleConfirmDelete,
    handleConfirmPrice, exportToExcel,
  };
};