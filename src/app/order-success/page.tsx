"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  return (
    <div className="container mx-auto px-4 py-32 text-center max-w-2xl">
      {/* Smoke icon */}
      <div className="text-6xl mb-8">💨</div>
      <h1 className="text-4xl font-bold mb-4 tracking-tight text-primary font-serif">
        Order Confirmed! 💨
      </h1>
      <p className="text-muted-foreground mb-4 text-lg">
        Your hookah order is on its way. Sit back, relax, and get ready for the session.
      </p>
      {orderId && (
        <p className="text-sm text-muted-foreground mb-2">
          Order ID: <span className="text-foreground font-medium">#{orderId}</span>
        </p>
      )}
      <p className="text-sm text-muted-foreground mb-12">
        We've sent a confirmation email to your registered address.
      </p>
      <Link href="/catalog">
        <Button className="font-bold h-14 px-8 text-lg w-full sm:w-auto hover:scale-105 transition-transform">
          CONTINUE SHOPPING
        </Button>
      </Link>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-24 text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
