interface InventoryProps {
  products: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
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
  isScanning,
  setIsScanning,
  filterLowStock,
  setFilterLowStock,
  onAdd,
  onUpdateStock,
  onUpdatePrice,
  onDelete,
  addForm,
}: InventoryProps) => (
  <div className="animate-in fade-in duration-500">
    {isScanning && (
      <div className="mb-6 bg-white p-4 rounded-3xl shadow-lg border-4 border-blue-500">
        <div id="reader"></div>
        <button
          onClick={() => setIsScanning(false)}
          className="mt-4 w-full py-2 bg-red-100 text-red-600 rounded-xl font-bold"
        >
          ปิดกล้อง
        </button>
      </div>
    )}
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative flex-1 text-left">
        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="ค้นหาชื่อสินค้า..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsScanning(true)}
          className="px-6 py-3.5 bg-blue-700 text-white rounded-2xl font-bold text-sm"
        >
          📷 สแกน QR
        </button>
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-6 py-3.5 rounded-2xl font-bold text-xs border ${filterLowStock ? "bg-red-500 text-white" : "bg-white text-slate-800"}`}
        >
          สต็อกต่ำ
        </button>
      </div>
    </div>

    <div
      className="bg-white rounded-3xl p-5 border border-slate-100 
                transition-all duration-300 
                hover:shadow-2xl hover:-translate-y-2 hover:border-blue-200"
    >
      <form
        onSubmit={onAdd}
        className="flex flex-col md:flex-row gap-3 text-sm"
      >
        <input
          className="flex-1 px-4 py-3 border rounded-xl"
          placeholder="ชื่อสินค้า"
          value={addForm.name}
          onChange={(e) => addForm.setName(e.target.value)}
        />
        <input
          className="w-full md:w-32 px-4 py-3 border rounded-xl"
          placeholder="ราคา"
          type="number"
          value={addForm.price}
          onChange={(e) => addForm.setPrice(e.target.value)}
        />
        <input
          className="w-full md:w-24 px-4 py-3 border rounded-xl"
          placeholder="สต็อก"
          type="number"
          value={addForm.stock}
          onChange={(e) => addForm.setStock(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold"
        >
          บันทึก
        </button>
      </form>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 hover:shadow-xl transition-all text-left"
        >
          <div className="flex justify-between mb-3 font-bold">
            <h2 className="text-xl text-slate-800">{product.name}</h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  onUpdatePrice(product.id, product.price, product.name)
                }
              >
                ✏️
              </button>
              <button onClick={() => onDelete(product.id, product.name)}>
                🗑️
              </button>
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700 mb-4">
            ฿{Number(product.price).toLocaleString()}
          </div>
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-dashed">
            <span className="text-xs font-bold text-slate-400">คงเหลือ</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  onUpdateStock(product.id, product.stock, -1, product.name)
                }
                className="w-10 h-10 bg-white border rounded-xl shadow-sm font-bold"
              >
                -
              </button>
              <span
                className={`text-xl font-black ${product.stock < 5 ? "text-red-600 animate-bounce" : "text-slate-800"}`}
              >
                {product.stock}
              </span>
              <button
                onClick={() =>
                  onUpdateStock(product.id, product.stock, 1, product.name)
                }
                className="w-10 h-10 bg-white border rounded-xl shadow-sm font-bold"
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
