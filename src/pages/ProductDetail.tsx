import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const orderSchema = z.object({
  userName: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  userEmail: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
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
  const [userEmail, setUserEmail] = useState("");

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
        setUserEmail(profile.email || user.email || "");
      }
    }
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Validate inputs
      const validatedData = orderSchema.parse({
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        quantity,
      });

      // Check stock availability
      if (validatedData.quantity > product.stock_quantity) {
        toast.error("Not enough stock available");
        setLoading(false);
        return;
      }

      // Create order
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: validatedData.quantity,
          total_price: product.price * validatedData.quantity,
          user_email: validatedData.userEmail,
          user_name: validatedData.userName,
        });

      if (orderError) throw orderError;

      // Update stock
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock_quantity: product.stock_quantity - validatedData.quantity })
        .eq("id", product.id);

      if (stockError) throw stockError;

      // Send email notification
      await supabase.functions.invoke("send-order-email", {
        body: {
          orderDetails: {
            productTitle: product.title,
            quantity: validatedData.quantity,
            totalPrice: product.price * validatedData.quantity,
            userName: validatedData.userName,
            userEmail: validatedData.userEmail,
          },
        },
      });

      toast.success("Order placed successfully! Check your email for confirmation.");
      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to place order");
      }
    } finally {
      setLoading(false);
    }
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
          <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sport-red to-sport-red-dark">
                <ShoppingCart className="h-32 w-32 text-primary-foreground/50" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
            {product.club && (
              <p className="text-lg text-muted-foreground mb-2">{product.club}</p>
            )}
            <p className="text-3xl font-bold text-primary mb-6">
              ₹{product.price.toFixed(2)}
            </p>

            <p className="text-muted-foreground mb-6">{product.description}</p>

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
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your email"
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
              className="w-full bg-gradient-to-r from-sport-red to-sport-red-dark hover:opacity-90 transition-opacity"
              onClick={handleOrder}
              disabled={product.stock_quantity === 0 || loading}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {loading ? "Processing..." : "Order Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
