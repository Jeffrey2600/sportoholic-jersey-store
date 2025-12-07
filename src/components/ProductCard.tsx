import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Eye, Zap } from "lucide-react";

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
  const [isLiked, setIsLiked] = useState(false);

  const displayImage = images && images.length > 0 ? images[0] : imageUrl;
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
    : 0;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Card 
      className="group overflow-hidden border-border bg-card cursor-pointer hover:shadow-[var(--shadow-hover)] transition-all duration-300"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-secondary relative">
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges Container */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="bg-sport-red text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
              {discountPercent}% OFF
            </span>
          )}
          {stockQuantity > 0 && stockQuantity <= 5 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> HOT
            </span>
          )}
        </div>

        {stockQuantity === 0 && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="bg-background text-foreground text-xs font-bold px-3 py-1.5 rounded">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <button
            onClick={handleLike}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors shadow-md ${
              isLiked ? "bg-sport-red text-white" : "bg-background text-foreground hover:bg-sport-red hover:text-white"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${id}`);
            }}
            className="h-8 w-8 rounded-full bg-background text-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors shadow-md"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-sport-accent transition-colors">{title}</h3>
        {club && <p className="text-xs text-muted-foreground mb-2">{club}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold">₹{price.toFixed(0)}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">₹{compareAtPrice.toFixed(0)}</span>
              <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">
                SAVE ₹{(compareAtPrice - price).toFixed(0)}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;