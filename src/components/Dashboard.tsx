interface DashboardProps {
  stats: any;
  onExport: () => void;
  userName: string;
}

export const Dashboard = ({ stats, onExport, userName }: DashboardProps) => (
  <div className="animate-in fade-in zoom-in duration-500 space-y-8">
    {/* ส่วนหัว: แยกเป็น 2 ฝั่งเพื่อความสวยงาม */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
          {/* ใส่ ? หลัง userName เพื่อกันหน้าขาวครับ */}
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

      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          📥 ออกรายงาน Excel
        </button>
      </div>
    </div>

    {/* Cards สถิติ */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">
          มูลค่าสินค้าในคลัง
        </p>
        <h3 className="text-3xl font-black text-blue-700">
          ฿{stats?.totalValue?.toLocaleString() || 0}
        </h3>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">
          จำนวนสินค้าทั้งหมด
        </p>
        <h3 className="text-3xl font-black text-slate-800">
          {stats?.totalItems?.toLocaleString() || 0}{" "}
          <span className="text-sm font-medium text-slate-400">ชิ้น</span>
        </h3>
      </div>

      <div
        className={`p-6 rounded-[2rem] shadow-sm border transition-all hover:shadow-md ${
          stats?.lowStockItems > 0
            ? "bg-red-50 border-red-100"
            : "bg-white border-slate-100"
        }`}
      >
        <p className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">
          รายการที่ต้องเติมของ
        </p>
        <h3
          className={`text-3xl font-black ${stats?.lowStockItems > 0 ? "text-red-600 animate-pulse" : "text-slate-800"}`}
        >
          {stats?.lowStockItems || 0}{" "}
          <span className="text-sm font-medium opacity-50">รายการ</span>
        </h3>
      </div>
    </div>

    {/* กิจกรรมล่าสุด */}
    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">🕒</span>
        <h4 className="text-xl font-bold text-blue-400">กิจกรรมล่าสุด</h4>
      </div>

      <div className="space-y-4 text-left relative z-10">
        {stats?.topAction?.length > 0 ? (
          stats.topAction.map((log: any) => (
            <div
              key={log.id}
              className="flex justify-between items-center border-b border-white/10 pb-3 hover:bg-white/5 transition-colors rounded-lg px-2"
            >
              <div>
                <p className="text-sm font-bold text-slate-200">{log.action}</p>
                <p className="text-xs text-slate-500 italic">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-md">
                {new Date(log.created_at).toLocaleTimeString("th-TH")}
              </span>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-sm italic">
            ยังไม่มีกิจกรรมในขณะนี้
          </p>
        )}
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>
  </div>
);