"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      // NOTE: If this query fails due to a missing index (e.g. if combined with a where clause later),
      // create it using a link similar to this format:
      // https://console.firebase.google.com/v1/r/project/{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=...
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      toast.success("Order status updated");
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "confirmed": return "bg-blue-500 hover:bg-blue-600 text-white";
      case "shipped": return "bg-orange-500 hover:bg-orange-600 text-white";
      case "delivered": return "bg-green-500 hover:bg-green-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading orders...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 tracking-widest text-primary">MANAGE ORDERS</h1>
      <div className="rounded-md border border-border/50 overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Update Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No orders found.</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-primary">#{order.id}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{order.userEmail}</span>
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[200px]" title={typeof order.shippingAddress === 'string' ? order.shippingAddress : `${order.shippingAddress?.line1 || ''}, ${order.shippingAddress?.city || ''}`}>
                        {typeof order.shippingAddress === 'string' ? order.shippingAddress : `${order.shippingAddress?.line1 || ''}, ${order.shippingAddress?.city || ''}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">₹{order.total.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <select 
                      className="bg-card border border-border/50 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer text-white"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
