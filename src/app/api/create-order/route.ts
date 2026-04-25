import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "dummy",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy",
    });
    const { amount } = await req.json();

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
