import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCarousel from "@/components/ProductCarousel";
import CategoryFilters from "@/components/CategoryFilters";
import BrandMarquee from "@/components/BrandMarquee";
import Newsletter from "@/components/Newsletter";
import TrustBadges from "@/components/TrustBadges";
import ScrollToTop from "@/components/ScrollToTop";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ContactSection from "@/components/ContactSection";
import { Instagram, ArrowRight } from "lucide-react";

const Index = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const categories = ["All", "Featured", "New Season", "Retro", "Football", "Cricket"];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeCategory === "All") {
      setFilteredProducts(products);
    } else {
      // For now, just show all products (filter logic can be enhanced with real category data)
      setFilteredProducts(products);
    }
  }, [activeCategory, products]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
    setFilteredProducts(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Brand Marquee */}
      <BrandMarquee />

      {/* Trending Products with Filters */}
      <section className="py-8 bg-gradient-to-b from-background via-amber-50/40 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Trending Products</h2>
            <Button
              variant="link"
              className="text-muted-foreground p-0 h-auto"
              onClick={() => navigate("/products")}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <CategoryFilters
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Products Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-6">
            {filteredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description || ""}
                price={product.price}
                compareAtPrice={product.compare_at_price}
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
        </div>
      </section>

      {/* Featured Carousel */}
      {products.length > 0 && (
        <ProductCarousel 
          products={products.slice(0, 6)} 
          title="You May Also Like"
        />
      )}

      {/* Categories Grid */}
      <section className="py-8 bg-gradient-to-br from-blue-50 via-rose-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Shop by Sport</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Football", icon: "⚽" },
              { name: "Cricket", icon: "🏏" },
              { name: "Basketball", icon: "🏀" },
              { name: "F1", icon: "🏎️" },
            ].map((category) => (
              <button
                key={category.name}
                onClick={() => navigate(`/products?category=${category.name.toLowerCase()}`)}
                className="p-6 md:p-8 rounded-xl bg-background border border-border hover:shadow-[var(--shadow-hover)] transition-all group"
              >
                <div className="text-4xl md:text-5xl mb-2 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />

      {/* Contact Section */}
      <ContactSection />

      {/* Social Banner */}
      <section className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <Instagram className="h-8 w-8 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">Follow Us on Instagram</h2>
          <p className="text-background/70 mb-6">@sportoho7ic__jersey_store</p>
          <Button 
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-transform"
            onClick={() => window.open('https://www.instagram.com/sportoho7ic__jersey_store', '_blank')}
          >
            Check Out
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="text-center text-muted-foreground text-sm">
            <p>&copy; 2025 Sportoholic. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <ScrollToTop />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;