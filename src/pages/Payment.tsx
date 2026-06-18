import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  ShieldCheck,
  Upload,
  Check,
  MapPin,
  Phone,
  User as UserIcon,
  Shirt,
} from "lucide-react";
import paymentQr from "@/assets/payment-qr.png";
import { z } from "zod";
import { useCart, CartItem } from "@/contexts/CartContext";

const UPI_ID = "balarohithpoco07-2@okicici";

const paymentSchema = z.object({
  transactionId: z
    .string()
    .trim()
    .min(8, "Transaction ID must be at least 8 characters")
    .max(50, "Transaction ID is too long")
    .regex(/^[A-Za-z0-9]+$/, "Only letters and numbers are allowed"),
  userName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters"),
  userPhone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  deliveryAddress: z.string().trim().min(10, "Address must be at least 10 characters").max(500),
});

interface LineItem {
  productId: string;
  title: string;
  sku?: string;
  imageUrl?: string;
  basePrice: number;
  extraCharges: number;
  fullSleeve: boolean;
  customizedName?: string;
  size?: string;
  quantity: number;
  stockQuantity: number;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const { clear } = useCart();

  const [user, setUser] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Editable customer details (prefilled if Buy Now passes them, else from profile)
  const [userName, setUserName] = useState<string>(state?.userName || "");
  const [userPhone, setUserPhone] = useState<string>(state?.userPhone || "");
  const [deliveryAddress, setDeliveryAddress] = useState<string>(state?.deliveryAddress || "");

  // Normalize: either single product or cart array
  const items: LineItem[] = useMemo(() => {
    if (state?.cart) {
      return (state.cart as CartItem[]).map((c) => ({
        productId: c.productId,
        title: c.title,
        sku: c.sku,
        imageUrl: c.imageUrl,
        basePrice: c.price,
        extraCharges: c.extraCharges,
        fullSleeve: c.fullSleeve,
        customizedName: c.customizedName,
        size: c.size,
        quantity: c.quantity,
        stockQuantity: c.stockQuantity,
      }));
    }
    if (state?.product) {
      return [
        {
          productId: state.product.id,
          title: state.product.title,
          sku: state.product.sku,
          imageUrl: state.product.image_url,
          basePrice: Number(state.product.price),
          extraCharges: state.extraCharges || 0,
          fullSleeve: !!state.fullSleeve,
          customizedName: state.customizedName,
          size: state.selectedSize,
          quantity: state.quantity,
          stockQuantity: state.product.stock_quantity,
        },
      ];
    }
    return [];
  }, [state]);

