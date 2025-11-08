import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import { Shirt, Search } from "lucide-react";

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .limit(6)
      .order("created_at", { ascending: false });

    setFeaturedProducts(data || []);
  };

  const categories = [
    { name: "Football", icon: "⚽" },
    { name: "Cricket", icon: "🏏" },
    { name: "Basketball", icon: "🏀" },
    { name: "F1", icon: "🏎️" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-sport-red/20 to-transparent" />
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary to-sport-red-dark bg-clip-text text-transparent">
            SPORTOHOLIC
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto px-4">
            Premium Sports Jerseys for True Fans
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-sport-red to-sport-red-dark hover:opacity-90 transition-opacity text-lg px-8 py-6"
            onClick={() => navigate("/products")}
          >
            <Shirt className="mr-2 h-5 w-5" />
            Shop Now
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Shop by Sport</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => navigate(`/products?category=${category.name.toLowerCase()}`)}
                className="p-8 rounded-lg border border-border bg-card hover:bg-secondary transition-all hover:shadow-[var(--shadow-glow)] group"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-bold text-lg">{category.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Featured Jerseys</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description || ""}
                price={product.price}
                stockQuantity={product.stock_quantity}
                imageUrl={product.image_url}
                images={product.images || []}
                sku={product.sku || ""}
                sizes={product.sizes || []}
                club={product.club}
                color={product.color}
              />
            ))}
          </div>
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/products")}
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 mt-16">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Sportoholic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
