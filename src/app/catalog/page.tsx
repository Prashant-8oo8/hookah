"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard, { Product } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

const CATEGORIES = ["Hookahs", "Flavors", "Accessories"];

function CatalogContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  useEffect(() => {
    // Sync active category pill with URL param on first load
    if (categoryFilter) setActiveCategory(categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory
      ? p.category.toLowerCase() === activeCategory.toLowerCase()
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-primary font-serif">
        The Collection
      </h1>
      <p className="text-muted-foreground text-sm tracking-wider uppercase mb-8">
        {activeCategory ? activeCategory : "All Products"}
      </p>

      {/* Search + Category filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <Input
          placeholder="Search flavors, hookahs, accessories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-card border-border focus-visible:ring-primary h-12"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === null
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory((prev) =>
                  prev?.toLowerCase() === cat.toLowerCase() ? null : cat.toLowerCase()
                )
              }
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCategory?.toLowerCase() === cat.toLowerCase()
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-muted animate-pulse rounded-lg border border-border"
            />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground border border-border rounded-lg bg-card/20">
          <p className="text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 text-center text-xl tracking-widest text-primary animate-pulse font-serif">
          Loading The Collection...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
