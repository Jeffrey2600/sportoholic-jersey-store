import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
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
  description,
  price,
  stockQuantity,
  imageUrl,
  images,
  club,
  sizes,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const displayImage = images && images.length > 0 ? images[0] : imageUrl;

  return (
    <Card 
      className="group overflow-hidden border-border bg-card transition-all hover:shadow-[var(--shadow-glow)] cursor-pointer"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-sport-red to-sport-red-dark">
            <ShoppingCart className="h-16 w-16 text-primary-foreground/50" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{title}</h3>
        {club && <p className="text-xs text-muted-foreground mb-2">{club}</p>}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        {sizes && sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {sizes.slice(0, 4).map((size) => (
              <span key={size} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium border border-primary/20">
                {size}
              </span>
            ))}
            {sizes.length > 4 && (
              <span className="px-2 py-0.5 text-muted-foreground text-xs">+{sizes.length - 4}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">₹{price.toFixed(2)}</span>
          <span className={`text-sm ${stockQuantity > 0 ? 'text-green-500' : 'text-destructive'}`}>
            {stockQuantity > 0 ? `${stockQuantity} in stock` : 'Out of stock'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-gradient-to-r from-sport-red to-sport-red-dark hover:opacity-90 transition-opacity"
          disabled={stockQuantity === 0}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${id}`);
          }}
        >
          {stockQuantity > 0 ? 'View Details' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
