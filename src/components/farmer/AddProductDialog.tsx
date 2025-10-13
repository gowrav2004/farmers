import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddProductDialog = ({ open, onOpenChange }: AddProductDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "fruit" as "fruit" | "vegetable",
    image_url: "",
  });
  const [qualities, setQualities] = useState([{ quality: "Premium", price: "" }]);

  const addQuality = () => {
    setQualities([...qualities, { quality: "", price: "" }]);
  };

  const removeQuality = (index: number) => {
    setQualities(qualities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const qualitiesArray = qualities.map(q => q.quality);
      const pricesArray = qualities.map(q => parseFloat(q.price));

      const { error } = await supabase.from("products").insert({
        farmer_id: user.id,
        name: formData.name,
        category: formData.category,
        image_url: formData.image_url,
        qualities: qualitiesArray,
        prices: pricesArray,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Product added successfully!" });
      onOpenChange(false);
      setFormData({ name: "", category: "fruit", image_url: "" });
      setQualities([{ quality: "Premium", price: "" }]);
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Add a new product to your farm inventory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fruit">Fruit</SelectItem>
                <SelectItem value="vegetable">Vegetable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Quality & Pricing</Label>
            {qualities.map((q, index) => (
              <div key={index} className="flex gap-2">
                <Input placeholder="Quality (e.g., Premium)" value={q.quality} onChange={(e) => {
                  const newQ = [...qualities];
                  newQ[index].quality = e.target.value;
                  setQualities(newQ);
                }} required />
                <Input type="number" step="0.01" placeholder="Price" value={q.price} onChange={(e) => {
                  const newQ = [...qualities];
                  newQ[index].price = e.target.value;
                  setQualities(newQ);
                }} required />
                {qualities.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeQuality(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addQuality}>
              <Plus className="w-4 h-4 mr-2" />Add Quality
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
