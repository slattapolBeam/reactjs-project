interface DashboardProps {
  stats: {
    totalValue: number;
    totalItems: number;
    lowStockItems: number;
    topAction: any[];
  };
  products: any[];
  onExport: () => void;
  userName: string;
}

export const Dashboard = ({ stats, products, onExport, userName }: DashboardProps) => {
  // 📊 คำนวณหาสินค้าที่สต็อกเยอะสุด 5 อันดับแรก
  const topStockProducts = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  const maxStock = Math.max(...topStockProducts.map((p) => p.stock), 1);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* --- ส่วนหัว: Welcome & Export --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
            สวัสดีครับ! {userName?.split(" ")[0] || "คุณผู้ใช้งาน"} ✨
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            วันนี้มีรายการสินค้าที่คุณต้องดูแลทั้งหมด{" "}
            <span className="text-blue-600 font-bold">
              {stats?.totalItems?.toLocaleString() || 0}
            </span>{" "}
            ชิ้นครับ
          </p>
        </div>
        <button
          onClick={onExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          📥 ออกรายงาน Excel
        </button>
      </div>

      {/* --- Cards สถิติ 3 ช่อง --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">มูลค่าสินค้าในคลัง</p>
          <h3 className="text-3xl font-black text-blue-700">฿{stats?.totalValue?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">จำนวนสินค้าทั้งหมด</p>
          <h3 className="text-3xl font-black text-slate-800">
            {stats?.totalItems?.toLocaleString() || 0} <span className="text-sm font-medium text-slate-400">ชิ้น</span>
          </h3>
        </div>

        <div className={`p-6 rounded-[2rem] shadow-sm border transition-all hover:shadow-md ${stats?.lowStockItems > 0 ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}>
          <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">รายการที่ต้องเติมของ</p>
          <h3 className={`text-3xl font-black ${stats?.lowStockItems > 0 ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
            {stats?.lowStockItems || 0} <span className="text-sm font-medium opacity-50">รายการ</span>
          </h3>
        </div>
      </div>

      {/* --- ส่วน Grid ด้านล่าง: Chart กับ กิจกรรม --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 📉 ฝั่งซ้าย: Chart สินค้าสูงสุด */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-blue-100 rounded-xl text-lg">📊</span>
            <h4 className="text-xl font-bold text-slate-800">สินค้าสต็อกสูงสุด (Top 5)</h4>
          </div>
          <div className="space-y-6">
            {topStockProducts.map((product, index) => (
              <div key={product.id} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-600">{product.name}</span>
                  <span className="text-blue-700">{product.stock} ชิ้น</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(product.stock / maxStock) * 100}%`,
                      opacity: 1 - index * 0.15,
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {topStockProducts.length === 0 && (
              <p className="text-center text-slate-400 py-10 italic">ไม่มีข้อมูลสินค้า</p>
            )}
          </div>
        </div>

        {/* 🕒 ฝั่งขวา: กิจกรรมล่าสุด (ธีมสีเข้ม) */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-white/10 rounded-xl text-lg">🕒</span>
            <h4 className="text-xl font-bold text-blue-400">กิจกรรมล่าสุด</h4>
          </div>

          <div className="space-y-5 relative z-10 text-left">
            {stats?.topAction?.length > 0 ? (
              stats.topAction.map((log: any) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center border-b border-white/10 pb-4 hover:bg-white/5 transition-colors rounded-xl px-2"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-200">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                    {new Date(log.created_at).toLocaleTimeString("th-TH")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic py-10 text-center">ยังไม่มีกิจกรรมในขณะนี้</p>
            )}
          </div>
          {/* ตกแต่งพื้นหลังเล็กน้อย */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

      </div>
    </div>
  );
};