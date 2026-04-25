import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      orderData 
    } = await req.json();

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Save to Firestore securely on server side
    const { id, ...data } = orderData;
    await setDoc(doc(db, "orders", id), orderData);

    // Send Resend Email securely from server side
    const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");
    const { userEmail, items, total, shippingAddress, name } = orderData;

    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #2a2a2a;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #2a2a2a;">${item.color || '—'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #2a2a2a;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #2a2a2a;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #F5F5F5; background: #0a0a0a; padding: 32px; border-radius: 8px;">
        <h2 style="color: #C9A84C; letter-spacing: 0.1em;">Order Confirmed! 💨</h2>
        <p>Hi ${name || 'Customer'},</p>
        <p>Your hookah order is on its way. Sit back, relax, and get ready for the session.</p>
        <p><strong>Order ID:</strong> #${id}</p>
        
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #C9A84C;">Product</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #C9A84C;">Color</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #C9A84C;">Qty</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #C9A84C;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold;">Total:</td>
              <td style="padding: 10px; font-weight: bold;">₹${total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <h3>Shipping Address</h3>
        <p>${shippingAddress}</p>

        <p>You will receive another email when your order has shipped.</p>
      </div>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: userEmail,
      subject: `Order Confirmed – Order #${id}`,
      html: html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
