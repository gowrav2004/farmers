import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products (
            *,
            profiles!products_farmer_id_fkey(full_name)
          )
        `)
        .eq("customer_id", user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error: any) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });

      loadCart();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.selected_price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;

    setProcessingOrder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const total = calculateTotal();
      
      // Group items by farmer
      const itemsByFarmer = cartItems.reduce((acc: any, item) => {
        const farmerId = item.products.farmer_id;
        if (!acc[farmerId]) {
          acc[farmerId] = [];
        }
        acc[farmerId].push(item);
        return acc;
      }, {});

      // Create orders for each farmer
      for (const farmerId in itemsByFarmer) {
        const farmerItems = itemsByFarmer[farmerId];
        const farmerTotal = farmerItems.reduce((sum: number, item: any) => 
          sum + (item.selected_price * item.quantity), 0
        );

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            farmer_id: farmerId,
            total_amount: farmerTotal,
            status: "paid",
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Add order items
        const orderItems = farmerItems.map((item: any) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          quality: item.selected_quality,
          price: item.selected_price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("customer_id", user.id);

      if (clearError) throw clearError;

      toast({
        title: "Order placed!",
        description: `Your order of $${total.toFixed(2)} has been placed. The farmers will be notified.`,
      });

      navigate("/marketplace");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Your Cart</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
                  <Button onClick={() => navigate("/marketplace")}>
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              cartItems.map((item) => (
                <Card key={item.id} className="shadow-[var(--shadow-card)]">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img 
                        src={item.products.image_url} 
                        alt={item.products.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.products.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          from {item.products.profiles.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quality: {item.selected_quality}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                        <p className="font-semibold text-lg mt-2">
                          ${(item.selected_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="shadow-[var(--shadow-card)] sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review your order details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items ({cartItems.length})</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={placeOrder}
                    disabled={processingOrder}
                  >
                    {processingOrder ? "Processing..." : "Place Order"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    By placing this order, farmers will be notified and your payment will be processed.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
