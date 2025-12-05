import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  images: string[] | null;
  club: string | null;
  color: string | null;
  sku: string | null;
  sizes: string[] | null;
}

interface ProductCarouselProps {
  products: Product[];
  title: string;
}

const ProductCarousel = ({ products, title }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4"
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[260px]">
              <ProductCard
                id={product.id}
                title={product.title}
                description={product.description || ""}
                price={product.price}
                stockQuantity={product.stock_quantity}
                imageUrl={product.image_url || undefined}
                images={product.images || []}
                sku={product.sku || ""}
                sizes={product.sizes || []}
                club={product.club || undefined}
                color={product.color || undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;