import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sprout, LogOut, Plus } from "lucide-react";
import AddProductDialog from "@/components/farmer/AddProductDialog";
import ProductsList from "@/components/farmer/ProductsList";
import FarmerOrders from "@/components/farmer/FarmerOrders";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    checkAuth();
    
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

      if (profileData?.user_type !== "farmer") {
        toast({
          title: "Access Denied",
          description: "This area is for farmers only.",
          variant: "destructive",
        });
        navigate("/marketplace");
        return;
      }

      setProfile(profileData);
    } catch (error: any) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
            <Sprout className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Manage your farm products and inventory</CardDescription>
              </div>
              <Button onClick={() => setShowAddProduct(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ProductsList />
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Track orders from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <FarmerOrders />
          </CardContent>
        </Card>
      </main>

      <AddProductDialog 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct}
      />
    </div>
  );
};

export default FarmerDashboard;
