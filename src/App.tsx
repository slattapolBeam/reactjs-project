import { useState, useEffect } from "react";
import { HistoryLogs } from "./components/HistoryLogs";
import { Inventory } from "./components/Inventory";
import { Dashboard } from "./components/Dashboard";
import { EditPriceModal } from "./components/EditPriceModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { Pagination } from "./components/Pagination";
import { ImageUploadModal } from "./components/Imageuploadmodal";
import { LoginPage } from "./components/Loginpage";
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { useModals } from "./hooks/Usemodals";

type View = "inventory" | "logs" | "dashboard";

function App() {
  const [view, setView] = useState<View>("dashboard");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  const auth = useAuth();

  const inventory = useInventory(auth.user);

  const modals = useModals();

  // โหลดข้อมูลเมื่อ login หรือเปลี่ยน view
  useEffect(() => {
    if (auth.user) {
      inventory.fetchProducts();
      inventory.fetchLogs();
      inventory.fetchSalesData();
    }
  }, [auth.user, view]);

  if (!auth.user) {
    return <LoginPage {...auth} onSubmit={auth.handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 py-3 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-900 italic uppercase">
            E-Tech <span className="text-blue-500 italic">Inventory</span>
          </h1>
          <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl border">
            {(["dashboard", "inventory", "logs"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${view === v ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              >
                {v === "dashboard" ? "Dashboard" : v === "inventory" ? "Inventory" : "History"}
              </button>
            ))}
          </div>
          <button
            onClick={auth.signOut}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
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
                onAdd={(e) => inventory.handleAddProduct(e,
                  { name: newName, price: newPrice, stock: newStock },
                  () => { setNewName(""); setNewPrice(""); setNewStock("0"); }
                )}
                onUpdateStock={inventory.handleUpdateStock}
                onUpdatePrice={modals.openPriceModal}
                onDelete={modals.openDeleteModal}
                onUploadImage={modals.openImageModal}
                addForm={{
                  name: newName, setName: setNewName,
                  price: newPrice, setPrice: setNewPrice,
                  stock: newStock, setStock: setNewStock,
                }}
              />
              <Pagination
                currentPage={inventory.currentPage}
                totalPages={Math.ceil(inventory.totalCount / inventory.PAGE_SIZE)}
                onPageChange={(page) => {
                  inventory.setCurrentPage(page);
                  inventory.fetchProducts(page);
                }}
              />
            </>
          )}

          {view === "logs" && (
            <HistoryLogs logs={inventory.auditLogs} onRefresh={inventory.fetchLogs} />
          )}
        </div>
      </main>

      {/* Modals */}
      <EditPriceModal
        isOpen={modals.priceModal.isOpen}
        productName={modals.priceModal.name}
        currentPrice={modals.priceModal.price}
        onConfirm={(newPrice) => inventory.handleConfirmPrice(modals.priceModal.id, modals.priceModal.name, newPrice)}
        onClose={modals.closePriceModal}
      />
      <DeleteConfirmModal
        isOpen={modals.deleteModal.isOpen}
        productName={modals.deleteModal.name}
        onConfirm={() => inventory.handleConfirmDelete(modals.deleteModal.id, modals.deleteModal.name)}
        onClose={modals.closeDeleteModal}
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