import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Copy, ShieldCheck, Upload, Check, MapPin, Phone, User as UserIcon } from "lucide-react";
import paymentQr from "@/assets/payment-qr.png";
import { z } from "zod";

const UPI_ID = "balarohithpoco07-2@okicici";

const paymentSchema = z.object({
  transactionId: z
    .string()
    .trim()
    .min(8, "Transaction ID must be at least 8 characters")
    .max(50, "Transaction ID is too long")
    .regex(/^[A-Za-z0-9]+$/, "Only letters and numbers are allowed"),
});

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state as any;

  const [user, setUser] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) navigate("/auth");
    });
    if (!order?.product) {
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
      const { transactionId: validTxn } = paymentSchema.parse({ transactionId: transactionId.trim() });

      // Upload screenshot
      const ext = screenshot.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, screenshot, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("payment-screenshots").getPublicUrl(path);

      // Create order
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user.id,
        product_id: order.product.id,
        quantity: order.quantity,
        total_price: order.totalPrice,
        user_email: user.email,
        user_name: order.userName,
        user_phone: order.userPhone,
        delivery_address: order.deliveryAddress,
        product_sku: order.product.sku,
        selected_size: order.selectedSize || null,
        transaction_id: validTxn,
        payment_screenshot_url: pub.publicUrl,
        status: "pending",
      });
      if (orderError) throw orderError;

      // Update stock
      await supabase
        .from("products")
        .update({ stock_quantity: order.product.stock_quantity - order.quantity })
        .eq("id", order.product.id);

      // Notify
      await supabase.functions.invoke("send-order-email", {
        body: {
          orderDetails: {
            productTitle: order.product.title,
            quantity: order.quantity,
            totalPrice: order.totalPrice,
            userName: order.userName,
            userEmail: user.email,
            userPhone: order.userPhone,
            deliveryAddress: order.deliveryAddress,
            transactionId: validTxn,
            paymentScreenshotUrl: pub.publicUrl,
          },
        },
      });

      toast.success("Order placed! We'll verify your payment shortly.");
      navigate("/profile");
    } catch (err: any) {
      if (err instanceof z.ZodError) toast.error(err.errors[0].message);
      else toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!order?.product) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Review your order, scan the QR to pay, then submit your payment proof.
        </p>

        {/* Order Summary */}
        <Card className="p-5 mb-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sport-accent" /> Order Summary
          </h2>
          <div className="flex gap-4">
            {order.product.image_url && (
              <img
                src={order.product.image_url}
                alt={order.product.title}
                className="w-24 h-24 rounded-lg object-cover bg-secondary"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{order.product.title}</h3>
              {order.product.sku && (
                <p className="text-xs text-muted-foreground font-mono">SKU: {order.product.sku}</p>
              )}
              {order.selectedSize && (
                <p className="text-sm mt-1">Size: <span className="font-medium">{order.selectedSize}</span></p>
              )}
              <p className="text-sm">Quantity: <span className="font-medium">{order.quantity}</span></p>
              <p className="text-sm">Unit price: ₹{order.product.price.toFixed(0)}</p>
            </div>
          </div>

          <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> {order.userName}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> +91 {order.userPhone}</p>
            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /> <span>{order.deliveryAddress}</span></p>
          </div>

          <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
            <span className="text-base font-medium">Amount to Pay</span>
            <span className="text-2xl font-bold text-sport-accent">₹{order.totalPrice.toFixed(0)}</span>
          </div>
        </Card>

        {/* QR Section */}
        <Card className="p-5 mb-6 bg-gradient-to-br from-secondary/50 to-background">
          <h2 className="font-bold text-lg mb-2 text-center">Pay with Any UPI App</h2>
          <p className="text-xs text-center text-muted-foreground mb-4">
            Scan with GPay, PhonePe, Paytm, BHIM or any UPI app
          </p>

          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl shadow-lg border-4 border-sport-accent/20">
              <img src={paymentQr} alt="GPay UPI QR" className="w-56 h-56 object-contain" />
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
            Pay exactly <span className="font-bold text-foreground">₹{order.totalPrice.toFixed(0)}</span> and keep the screenshot.
          </p>
        </Card>

        {/* Proof of Payment */}
        <Card className="p-5 mb-6">
          <h2 className="font-bold text-lg mb-4">Submit Payment Proof</h2>

          <div className="mb-4">
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
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="mb-2">
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
          {loading ? "Submitting..." : `Confirm & Place Order — ₹${order.totalPrice.toFixed(0)}`}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          🔒 We'll verify your payment within a few hours and confirm your order via WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default Payment;
