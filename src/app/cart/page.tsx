"use client";

import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (user) {
      router.push("/checkout");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-6 tracking-tight text-primary font-serif">
          Your Session Cart is Empty
        </h1>
        <p className="text-muted-foreground mb-10 text-lg">
          Looks like you haven't added anything yet. Explore our collection.
        </p>
        <Link href="/catalog">
          <Button className="font-bold h-14 px-8 text-lg w-full sm:w-auto hover:scale-105 transition-transform">
            BROWSE THE COLLECTION
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 tracking-tight text-primary font-serif">
        My Session Cart
      </h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col sm:flex-row gap-6 p-6 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors"
            >
              <div className="relative w-32 h-40 bg-muted rounded overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                <Image
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 20vw, 10vw"
                  className="object-cover"
                />
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-xl font-serif">{item.name}</h3>
                    {item.color && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Color: {item.color}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-primary text-xl">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                    <button
                      className="px-4 py-2 hover:bg-muted transition-colors text-primary"
                      onClick={() =>
                        updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-6 py-2 border-x border-border font-medium">
                      {item.quantity}
                    </span>
                    <button
                      className="px-4 py-2 hover:bg-muted transition-colors text-primary"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card p-8 rounded-lg border border-border h-fit sticky top-24 shadow-lg shadow-black/20">
          <h2 className="text-2xl font-bold mb-6 border-b border-border pb-4 tracking-wider font-serif">
            Order Summary
          </h2>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">₹{getTotal().toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-semibold text-sm self-center">Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-6 flex justify-between mt-4">
              <span className="font-bold text-2xl tracking-wider">TOTAL</span>
              <span className="font-bold text-2xl text-primary">
                ₹{getTotal().toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <Button
            className="w-full font-bold text-lg h-14 hover:scale-[1.02] transition-transform"
            onClick={handleCheckout}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
