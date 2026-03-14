import { useState, useEffect } from "react";
import { HistoryLogs } from "./components/HistoryLogs";
import { Inventory } from "./components/Inventory";
import { Dashboard } from "./components/Dashboard";
import { EditPriceModal } from "./components/EditPriceModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { DeleteSuccessModal } from "./components/Deletesuccessmodal";
import { Pagination } from "./components/Pagination";
import { ImageUploadModal } from "./components/Imageuploadmodal";
import { LoginPage } from "./components/Loginpage";
import { Toaster } from "sonner";
import { OrdersList } from "./components/OrdersList";

// Hooks
import { useAuth } from "./hooks/Useauth";
import { useInventory } from "./hooks/Useinventory";
import { useModals } from "./hooks/Usemodals";
import { useRealtimeOrders } from "./hooks/UseRealtimeOrders";
import { useOrders } from "./hooks/Useorders";

type View = "inventory" | "logs" | "dashboard" | "orders";

function App() {
  const [view, setView] = useState<View>("dashboard");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");
  const { orders, fetchOrders, updateOrderStatus } = useOrders();
  const [deleteSuccess, setDeleteSuccess] = useState({
    isOpen: false,
    name: "",
  });

  const auth = useAuth();
  const inventory = useInventory(auth.user);
  const modals = useModals();

  // ✅ ระบบแจ้งเตือน Order ใหม่แบบ Real-time
  useRealtimeOrders(() => {
    inventory.fetchProducts(inventory.currentPage);
    inventory.fetchSalesData();
    fetchOrders(); // รีเฟรชรายการออเดอร์ด้วยถ้ามีคนสั่งใหม่
  });

  useEffect(() => {
    if (auth.user) {
      inventory.fetchProducts();
      inventory.fetchLogs();
      inventory.fetchSalesData();
      fetchOrders();
    }
  }, [auth.user, view]);

  const handleConfirmDelete = async () => {
    const { id, name } = modals.deleteModal;
    modals.closeDeleteModal();
    await inventory.handleConfirmDelete(id, name);
    setDeleteSuccess({ isOpen: true, name });
  };

  if (!auth.user) {
    return <LoginPage {...auth} onSubmit={auth.handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ✅ วาง Toaster ไว้บนสุดเพื่อให้ Notification แสดงผล */}
      <Toaster position="top-right" richColors expand={true} closeButton />
      <nav className="bg-white border-b sticky top-0 z-50 py-3 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-900 italic uppercase">
            E-Tech <span className="text-blue-500 italic">Inventory</span>
          </h1>
          <div className="flex-1 flex justify-center px-2 overflow-hidden">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl border overflow-x-auto no-scrollbar max-w-full shadow-inner">
              {(["dashboard", "inventory", "orders", "logs"] as View[]).map(
                (v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`whitespace-nowrap px-3 md:px-5 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all flex-shrink-0 ${
                      view === v
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-blue-400"
                    }`}
                  >
                    {
                      {
                        dashboard: "Dashboard",
                        inventory: "Inventory",
                        orders: "Orders",
                        logs: "History",
                      }[v]
                    }
                  </button>
                ),
              )}
            </div>
          </div>
          <button
            onClick={auth.signOut}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div key={view} className="animate-fade-up">
          {view === "dashboard" && (
            <Dashboard
              stats={inventory.stats}
              products={inventory.products}
              salesTrend={inventory.salesData}
              topSelling={inventory.topSellingProducts}
              onExport={inventory.exportToExcel}
              userName={auth.user?.user_metadata?.full_name || "Admin"}
            />
          )}

          {view === "inventory" && (
            <>
              <Inventory
                products={inventory.products}
                searchTerm={inventory.searchTerm}
                setSearchTerm={inventory.setSearchTerm}
                filterLowStock={inventory.filterLowStock}
                setFilterLowStock={inventory.setFilterLowStock}
                onAdd={(e) =>
                  inventory.handleAddProduct(
                    e,
                    { name: newName, price: newPrice, stock: newStock },
                    () => {
                      setNewName("");
                      setNewPrice("");
                      setNewStock("0");
                    },
                  )
                }
                onUpdateStock={inventory.handleUpdateStock}
                onUpdatePrice={modals.openPriceModal}
                onDelete={modals.openDeleteModal}
                onUploadImage={modals.openImageModal}
                addForm={{
                  name: newName,
                  setName: setNewName,
                  price: newPrice,
                  setPrice: setNewPrice,
                  stock: newStock,
                  setStock: setNewStock,
                }}
              />
              <Pagination
                currentPage={inventory.currentPage}
                totalPages={Math.ceil(
                  inventory.totalCount / inventory.PAGE_SIZE,
                )}
                onPageChange={(page) => {
                  inventory.setCurrentPage(page);
                  inventory.fetchProducts(page);
                }}
              />
            </>
          )}
          {view === "orders" && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black italic uppercase">
                  Order <span className="text-blue-500">History</span>
                </h2>
                <button
                  onClick={fetchOrders}
                  className="bg-white border px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  🔄 รีเฟรช
                </button>
              </div>
              <OrdersList orders={orders} onUpdateStatus={updateOrderStatus} />
            </div>
          )}
          {view === "logs" && (
            <HistoryLogs
              logs={inventory.auditLogs}
              onRefresh={inventory.fetchLogs}
            />
          )}
        </div>
      </main>

      {/* Modals Section */}
      <EditPriceModal
        isOpen={modals.priceModal.isOpen}
        productName={modals.priceModal.name}
        currentPrice={modals.priceModal.price}
        onConfirm={(newPrice) =>
          inventory.handleConfirmPrice(
            modals.priceModal.id,
            modals.priceModal.name,
            newPrice,
          )
        }
        onClose={modals.closePriceModal}
      />

      <DeleteConfirmModal
        isOpen={modals.deleteModal.isOpen}
        productName={modals.deleteModal.name}
        onConfirm={handleConfirmDelete}
        onClose={modals.closeDeleteModal}
      />

      <DeleteSuccessModal
        isOpen={deleteSuccess.isOpen}
        productName={deleteSuccess.name}
        onClose={() => setDeleteSuccess({ isOpen: false, name: "" })}
      />

      <ImageUploadModal
        isOpen={modals.imageModal.isOpen}
        productId={modals.imageModal.id}
        productName={modals.imageModal.name}
        currentImageUrl={modals.imageModal.imageUrl}
        onSuccess={() => inventory.fetchProducts()}
        onClose={modals.closeImageModal}
      />
    </div>
  );
}

export default App;
