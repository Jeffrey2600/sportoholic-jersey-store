import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const orderSchema = z.object({
  userName: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  userPhone: z.string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  deliveryAddress: z.string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters"),
  quantity: z.number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be positive")
    .max(9999, "Quantity cannot exceed 9999"),
});

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
    fetchUser();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", id)
      .single();

    setProduct(data);
  };

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || "");
        setUserPhone(profile.phone_number || "");
      }
    }
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/auth");
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    setLoading(true);

    try {
      const validatedData = orderSchema.parse({
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        quantity,
      });

      if (validatedData.quantity > product.stock_quantity) {
        toast.error("Not enough stock available");
        setLoading(false);
        return;
      }

      // Navigate to payment page with order context
      navigate("/payment", {
        state: {
          product: {
            id: product.id,
            title: product.title,
            price: product.price,
            sku: product.sku,
            image_url: product.images?.[0] || product.image_url,
            stock_quantity: product.stock_quantity,
          },
          quantity: validatedData.quantity,
          totalPrice: product.price * validatedData.quantity,
          userName: validatedData.userName,
          userPhone: validatedData.userPhone,
          deliveryAddress: validatedData.deliveryAddress,
          selectedSize,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to proceed");
      }
    } finally {
      setLoading(false);
    }
  };

  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image_url 
    ? [product.image_url] 
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary relative group">
              {productImages.length > 0 ? (
                <>
                  <img
                    src={productImages[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {productImages.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sport-red to-sport-red-dark">
                  <ShoppingCart className="h-32 w-32 text-primary-foreground/50" />
                </div>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-primary scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{product.title}</h1>
            {product.sku && (
              <p className="text-xs sm:text-sm text-muted-foreground font-mono mb-2">SKU: {product.sku}</p>
            )}
            {product.club && (
              <p className="text-base sm:text-lg text-muted-foreground mb-2">{product.club}</p>
            )}
            <p className="text-2xl sm:text-3xl font-bold text-primary mb-6">
              ₹{product.price.toFixed(2)}
            </p>

            <p className="text-muted-foreground mb-6">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <Label className="text-base mb-3 block">Select Size</Label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground scale-105'
                          : 'border-border hover:border-primary/50 hover:scale-105'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className={`text-lg font-semibold ${product.stock_quantity > 0 ? 'text-green-500' : 'text-destructive'}`}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </p>
            </div>

            {user && (
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit Indian mobile number"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <textarea
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Flat / House no, Street, City, State, PIN code"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              onClick={handleOrder}
              disabled={product.stock_quantity === 0 || loading}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {loading ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
