import { useEffect } from "react";
import { supabase } from "./Useinventory"; 
import { toast } from "sonner";

export const useRealtimeOrders = (refreshData: () => void) => {
  useEffect(() => {
    console.log("🛠 กำลังพยายามเชื่อมต่อ Realtime กับตาราง orders...");

    const channel = supabase
      .channel("orders-realtime-channel") // เปลี่ยนชื่อ channel นิดนึงกันซ้ำ
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("✅ ได้รับข้อมูลใหม่จาก Supabase:", payload);
          const newOrder = payload.new;

          toast.success("ยอดเข้าใหม่ครับอาจารย์! 💰", {
            description: `ยอดรวม ฿${Number(newOrder.total_price).toLocaleString()} จากออเดอร์ใหม่`,
            duration: 8000,
            style: { borderRadius: "1.2rem", padding: "1rem" },
          });

          refreshData();
        }
      )
      .subscribe((status) => {
        // ✅ บรรทัดนี้สำคัญมาก พี่ลองดูใน Console (F12) ว่ามันขึ้นอะไร
        console.log("📡 สถานะการเชื่อมต่อ Realtime:", status);
        
        if (status === "CHANNEL_ERROR") {
          console.error("❌ เชื่อมต่อไม่ได้! พี่ลองเช็ค RLS หรือ Replication ใน Supabase อีกรอบครับ");
        }
      });

    return () => {
      console.log("🔌 ปิดท่อ Realtime");
      supabase.removeChannel(channel);
    };
  }, [refreshData]);
};