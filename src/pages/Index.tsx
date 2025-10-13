import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout, ShoppingBag, Leaf, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-farm.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .single();

        if (profile) {
          navigate(profile.user_type === "farmer" ? "/farmer-dashboard" : "/marketplace");
          return;
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Leaf className="w-12 h-12 text-primary" />
            <h1 className="text-6xl md:text-7xl font-bold">FarmFresh</h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect directly with local farmers. Fresh produce from farm to your table.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Shop Fresh Produce
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              <Sprout className="w-5 h-5 mr-2" />
              Sell Your Harvest
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose FarmFresh?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Fresh</h3>
              <p className="text-muted-foreground">
                Direct from local farms to ensure the freshest produce
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Support Local</h3>
              <p className="text-muted-foreground">
                Help local farmers grow their business and community
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card shadow-[var(--shadow-card)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
              <p className="text-muted-foreground">
                Browse, order, and get fresh produce delivered
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join our community of farmers and customers today
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate("/auth")}
          >
            Join FarmFresh Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
