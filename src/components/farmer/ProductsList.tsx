import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProductsList = () => {
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product deleted" });
      loadProducts();
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="p-4">
            <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-3" />
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
            <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => deleteProduct(product.id)}>
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </Button>
          </CardContent>
        </Card>
      ))}
      {products.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No products yet</p>}
    </div>
  );
};

export default ProductsList;
