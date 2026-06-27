import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import BillTemplate, { BillData } from "@/components/BillTemplate";
import { CheckCircle2, MessageCircle, ShoppingBag, MailCheck } from "lucide-react";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bill = (location.state as { bill?: BillData })?.bill;

  useEffect(() => {
    if (!bill) navigate("/", { replace: true });
  }, [bill, navigate]);

  if (!bill) return null;

  const waText = encodeURIComponent(
    `Hi Sportoholic! I just placed an order.\n\n` +
      `Name: ${bill.customerName}\nPhone: +91 ${bill.phone}\n` +
      `UPI Txn: ${bill.transactionId}\nTotal: ₹${bill.totalAmount.toFixed(0)}\n\n` +
      bill.items
        .map(
          (i) =>
            `• ${i.title}${i.size ? ` (${i.size})` : ""} × ${i.quantity} — ₹${i.lineTotal.toFixed(0)}`
        )
        .join("\n")
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-3">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Order Placed!</h1>
          <p className="text-slate-600 mt-1">
            We've emailed your bill to{" "}
            <span className="font-semibold">{bill.recipientEmail}</span>
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <MailCheck className="h-3.5 w-3.5" /> Bill sent to your inbox
          </div>
        </div>

        <BillTemplate data={bill} />

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <a
            href={`https://wa.me/919360565212?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11">
              <MessageCircle className="mr-2 h-4 w-4" /> Share on WhatsApp
            </Button>
          </a>
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full h-11">
              <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Didn't see the email? Check your Promotions or Spam folder.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
