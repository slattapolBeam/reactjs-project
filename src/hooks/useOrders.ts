import { useState, useEffect } from "react";
import { supabase } from "./Useinventory";

export const useOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }); // เอาอันล่าสุดขึ้นก่อน

    if (!error) setOrders(data);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    
    if (!error) fetchOrders(); // อัปเดตลิสต์ใหม่
  };

  return { orders, loading, fetchOrders, updateOrderStatus };
};