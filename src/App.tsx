import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// --- เชื่อมต่อ Supabase ---
const supabaseUrl = 'https://ohwjlfgstgxiwicbipuq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od2psZmdzdGd4aXdpY2JpcHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg3NzYsImV4cCI6MjA4Njk0NDc3Nn0.vORh39uFUNp6wSa_6PoMDHxyb40QA5MX9VnDoO7LY1I'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<'inventory' | 'logs'>('inventory')
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // --- Search & Filter States ---
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newStock, setNewStock] = useState('0')

  const saveLog = async (action: string, details: string) => {
    await supabase.from('logs').insert([{ user_email: user?.email, action, details }]);
  };

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true })
    if (data) setProducts(data)
    setLoading(false)
  }

  const fetchLogs = async () => {
    const { data } = await supabase.from('logs').select('*').order('created_at', { ascending: false })
    if (data) setAuditLogs(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null) })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchLogs();
    }
  }, [user, view])

  // --- Filter Logic ---
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLowStock = filterLowStock ? product.stock < 5 : true
    return matchesSearch && matchesLowStock
  })

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPrice) return
    const { error } = await supabase.from('products').insert([{ name: newName, price: Number(newPrice), stock: Number(newStock), description: 'เพิ่มโดย AJ.BEAM' }])
    if (!error) {
      await saveLog('เพิ่มสินค้า', `เพิ่มสินค้าใหม่: ${newName} ราคา ${newPrice} บ. จำนวน ${newStock} ชิ้น`);
      setNewName(''); setNewPrice(''); setNewStock('0'); fetchProducts();
    }
  }

  const handleUpdateStock = async (id: number, currentStock: number, change: number, name: string) => {
    const nextStock = currentStock + change;
    if (nextStock < 0) return;
    const { error } = await supabase.from('products').update({ stock: nextStock }).eq('id', id);
    if (!error) {
      const actionType = change > 0 ? 'เพิ่มสต็อก' : 'ลดสต็อก';
      await saveLog(actionType, `${actionType}สินค้า: ${name} เป็น ${nextStock} ชิ้น`);
      fetchProducts();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`ลบสินค้า "${name}" ใช่หรือไม่?`)) {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) {
        await saveLog('ลบสินค้า', `ลบสินค้า: ${name} ออกจากระบบ`);
        fetchProducts();
      }
    }
  }

  const handleUpdatePrice = async (id: number, currentPrice: number, name: string) => {
    const p = prompt(`ระบุราคาใหม่สำหรับ ${name}:`, currentPrice.toString())
    if (p) {
      const { error } = await supabase.from('products').update({ price: Number(p) }).eq('id', id)
      if (!error) {
        await saveLog('แก้ไขราคา', `เปลี่ยนราคา ${name} จาก ${currentPrice} เป็น ${p} บ.`);
        fetchProducts();
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message); else alert('สมัครสมาชิกสำเร็จ!');
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">E-Tech Shop</h2>
            <p className="text-slate-500 text-sm mt-1">{isSignUp ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบคลังสินค้า'}</p>
          </div>
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className={`w-full py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${isSignUp ? 'bg-emerald-600' : 'bg-blue-800'}`}>
              {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-sm text-blue-700 font-medium hover:underline">
            {isSignUp ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-10 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-widest uppercase">E-Tech Inventory</h1>
            <div className="flex gap-2 bg-blue-800/50 p-1 rounded-xl font-bold">
              <button onClick={() => setView('inventory')} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${view === 'inventory' ? 'bg-white text-blue-900 shadow' : 'hover:bg-white/10'}`}>คลังสินค้า</button>
              <button onClick={() => setView('logs')} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${view === 'logs' ? 'bg-white text-blue-900 shadow' : 'hover:bg-white/10'}`}>ประวัติการใช้งาน</button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden md:block text-blue-200">{user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-all text-red-200 hover:text-white">ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {view === 'inventory' ? (
          <div className="animate-in fade-in duration-500">
            {/* ฟอร์มเพิ่มสินค้า */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="w-2 h-6 bg-blue-700 rounded-full"></span> เพิ่มสินค้าเข้าคลัง</h3>
              <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-3 text-sm">
                <input className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="ชื่อสินค้า" value={newName} onChange={e => setNewName(e.target.value)} />
                <input className="w-full md:w-32 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="ราคา" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                <input className="w-full md:w-24 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="สต็อก" type="number" value={newStock} onChange={e => setNewStock(e.target.value)} />
                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-blue-100">บันทึกข้อมูล</button>
              </form>
            </div>

            {/* ระบบค้นหาและกรอง */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
              <div className="relative flex-1 w-full">
                <span className="absolute left-4 top-3 text-slate-400">🔍</span>
                <input type="text" placeholder="ค้นหาชื่อสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
              </div>
              <button onClick={() => setFilterLowStock(!filterLowStock)}
                className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm border w-full md:w-auto justify-center ${filterLowStock ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {filterLowStock ? '🚫 ยกเลิกการกรอง' : '⚠️ ดูสินค้าสต็อกต่ำ'}
              </button>
            </div>

            {/* รายการสินค้า */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{product.name}</h2>
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdatePrice(product.id, product.price, product.name)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all">✏️</button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">🗑️</button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-4 h-10 overflow-hidden line-clamp-2">{product.description}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-sm font-medium text-slate-400">฿</span>
                      <span className="text-3xl font-black text-blue-700 tracking-tight">{Number(product.price).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase">คงเหลือ</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleUpdateStock(product.id, product.stock, -1, product.name)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:text-red-600 hover:border-red-200 transition-all font-bold">-</button>
                        <span className={`text-xl font-black w-8 text-center ${product.stock < 5 ? 'text-red-600 animate-pulse font-black' : 'text-slate-800'}`}>{product.stock}</span>
                        <button onClick={() => handleUpdateStock(product.id, product.stock, 1, product.name)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:text-emerald-600 hover:border-emerald-200 transition-all font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-50 group-hover:bg-blue-700 transition-all"></div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 italic bg-white rounded-3xl border border-dashed">ไม่พบสินค้าที่ต้องการค้นหา</div>
              )}
            </div>
          </div>
        ) : (
          /* --- Audit Logs --- */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">📜 ประวัติการทำงานล่าสุด</h3>
              <button onClick={fetchLogs} className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-200 transition-all">รีเฟรชประวัติ</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">วัน-เวลา</th>
                    <th className="px-6 py-4">พนักงาน</th>
                    <th className="px-6 py-4 text-center">การกระทำ</th>
                    <th className="px-6 py-4">รายละเอียดข้อมูล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium font-sans">{new Date(log.created_at).toLocaleString('th-TH')}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{log.user_email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          log.action.includes('เพิ่ม') ? 'bg-emerald-100 text-emerald-700' : 
                          log.action.includes('ลด') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 italic font-light">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {loading && <p className="text-center mt-10 text-slate-400 font-medium animate-bounce italic font-sans uppercase tracking-widest">Connected to Supabase...</p>}
      </main>
    </div>
  )
}

export default App