interface HistoryLogsProps {
  logs: any[];
  onRefresh: () => void;
}

export const HistoryLogs = ({ logs, onRefresh }: HistoryLogsProps) => {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <span className="p-2 bg-slate-100 rounded-xl">📜</span>
          ประวัติการใช้งานระบบ
        </h2>
        <button
          onClick={onRefresh}
          className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          🔄 อัปเดตข้อมูล
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-black uppercase text-slate-400 tracking-wider">เวลา</th>
                <th className="px-6 py-5 text-xs font-black uppercase text-slate-400 tracking-wider">ผู้ดำเนินการ</th>
                <th className="px-6 py-5 text-xs font-black uppercase text-slate-400 tracking-wider">กิจกรรม</th>
                <th className="px-6 py-5 text-xs font-black uppercase text-slate-400 tracking-wider">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-500">
                      {new Date(log.created_at).toLocaleString("th-TH")}
                    </span>
                  </td>
                  {/* ✅ เพิ่มส่วนชื่อผู้ดำเนินการตรงนี้ */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {log.user_email?.substring(0, 1).toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {log.user_email || "ระบบอัตโนมัติ"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      log.action.includes("เพิ่ม") ? "bg-emerald-100 text-emerald-600" :
                      log.action.includes("ลบ") ? "bg-red-100 text-red-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 italic">
                      {log.details}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              ไม่มีข้อมูลประวัติการใช้งาน
            </div>
          )}
        </div>
      </div>
    </div>
  );
};