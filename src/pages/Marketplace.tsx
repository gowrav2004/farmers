import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, LogOut, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/marketplace/ProductCard";
import { Badge } from "@/components/ui/badge";

const Marketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    checkAuth();
    loadProducts();
    loadCartCount();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData?.user_type !== "customer") {
        toast({
          title: "Access Denied",
          description: "This area is for customers only.",
          variant: "destructive",
        });
        navigate("/farmer-dashboard");
        return;
      }

      setProfile(profileData);
    } catch (error: any) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles!products_farmer_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
      return;
    }

    setProducts(data || []);
  };

  const loadCartCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user.id);

    setCartCount(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fruits = products.filter((p) => p.category === "fruit");
  const vegetables = products.filter((p) => p.category === "vegetable");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">FarmFresh Marketplace</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/cart")} className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Fresh from Local Farms</h2>
          <p className="text-muted-foreground">Browse our selection of quality produce</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
            <TabsTrigger value="fruits">Fruits ({fruits.length})</TabsTrigger>
            <TabsTrigger value="vegetables">Vegetables ({vegetables.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onCartUpdate={loadCartCount}
                />
              ))}
            </div>
            {products.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No products available yet.</p>
            )}
          </TabsContent>

          <TabsContent value="fruits" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {fruits.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onCartUpdate={loadCartCount}
                />
              ))}
            </div>
            {fruits.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No fruits available yet.</p>
            )}
          </TabsContent>

          <TabsContent value="vegetables" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vegetables.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onCartUpdate={loadCartCount}
                />
              ))}
            </div>
            {vegetables.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No vegetables available yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Marketplace;
