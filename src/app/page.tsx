import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full py-32 md:py-48 lg:py-56 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2000&auto=format&fit=crop')",
          }}
        />
        {/* Smoke / mist overlay */}
        <div className="smoke-overlay absolute inset-0 z-10" />

        <div className="container relative z-20 mx-auto px-4 text-center">
          <p className="text-sm tracking-[0.35em] text-primary uppercase mb-4 font-sans">
            Haze &amp; Co. — Premium Hookah
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 drop-shadow-lg text-white font-serif leading-tight">
            Elevate Your{" "}
            <span className="text-primary">Smoke Session</span>
          </h1>
          <p className="mx-auto max-w-[620px] text-lg text-gray-300 mb-10 font-sans">
            Handcrafted hookahs, premium flavors, and everything you need for
            the perfect session.
          </p>
          <Link href="/catalog">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 h-13 text-base tracking-widest uppercase shadow-[0_0_24px_rgba(201,168,76,0.35)]"
            >
              Explore The Collection
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Features strip ────────────────────────────────────────────────── */}
      <section className="w-full py-12 border-y border-border bg-card/60">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: "🪔",
                title: "Premium Quality",
                desc: "Handpicked hookah products",
              },
              {
                icon: "🚚",
                title: "Pan India Delivery",
                desc: "Fast & secure shipping",
              },
              {
                icon: "💨",
                title: "Flavor Guarantee",
                desc: "100% authentic flavors",
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-3">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-foreground tracking-wide font-serif">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Finest Picks ──────────────────────────────────────────────── */}
      <section className="w-full py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3 text-primary font-serif">
            Our Finest Picks
          </h2>
          <p className="text-muted-foreground mb-12 text-sm tracking-wider uppercase">
            Curated for the perfect session
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["Hookahs", "Flavors", "Accessories"].map((cat) => (
              <Link
                href={`/catalog?category=${cat.toLowerCase()}`}
                key={cat}
                className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-muted border border-border hover:border-primary/60 transition-colors"
              >
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors z-10 duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2">
                  <h3 className="text-2xl font-bold text-white tracking-widest uppercase font-serif">
                    {cat}
                  </h3>
                  <span className="text-xs text-primary tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Shop Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
