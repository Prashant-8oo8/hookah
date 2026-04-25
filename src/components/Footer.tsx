import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h2 className="font-bold text-primary tracking-widest text-xl mb-1 font-serif">
              HAZE &amp; CO.
            </h2>
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Premium Hookah Experience
            </p>
          </div>

          {/* Links */}
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/catalog" className="hover:text-primary transition-colors">
              Collection
            </Link>
            <Link href="/cart" className="hover:text-primary transition-colors">
              Cart
            </Link>
            <Link href="/login" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 Haze &amp; Co. — Crafted for the culture.
          </p>
        </div>
      </div>
    </footer>
  );
}
