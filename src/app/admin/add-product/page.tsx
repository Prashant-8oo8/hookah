"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getIdToken } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AddProductPage() {
  useAuth(); // ensures admin layout guard is active
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [color, setColor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUploadImage = async () => {
    if (!file) return null;

    try {
      // Get a fresh Firebase ID token for server-side auth verification
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      const idToken = await getIdToken(currentUser);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await uploadRes.json();
      return { imageUrl: data.imageUrl as string, fileId: data.fileId as string };
    } catch (error) {
      console.error("Image upload failed", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";
      let imageFileId = "";
      if (file) {
        const uploadResult = await handleUploadImage();
        if (uploadResult) {
          imageUrl = uploadResult.imageUrl;
          imageFileId = uploadResult.fileId;
        }
      }

      await addDoc(collection(db, "products"), {
        name,
        description,
        // Using parseFloat and parseInt for safer number handling
        price: parseFloat(price),
        category: category.toLowerCase(),
        stock: parseInt(stock, 10),
        color,
        imageUrl,
        imageFileId,
        createdAt: serverTimestamp(),
      });

      toast.success("Product added successfully!");
      
      // Clear the physical form in the DOM (fixes the ghost file bug)
      const formElement = e.target as HTMLFormElement;
      formElement.reset(); 
      
      // Clear the React state
      setName(""); 
      setDescription(""); 
      setPrice(""); 
      setCategory(""); 
      setStock(""); 
      setColor(""); 
      setFile(null);

    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 tracking-widest text-primary">ADD NEW PRODUCT</h1>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-background p-6 rounded-lg border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base">Product Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/50 h-12" />
          </div>
          <div className="space-y-3">
            <Label htmlFor="category" className="text-base">Category</Label>
            <Input id="category" required value={category} onChange={(e) => setCategory(e.target.value)} className="bg-muted/50 h-12" placeholder="e.g. Apparel" />
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="description" className="text-base">Description</Label>
          <Textarea id="description" required value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/50 min-h-[150px] resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="price" className="text-base">Price (₹)</Label>
            <Input id="price" type="number" required min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-muted/50 h-12" />
          </div>
          <div className="space-y-3">
            <Label htmlFor="stock" className="text-base">Stock Quantity</Label>
            <Input id="stock" type="number" required min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className="bg-muted/50 h-12" />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="color" className="text-base">Color</Label>
          <Input
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Rose Gold, Midnight Black, Pearl White"
            className="bg-muted/50 h-12"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="image" className="text-base">Product Image</Label>
          <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-muted/50 h-12 file:h-full file:bg-primary file:text-primary-foreground file:border-0 file:mr-4 file:px-4 cursor-pointer" />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold hover:scale-[1.02] transition-transform">
          {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "SAVE PRODUCT"}
        </Button>
      </form>
    </div>
  );
}