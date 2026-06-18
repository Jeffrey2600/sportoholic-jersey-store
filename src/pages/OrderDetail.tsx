import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Package,
  Hash,
  Ruler,
  Calendar,
  CreditCard,
  ExternalLink,
} from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast.error("Access denied. Admin only.");
        navigate("/");
        return;
      }
      setIsAdmin(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, image_url, price)")
        .eq("id", id!)
        .maybeSingle();

      if (error || !data) {
        toast.error("Order not found");
        navigate("/admin");
        return;
      }
      setOrder(data);
      setLoading(false);
    };
    init();
  }, [id]);

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id!);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOrder({ ...order, status });
    toast.success("Order status updated!");
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  const statusColor =
    order.status === "pending"
      ? "bg-yellow-500/20 text-yellow-700"
      : order.status === "completed"
      ? "bg-green-500/20 text-green-700"
      : "bg-red-500/20 text-red-700";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Details</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">#{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColor}`}>
              {order.status}
            </span>
            <Select value={order.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5" /> Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.user_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${order.user_email}`} className="text-sport-accent hover:underline break-all">
                  {order.user_email}
                </a>
              </div>
              {order.user_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:+91${order.user_phone}`} className="text-sport-accent hover:underline">
                    +91 {order.user_phone}
                  </a>
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="whitespace-pre-wrap">{order.delivery_address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Product */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" /> Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                {order.products?.image_url && (
                  <img
                    src={order.products.image_url}
                    alt={order.products?.title}
                    className="w-20 h-20 rounded-md object-cover bg-secondary"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{order.products?.title}</p>
                  {order.product_sku && (
                    <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-1">
                      <Hash className="h-3 w-3" /> SKU: {order.product_sku}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="font-medium flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" /> {order.selected_size || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Sleeve</p>
                  <p className={`font-medium ${order.full_sleeve ? "text-sport-accent" : ""}`}>
                    {order.full_sleeve ? "Yes (+₹49)" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Name Print</p>
                  <p className={`font-medium ${order.customized_name ? "text-violet-700" : ""}`}>
                    {order.customized_name ? "Yes (+₹49)" : "No"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Total Extra Charges</p>
                  <p className="font-medium">₹{Number(order.extra_charges || 0).toFixed(0)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Customized Name (printed on jersey)</p>
                  <p className={`font-bold ${order.customized_name ? "text-violet-700 text-lg tracking-wide" : "text-muted-foreground"}`}>
                    {order.customized_name || "— None —"}
                  </p>
                </div>

              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-sport-accent">₹{order.total_price}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment proof */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">UPI Transaction ID</p>
              <p className="font-mono font-medium">{order.transaction_id || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
              {order.payment_screenshot_url ? (
                <div className="space-y-2">
                  <a
                    href={order.payment_screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sport-accent hover:underline text-xs"
                  >
                    Open full image <ExternalLink className="h-3 w-3" />
                  </a>
                  <a href={order.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={order.payment_screenshot_url}
                      alt="Payment Screenshot"
                      className="max-w-xs rounded-lg border border-border hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">No screenshot uploaded</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetail;
