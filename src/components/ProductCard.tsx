"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  color?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();

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
    <Card className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-[0_0_24px_rgba(201,168,76,0.18)] hover:border-primary/60 flex flex-col h-full">
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>
      <CardContent className="p-5 flex-grow">
        <h3 className="font-semibold text-lg line-clamp-1 font-serif">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{product.description}</p>
        <p className="mt-3 font-bold text-primary text-xl">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        {product.color && (
          <p className="mt-1 text-xs text-muted-foreground">Color: {product.color}</p>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {product.stock > 0 ? "Add to Session" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}
