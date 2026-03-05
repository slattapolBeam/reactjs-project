import { useState } from "react";

interface InventoryProps {
  products: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterLowStock: boolean;
  setFilterLowStock: (val: boolean) => void;
  onAdd: (e: any) => void;
  onUpdateStock: (
    id: number,
    current: number,
    change: number,
    name: string,
  ) => void;
  onUpdatePrice: (id: number, current: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
  addForm: {
    name: string;
    setName: any;
    price: string;
    setPrice: any;
    stock: string;
    setStock: any;
  };
}

export const Inventory = ({
  products,
  searchTerm,
  setSearchTerm,
  filterLowStock,
  setFilterLowStock,
  onAdd,
  onUpdateStock,
  onUpdatePrice,
  onDelete,
  addForm,
}: InventoryProps) => {
  // ✅ เพิ่ม State สำหรับคุมการ ยุบ/กาง ฟอร์ม
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const handleSubmit = (e: any) => {
    onAdd(e);
    setIsAddFormOpen(false); // ✅ บันทึกเสร็จให้ยุบหน้าจอลง
  };

  return (
    <div className="animate-fade-up duration-500">
      {/* ส่วนหัว: ค้นหาและปุ่มจัดการหลัก */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 text-left">
          <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-6 py-3.5 rounded-2xl font-bold text-xs border transition-all active:scale-95 ${
              filterLowStock
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-slate-800 border-slate-200"
            }`}
          >
            สต็อกต่ำ
          </button>
          {/* ✅ ปุ่มกดเพื่อ ยุบ/กาง ฟอร์ม */}
          <button
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 ${
              isAddFormOpen
                ? "bg-slate-200 text-slate-600"
                : "bg-blue-700 text-white shadow-lg shadow-blue-200"
            }`}
          >
            {isAddFormOpen ? "✖ ยกเลิก" : "➕ เพิ่มสินค้า"}
          </button>
        </div>
      </div>

      {/* ✅ ส่วนฟอร์มเพิ่มสินค้า (แสดงผลแบบมีเงื่อนไข) */}
      {isAddFormOpen && (
        <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-xl mb-8 animate-fade-down">
          <div className="flex items-center gap-2 mb-4 text-blue-900 font-bold">
            <span className="bg-blue-100 p-2 rounded-lg">📦</span>
            กรอกข้อมูลสินค้าใหม่
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-3 text-sm"
          >
            <input
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              placeholder="ชื่อสินค้า"
              value={addForm.name}
              onChange={(e) => addForm.setName(e.target.value)}
              required
            />
            <input
              className="w-full md:w-32 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              placeholder="ราคา"
              type="number"
              value={addForm.price}
              onChange={(e) => addForm.setPrice(e.target.value)}
              required
            />
            <input
              className="w-full md:w-24 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              placeholder="สต็อก"
              type="number"
              value={addForm.stock}
              onChange={(e) => addForm.setStock(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
            >
              บันทึกข้อมูล
            </button>
          </form>
        </div>
      )}
      <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-8">
        หน้าคลังสินค้า
      </h2>
      {/* รายการสินค้า */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
          >
            <div className="flex justify-between mb-3 font-bold">
              <h2 className="text-xl text-slate-800 group-hover:text-blue-700 transition-colors">
                {product.name}
              </h2>
              <div className="flex gap-2">
                <button
                  className="hover:bg-blue-50 p-1 rounded-lg transition-colors"
                  onClick={() =>
                    onUpdatePrice(product.id, product.price, product.name)
                  }
                >
                  ✏️
                </button>
                <button
                  className="hover:bg-red-50 p-1 rounded-lg transition-colors"
                  onClick={() => onDelete(product.id, product.name)}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="text-3xl font-black text-blue-700 mb-4">
              ฿{Number(product.price).toLocaleString()}
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
              <span className="text-xs font-bold text-slate-400">คงเหลือ</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    onUpdateStock(product.id, product.stock, -1, product.name)
                  }
                  className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-sm font-bold hover:bg-slate-50 active:scale-90 transition-all"
                >
                  -
                </button>
                <span
                  className={`text-xl font-black min-w-[30px] text-center ${product.stock < 5 ? "text-red-600 animate-pulse" : "text-slate-800"}`}
                >
                  {product.stock}
                </span>
                <button
                  onClick={() =>
                    onUpdateStock(product.id, product.stock, 1, product.name)
                  }
                  className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-sm font-bold hover:bg-slate-50 active:scale-90 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
