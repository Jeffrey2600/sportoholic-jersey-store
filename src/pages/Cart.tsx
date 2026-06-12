import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/payment", { state: { cart: items, totalPrice } });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Start shopping and add jerseys you love.</p>
          <Button asChild className="bg-foreground text-background">
            <Link to="/products">Shop now</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Continue shopping
        </Button>
        <h1 className="text-2xl font-bold mb-4">Your Cart ({items.length})</h1>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <Card key={idx} className="p-3 flex gap-3">
              {it.imageUrl && (
                <img src={it.imageUrl} alt={it.title} className="w-20 h-20 rounded-md object-cover bg-secondary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{it.title}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  {it.size && <span>Size: {it.size}</span>}
                  {it.fullSleeve && (
                    <span className="text-sport-accent font-medium">Full sleeve (+₹{it.extraCharges})</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      onClick={() => updateQuantity(idx, it.quantity - 1)}
                      className="px-2 py-1 hover:bg-secondary"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-sm font-medium">{it.quantity}</span>
                    <button
                      onClick={() => updateQuantity(idx, it.quantity + 1)}
                      className="px-2 py-1 hover:bg-secondary"
                      aria-label="Increase"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      ₹{((it.price + it.extraCharges) * it.quantity).toFixed(0)}
                    </span>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-destructive p-1 hover:bg-destructive/10 rounded"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 mt-6 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-2xl font-bold text-sport-accent">₹{totalPrice.toFixed(0)}</span>
          </div>
          <Button
            size="lg"
            className="w-full bg-foreground text-background hover:bg-foreground/90 h-12"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Cart;
