import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FarmerOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("orders")
      .select("*, profiles!orders_customer_id_fkey(full_name)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="p-4 border rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">Order from {order.profiles.full_name}</p>
              <p className="text-sm text-muted-foreground">Amount: ${order.total_amount}</p>
              <p className="text-sm text-muted-foreground capitalize">Status: {order.status}</p>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
    </div>
  );
};

export default FarmerOrders;
