// src/components/HistoryLogs.tsx
interface LogProps {
  logs: any[];
  onRefresh: () => void;
}

export const HistoryLogs = ({ logs, onRefresh }: LogProps) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="text-xl font-bold">📜 History Logs</h3>
        <button onClick={onRefresh} className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold">
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
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/30">
                <td className="px-6 py-4 text-xs">{new Date(log.created_at).toLocaleString("th-TH")}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${log.action.includes("เพิ่ม") ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 italic">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};