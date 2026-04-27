"use client";

import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#C9A84C",
    colorBackground: "#111111",
    colorText: "#F5F5F5",
    colorDanger: "#ff4444",
    fontFamily: "sans-serif",
    borderRadius: "8px",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inner payment form — rendered inside <Elements> provider
// ─────────────────────────────────────────────────────────────────────────────
interface PaymentFormProps {
  name: string;
  address: string;
  phone: string;
  total: number;
  userId: string;
  userEmail: string;
  onSuccess: (orderId: string) => void;
}

function StripePaymentForm({
  name,
  address,
  phone,
  total,
  userId,
  userEmail,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const { items, clearCart } = useCartStore();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !stripeReady) return;

    setPaying(true);
    try {
      // Wait for elements to be fully ready before confirming
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Failed to submit payment form.");
        setPaying(false);
        return;
      }

      // 1. Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });

      if (stripeError) {
        toast.error(stripeError.message || "Payment failed. Please try again.");
        setPaying(false);
        return;
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        toast.error("Payment incomplete. Please try again.");
        setPaying(false);
        return;
      }

      toast.success("Payment successful! Confirming your order...");

      // 2. We now rely on the Stripe Webhook to create the order server-side!
      // No more client-side confirm-order API calls.
      clearCart();
      onSuccess(paymentIntent.id);
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleConfirm} className="space-y-6">
      {/* Stripe PaymentElement handles UPI, cards, netbanking automatically for INR */}
      <div className="bg-[#0d0d0d] border border-border/50 rounded-lg p-4">
        <PaymentElement
          onReady={() => setStripeReady(true)}
          options={{
            layout: "tabs",
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!stripe || !elements || !stripeReady || paying}
        className={`w-full font-bold text-lg h-14 hover:scale-[1.02] transition-transform ${!stripeReady ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {!stripeReady ? (
          "Loading payment..."
        ) : paying ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `PAY ₹${total.toLocaleString("en-IN")}`
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        🔒 Secured by Stripe — your payment info is never stored on our servers.
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main checkout page
// ─────────────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, getTotal } = useCartStore();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [step, setStep] = useState<"address" | "payment">("address");

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
            // If the user has a legacy single address string, we can try to put it in line1
            setLine1(data.address || "");
            setCity(data.city || "");
            setState(data.state || "");
            setPincode(data.pincode || "");
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIntentLoading(true);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication error");

      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: getTotal(),
          items,
          userId: user!.uid,
          userEmail: user!.email,
          userName: name,
          shippingAddress: JSON.stringify({ line1, city, state, pincode, phone, name }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initialize payment");
      }

      const { clientSecret: secret } = await res.json();
      setClientSecret(secret);
      setStep("payment");
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize payment");
    } finally {
      setIntentLoading(false);
    }
  };

  const handleOrderSuccess = useCallback(
    (orderId: string) => {
      router.push(`/order-success?orderId=${orderId}`);
    },
    [router]
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 tracking-tight text-primary font-serif">
        Complete Your Order
      </h1>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* ── Left: Address form or Stripe payment ── */}
        <div className="space-y-6">
          {step === "address" ? (
            <>
              <h2 className="text-xl font-bold tracking-wider">Delivery Details</h2>
              <form
                id="address-form"
                onSubmit={handleProceedToPayment}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background/50 border-border/50"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-background/50 border-border/50"
                      placeholder="+91 99999 99999"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    disabled
                    className="bg-background/50 border-border/50 opacity-70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line1">Street Address</Label>
                  <Input
                    id="line1"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="bg-background/50 border-border/50"
                    placeholder="House No, Street, Area"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="bg-background/50 border-border/50"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="bg-background/50 border-border/50"
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="bg-background/50 border-border/50"
                      placeholder="400001"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold text-lg h-14 hover:scale-[1.02] transition-transform"
                  disabled={intentLoading || items.length === 0}
                >
                  {intentLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "PROCEED TO PAYMENT"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold tracking-wider">Payment</h2>
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                >
                  ← Edit address
                </button>
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Delivering to: <span className="text-foreground">{line1}, {city}, {state} - {pincode}</span>
              </div>
              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: stripeAppearance }}
                >
                  <StripePaymentForm
                    name={name}
                    address={JSON.stringify({ line1, city, state, pincode, phone, name })}
                    phone={phone}
                    total={getTotal()}
                    userId={user.uid}
                    userEmail={user.email!}
                    onSuccess={handleOrderSuccess}
                  />
                </Elements>
              )}
            </>
          )}

        </div>

        {/* ── Right: Order summary ── */}
        <div className="bg-card p-8 rounded-lg border border-border/50 h-fit shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold mb-6 border-b border-border/50 pb-4 tracking-wider">
            ORDER SUMMARY
          </h2>
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.name}
                  {item.color && (
                    <span className="text-muted-foreground ml-1">
                      ({item.color})
                    </span>
                  )}
                </span>
                <span>
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div className="border-t border-border/50 pt-4 mt-4 flex justify-between text-lg">
              <span className="font-bold tracking-wider">TOTAL</span>
              <span className="font-bold text-primary">
                ₹{getTotal().toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
