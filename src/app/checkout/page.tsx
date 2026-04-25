"use client";

import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Script from "next/script";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setEmail(user.email || "");
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    const amount = getTotal();

    try {
      // 1. Create order on server
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      
      const order = await res.json();
      
      if (order.error) {
        throw new Error(order.error);
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Haze & Co.",
        description: "Premium Hookah Order",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            toast.success("Payment successful! Processing order...");
            
            // Generate a random 6-character alphanumeric string for a shorter user-facing ID
            const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            const orderData = {
              id: shortId,
              userId: user.uid,
              userEmail: user.email,
              name: name,
              items,
              total: amount,
              shippingAddress: address,
              status: "confirmed",
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              createdAt: new Date().toISOString(),
            };

            // Verify payment, save to Firestore, and send confirmation email securely on the server
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData,
              }),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json();
              throw new Error(errData.error || "Payment verification failed");
            }

            clearCart();
            router.push(`/order-success?id=${shortId}`);
          } catch (error) {
            console.error(error);
            toast.error("Error processing order after payment");
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#D4AF37", // primary gold color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();

    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 tracking-tight text-primary font-serif">Complete Your Order</h1>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-wider">Delivery Details</h2>
            <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled className="bg-background/50 border-border/50 opacity-70" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Shipping Address</Label>
                <Input id="address" required value={address} onChange={(e) => setAddress(e.target.value)} className="bg-background/50 border-border/50" />
              </div>
            </form>
          </div>

          <div className="bg-card p-8 rounded-lg border border-border/50 h-fit shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold mb-6 border-b border-border/50 pb-4 tracking-wider">ORDER SUMMARY</h2>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-4 mt-4 flex justify-between text-lg">
                <span className="font-bold tracking-wider">TOTAL</span>
                <span className="font-bold text-primary">₹{getTotal().toLocaleString("en-IN")}</span>
              </div>
            </div>
            <Button 
              type="submit" 
              form="checkout-form"
              className="w-full font-bold text-lg h-14 hover:scale-[1.02] transition-transform" 
              disabled={loading || items.length === 0}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "PAY SECURELY"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
