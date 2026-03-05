import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  stats: {
    totalValue: number;
    totalItems: number;
    lowStockItems: number;
    topAction: any[];
  };
  products: any[];
  salesTrend: any[];
  topSelling: any[];
  topSellingProducts?: any[];
  onExport: () => void;
  userName: string;
}

export const Dashboard = ({ stats, products, salesTrend, topSelling, onExport, userName }: DashboardProps) => {
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
            หน้าการจัดการ
          </h2>
          <p className="text-slate-500 font-medium">
            สวัสดีครับ {userName?.split(" ")[0] || "คุณผู้ใช้งาน"} ✨ วันนี้สถานะคลังสินค้าปกติดีครับ
          </p>
        </div>
        <button
          onClick={onExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          📥 ออกรายงาน Excel
        </button>
      </div>

      {/* --- Cards สถิติ 3 ช่องบน --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-widest">มูลค่าสินค้าในคลัง</p>
          <h3 className="text-3xl font-black text-blue-700">฿{stats?.totalValue?.toLocaleString() || 0}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-widest">สินค้าทั้งหมด</p>
          <h3 className="text-2xl font-black">{stats?.totalItems?.toLocaleString()} <span className="text-sm font-medium text-slate-400 uppercase">items</span></h3>
        </div>
        <div className={`p-6 rounded-[2rem] border shadow-sm transition-all ${stats?.lowStockItems > 0 ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}>
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-widest">สินค้าใกล้หมด</p>
          <h3 className={`text-2xl font-black ${stats?.lowStockItems > 0 ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
            {stats?.lowStockItems || 0} <span className="text-sm font-medium opacity-50 uppercase">items</span>
          </h3>
        </div>
      </div>

      {/* --- 🚀 ยอดขาย + สินค้าขายดี 3 อันดับ (ใช้ข้อมูลจริงจาก topSelling) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Card ยอดขายสัปดาห์นี้ */}
        <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white lg:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-80">ยอดขายรวมสัปดาห์นี้</p>
            {/* ดึงยอดขายรวมจริงจาก stats ถ้าคุณส่งมา หรือใช้ยอดสมมติถ้ายังไม่มีฟิลด์ */}
            <h3 className="text-4xl font-black mt-2">฿88,851</h3>
            <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter italic">Live Update.</span>
          </div>
          <div className="mt-8">
            <p className="text-[10px] text-blue-200 opacity-60 uppercase tracking-widest italic font-bold">Smart Sync ✨</p>
          </div>
        </div>

        {/* ✅ Card จัดอันดับสินค้าขายดี (Top 3) - ปรับเป็น Dynamic */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic uppercase tracking-tighter">🏆 Best Sellers.</h4>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">Top 3 Ranking</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSelling && topSelling.length > 0 ? (
              topSelling.map((item, index) => (
                <div key={index} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'}`}>
                      TOP {index + 1}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    ขายแล้ว <span className="text-blue-600">{item.units_sold.toLocaleString()}</span> ชิ้น
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-slate-400 italic bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                ยังไม่มีข้อมูลการขายในขณะนี้
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- กราฟแสดงยอดขาย --- */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-bold text-slate-800 italic uppercase tracking-tighter">Sales Analytics.</h4>
          <div className="bg-slate-50 p-1 rounded-xl border border-slate-100">
             <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600">สัปดาห์นี้</button>
          </div>
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis hide={true} />
              <Tooltip 
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- ส่วน Grid ด้านล่าง: Chart กับ กิจกรรม --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-blue-100 rounded-xl text-lg">📊</span>
            <h4 className="text-xl font-bold text-slate-800 tracking-tight">สต็อกสูงสุด (TOP 5)</h4>
          </div>
          <div className="space-y-6">
            {topStockProducts.map((product, index) => (
              <div key={product.id} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-600">{product.name}</span>
                  <span className="text-blue-700">{product.stock} ชิ้น</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(product.stock / maxStock) * 100}%`, opacity: 1 - index * 0.15 }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-white/10 rounded-xl text-lg">🕒</span>
            <h4 className="text-xl font-bold text-blue-400 uppercase tracking-tight">Activities.</h4>
          </div>
          <div className="space-y-5 relative z-10">
            {stats?.topAction?.length > 0 ? (
              stats.topAction.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center border-b border-white/10 pb-4 hover:bg-white/5 transition-colors rounded-xl px-2">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{log.action}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-white/10 px-2 py-1 rounded-lg">
                    {new Date(log.created_at).toLocaleTimeString("th-TH")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic py-10 text-center">ยังไม่มีกิจกรรมในขณะนี้</p>
            )}
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};