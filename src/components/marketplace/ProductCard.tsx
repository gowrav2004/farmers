import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProductCard = ({ product, onCartUpdate }: any) => {
  const { toast } = useToast();
  const [selectedQuality, setSelectedQuality] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const addToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("cart_items").insert({
      customer_id: user.id,
      product_id: product.id,
      quantity,
      selected_quality: product.qualities[selectedQuality],
      selected_price: product.prices[selectedQuality],
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added to cart!", description: `${product.name} added to your cart` });
      onCartUpdate();
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-lg transition-all">
      <CardContent className="p-0">
        <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-muted-foreground">from {product.profiles.full_name}</p>
          </div>
          <Select value={selectedQuality.toString()} onValueChange={(v) => setSelectedQuality(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {product.qualities.map((q: string, i: number) => (
                <SelectItem key={i} value={i.toString()}>{q} - ${product.prices[i]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={quantity.toString()} onValueChange={(v) => setQuantity(parseInt(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="flex-1" onClick={addToCart}>
              <ShoppingCart className="w-4 h-4 mr-2" />Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