  const totalPrice = useMemo(
    () => items.reduce((s, i) => s + (i.basePrice + i.extraCharges) * i.quantity, 0),
    [items]
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (!data.user) {
        navigate("/auth");
        return;
      }
      // Prefill from profile if not provided
      if (!userName || !userPhone) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone_number")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile) {
          if (!userName) setUserName(profile.full_name || "");
          if (!userPhone) setUserPhone(profile.phone_number || "");
        }
      }
    });
    if (items.length === 0) {
      toast.error("No order details found");
      navigate("/");
    }
  }, []);

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error("Please attach the payment screenshot");
      return;
    }
    setLoading(true);
    try {
      const validated = paymentSchema.parse({
        transactionId: transactionId.trim(),
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });

      const ext = screenshot.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, screenshot, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("payment-screenshots").getPublicUrl(path);

      // Insert one order row per line item, sharing transaction id
      const rows = items.map((it) => ({
        user_id: user.id,
        product_id: it.productId,
        quantity: it.quantity,
        total_price: (it.basePrice + it.extraCharges) * it.quantity,
        user_email: user.email,
        user_name: validated.userName,
        user_phone: validated.userPhone,
        delivery_address: validated.deliveryAddress,
        product_sku: it.sku,
        selected_size: it.size || null,
        full_sleeve: it.fullSleeve,
        extra_charges: it.extraCharges,
        customized_name: it.customizedName || null,
        transaction_id: validated.transactionId,
        payment_screenshot_url: pub.publicUrl,
        status: "pending",
      }));

      const { error: orderError } = await supabase.from("orders").insert(rows);
      if (orderError) throw orderError;

      // Decrement stock per item (best-effort)
      await Promise.all(
        items.map((it) =>
          supabase
            .from("products")
            .update({ stock_quantity: Math.max(0, it.stockQuantity - it.quantity) })
            .eq("id", it.productId)
        )
      );

      // Notify (best-effort)
      try {
        await supabase.functions.invoke("send-order-email", {
          body: {
            orderDetails: {
              items: items.map((it) => ({
                title: it.title,
                quantity: it.quantity,
                size: it.size,
                fullSleeve: it.fullSleeve,
                extraCharges: it.extraCharges,
                lineTotal: (it.basePrice + it.extraCharges) * it.quantity,
              })),
              totalPrice,
              userName: validated.userName,
              userEmail: user.email,
              userPhone: validated.userPhone,
              deliveryAddress: validated.deliveryAddress,
              transactionId: validated.transactionId,
              paymentScreenshotUrl: pub.publicUrl,
            },
          },
        });
      } catch {}

      if (state?.cart) clear();
      toast.success("Order placed! We'll verify your payment shortly.");
      navigate("/profile");
    } catch (err: any) {
      if (err instanceof z.ZodError) toast.error(err.errors[0].message);
      else toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Complete Your Payment</h1>
        <p className="text-muted-foreground mb-5 text-sm">
          Review your order, scan the QR to pay, then submit your payment proof.
        </p>

        {/* Order Summary */}
        <Card className="p-4 sm:p-5 mb-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sport-accent" /> Order Summary
          </h2>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                {it.imageUrl && (
                  <img src={it.imageUrl} alt={it.title} className="w-16 h-16 rounded-md object-cover bg-secondary" />
                )}
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{it.title}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    {it.sku && <span className="font-mono">SKU: {it.sku}</span>}
                    {it.size && <span>Size: {it.size}</span>}
                    <span>Qty: {it.quantity}</span>
                  </div>
                  {it.fullSleeve && (
                    <p className="text-xs text-sport-accent font-medium mt-1 flex items-center gap-1">
                      <Shirt className="h-3 w-3" /> Full sleeve +₹49
                    </p>
                  )}
                  {it.customizedName && (
                    <p className="text-xs text-violet-700 font-medium mt-1">
                      Name print: <span className="font-bold">{it.customizedName}</span> +₹49
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold">
                  ₹{((it.basePrice + it.extraCharges) * it.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
            <span className="text-base font-medium">Amount to Pay</span>
            <span className="text-2xl font-bold text-sport-accent">₹{totalPrice.toFixed(0)}</span>
          </div>
        </Card>

        {/* Customer details */}
        <Card className="p-4 sm:p-5 mb-5">
          <h2 className="font-bold text-lg mb-3">Delivery Details</h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cname">Name</Label>
              <Input id="cname" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cphone">Phone</Label>
              <Input
                id="cphone"
                inputMode="numeric"
                maxLength={10}
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit Indian mobile"
              />
            </div>
            <div>
              <Label htmlFor="caddr">Delivery Address</Label>
              <textarea
                id="caddr"
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Flat / House, Street, City, State, PIN"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> {userName || "—"}</p>
            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {userPhone ? `+91 ${userPhone}` : "—"}</p>
            <p className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5" /> <span>{deliveryAddress || "—"}</span></p>
          </div>
        </Card>

        {/* QR */}
        <Card className="p-4 sm:p-5 mb-5 bg-gradient-to-br from-secondary/50 to-background">
          <h2 className="font-bold text-lg mb-1 text-center">Pay with Any UPI App</h2>
          <p className="text-xs text-center text-muted-foreground mb-3">
            Scan with GPay, PhonePe, Paytm, BHIM or any UPI app
          </p>

          <div className="flex justify-center mb-3">
            <div className="bg-white p-3 rounded-xl shadow-lg border-4 border-sport-accent/20">
              <img src={paymentQr} alt="GPay UPI QR" className="w-52 h-52 object-contain" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 bg-background border border-border rounded-lg px-4 py-2 max-w-md mx-auto">
            <span className="text-xs text-muted-foreground">UPI ID:</span>
            <span className="font-mono text-sm font-semibold flex-1 truncate">{UPI_ID}</span>
            <button onClick={copyUpi} className="text-sport-accent hover:scale-110 transition-transform">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Pay exactly <span className="font-bold text-foreground">₹{totalPrice.toFixed(0)}</span> and keep the screenshot.
          </p>
        </Card>

        {/* Proof */}
        <Card className="p-4 sm:p-5 mb-5">
          <h2 className="font-bold text-lg mb-3">Submit Payment Proof</h2>

          <div className="mb-3">
            <Label htmlFor="screenshot" className="mb-2 block">Payment Screenshot</Label>
            <label
              htmlFor="screenshot"
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg" />
                  <span className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </>
              )}
              <input id="screenshot" type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          <div>
            <Label htmlFor="txn">UPI Transaction ID</Label>
            <Input
              id="txn"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 412345678901"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll find this in your UPI app payment receipt.
            </p>
          </div>
        </Card>

        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-sport-accent hover:bg-sport-accent/90 text-white text-base h-12"
        >
          {loading ? "Submitting..." : `Confirm & Place Order — ₹${totalPrice.toFixed(0)}`}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-3">
          🔒 We'll verify your payment within a few hours and confirm via WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default Payment;
