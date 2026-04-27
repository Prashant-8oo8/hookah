"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Product } from "@/components/ProductCard";
import { notFound, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      color: product.color,
    });
    toast.success(`${product.name} added to your session!`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image */}
        <div className="relative aspect-[4/5] w-full bg-muted rounded-lg overflow-hidden border border-border shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <Image
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <p className="text-primary font-semibold tracking-widest uppercase mb-2 text-sm">
              {product.category}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 font-serif">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-primary">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            {product.color && (
              <span className="inline-block mt-3 px-3 py-1 border border-border rounded-full text-xs text-muted-foreground tracking-wide">
                Color: {product.color}
              </span>
            )}
          </div>

          {/* About section */}
          <div>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              About This Product
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Availability:{" "}
              <span
                className={
                  product.stock > 0
                    ? "text-green-500 font-semibold"
                    : "text-destructive font-semibold"
                }
              >
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-12 text-lg font-bold hover:scale-105 transition-transform tracking-widest"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? "ADD TO MY SESSION" : "OUT OF STOCK"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
