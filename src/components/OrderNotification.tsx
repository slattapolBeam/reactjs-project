import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import { supabase } from "../hooks/Useinventory";

interface OrderNotificationProps {
  onOrderReceived?: () => void; // เอาไว้สั่ง Refresh ข้อมูลในหน้า Dashboard
}

export const OrderNotification = ({ onOrderReceived }: OrderNotificationProps) => {
  useEffect(() => {
    // ตั้งค่าการฟัง Realtime
    const channel = supabase
      .channel("inventory-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT", // เมื่อมีข้อมูลใหม่เพิ่มเข้ามา
          schema: "public",
          table: "orders", // ✅ มั่นใจนะพี่ว่าตารางชื่อ orders
        },
        (payload) => {
          const newOrder = payload.new;

          // ยิง Notify
          toast.success("คำสั่งซื้อใหม่! 🛒", {
            description: `ออเดอร์จากคุณ ${newOrder.customer_name || 'ลูกค้า'} | ยอด ฿${Number(newOrder.total_price).toLocaleString()}`,
            duration: 8000,
            style: {
              borderRadius: "1.5rem",
              padding: "1rem",
              border: "1px solid #e2e8f0",
            },
          });
          if (onOrderReceived) onOrderReceived();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrderReceived]);

  // ตัว Component นี้จะส่งแค่ Toaster ออกไปวางบนหน้าจอ
  return <Toaster position="top-right" richColors expand={true} />;
};