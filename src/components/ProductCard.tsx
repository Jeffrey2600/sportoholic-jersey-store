import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
  images?: string[];
  club?: string;
  color?: string;
  sku?: string;
  sizes?: string[];
}

const ProductCard = ({
  id,
  title,
  price,
  compareAtPrice,
  stockQuantity,
  imageUrl,
  images,
  club,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const displayImage = images && images.length > 0 ? images[0] : imageUrl;

  return (
    <Card 
      className="group overflow-hidden border-border bg-card cursor-pointer hover:shadow-[var(--shadow-hover)] transition-shadow"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-secondary relative">
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {stockQuantity === 0 && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
            Sold Out
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{title}</h3>
        {club && <p className="text-xs text-muted-foreground mb-2">{club}</p>}
        <div className="flex items-center gap-2">
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-muted-foreground line-through">₹{compareAtPrice.toFixed(0)}</span>
          )}
          <span className="text-base font-bold">₹{price.toFixed(0)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-xs text-green-600 font-medium">
              {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% off
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;