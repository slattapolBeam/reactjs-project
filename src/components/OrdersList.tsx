interface OrdersListProps {
  orders: any[];
  onUpdateStatus: (id: string, status: string) => void;
}

export const OrdersList = ({ orders, onUpdateStatus }: OrdersListProps) =>{
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="p-4 text-xs font-black uppercase text-slate-400">Order ID</th>
            <th className="p-4 text-xs font-black uppercase text-slate-400">Items</th>
            <th className="p-4 text-xs font-black uppercase text-slate-400">Total</th>
            <th className="p-4 text-xs font-black uppercase text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 text-sm font-mono text-slate-500">#{order.id.slice(0, 8)}</td>
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  {order.items?.map((item: any, idx: number) => (
                    <span key={idx} className="text-sm font-bold">
                      • {item.name} <span className="text-blue-500">x{item.quantity}</span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-4 font-black text-blue-600 text-lg">
                ฿{Number(order.total_price).toLocaleString()}
              </td>
              <td className="p-4">
                <select 
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                  className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer ${
                    order.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};