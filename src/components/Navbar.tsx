"use client";

import Link from "next/link";
import { ShoppingCart, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { items } = useCartStore();
  const { user, isAdmin } = useAuth();

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        {/* Brand */}
        <div className="flex gap-6 md:gap-10 items-center">
          <Link href="/" className="flex flex-col items-start leading-none">
            <span className="font-bold inline-block text-primary text-xl tracking-widest font-serif">
              HAZE &amp; CO.
            </span>
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Premium Hookah Experience
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/catalog"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              The Collection
            </Link>
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex border-primary/50 text-primary hover:bg-primary/10"
              >
                Admin Dashboard
              </Button>
            </Link>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full text-[10px]"
                >
                  {itemCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>

          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Log Out"
              className="hover:text-primary"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon" title="Log In" className="hover:text-primary">
                <UserIcon className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
