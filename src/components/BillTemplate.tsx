import { Instagram, Phone } from "lucide-react";

export interface BillItem {
  title: string;
  sku?: string | null;
  size?: string | null;
  quantity: number;
  basePrice: number;
  extraCharges: number;
  fullSleeve?: boolean;
  customizedName?: string | null;
  lineTotal: number;
}

export interface BillData {
  customerName: string;
  recipientEmail: string;
  phone: string;
  address: string;
  transactionId: string;
  items: BillItem[];
  totalAmount: number;
}

const BillTemplate = ({ data }: { data: BillData }) => {
  const dateStr = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  const shortId = data.transactionId.slice(-8).toUpperCase();

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl max-w-2xl mx-auto border border-slate-200">
      {/* Header */}
      <div
        className="px-7 py-6 text-white"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)" }}
      >
        <div className="text-2xl font-extrabold tracking-[0.18em]">SPORTOHOLIC</div>
        <div className="text-[11px] opacity-80 mt-1 tracking-[0.15em]">
          AUTHENTIC JERSEY STORE
        </div>
      </div>

      <div className="px-7 pt-5">
        <h2 className="text-xl font-bold text-slate-900">Order Confirmed ✓</h2>
        <p className="text-sm text-slate-500 mt-1">
          Thank you, {data.customerName}. Here's your bill.
        </p>
      </div>

      {/* Meta */}
      <div className="px-7 pt-4">
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-xs uppercase tracking-wider text-slate-500">Order #</span>
            <span className="font-mono font-semibold text-slate-900">{shortId}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs uppercase tracking-wider text-slate-500">Date</span>
            <span className="text-slate-800">{dateStr}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs uppercase tracking-wider text-slate-500">UPI Txn</span>
            <span className="font-mono text-slate-800 truncate ml-2">{data.transactionId}</span>
          </div>
        </div>
      </div>

      {/* Deliver to */}
      <div className="px-7 pt-4">
        <div className="text-[11px] font-bold tracking-[0.15em] text-slate-500 mb-2">
          DELIVER TO
        </div>
        <div className="font-semibold text-slate-900">{data.customerName}</div>
        <div className="text-sm text-slate-700">+91 {data.phone}</div>
        <div className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-line">
          {data.address}
        </div>
      </div>

      {/* Items */}
      <div className="px-7 pt-5">
        <div className="border-t-2 border-slate-900">
          <div className="grid grid-cols-12 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold py-2 px-2">
            <div className="col-span-7">Item</div>
            <div className="col-span-2 text-center">Size</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {data.items.map((it, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-start py-3 px-2 border-b border-slate-100 text-sm"
            >
              <div className="col-span-7">
                <div className="font-semibold text-slate-900">{it.title}</div>
                {it.sku && (
                  <div className="font-mono text-xs text-slate-500">SKU: {it.sku}</div>
                )}
                {(it.fullSleeve || it.customizedName) && (
                  <div className="text-xs text-slate-500 mt-1">
                    {it.fullSleeve && <span>Full Sleeve (+₹49)</span>}
                    {it.fullSleeve && it.customizedName && <span> • </span>}
                    {it.customizedName && <span>Name: {it.customizedName} (+₹49)</span>}
                  </div>
                )}
              </div>
              <div className="col-span-2 text-center text-slate-700">{it.size || "-"}</div>
              <div className="col-span-1 text-center text-slate-700">{it.quantity}</div>
              <div className="col-span-2 text-right font-semibold text-slate-900">
                ₹{it.lineTotal.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-7 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">GRAND TOTAL</span>
          <span className="text-2xl font-extrabold text-blue-900">
            ₹{data.totalAmount.toFixed(0)}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Paid via UPI • Free shipping included</p>
      </div>

      <div className="px-7 pt-4 pb-5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          Your payment will be verified within a few hours. We'll ship as soon as it's confirmed.
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-slate-300 px-7 py-5 text-xs leading-relaxed">
        <div className="text-white font-bold mb-2">Need help?</div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" />
          <a href="https://wa.me/919360565212" className="text-sky-300">
            Rohit: +91 93605 65212
          </a>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Phone className="h-3.5 w-3.5" />
          <a href="https://wa.me/919750536411" className="text-sky-300">
            Haris: +91 97505 36411
          </a>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Instagram className="h-3.5 w-3.5" />
          <a
            href="https://www.instagram.com/sportoho7ic__jersey_store"
            className="text-sky-300"
          >
            @sportoho7ic__jersey_store
          </a>
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          © Sportoholic. This is a computer-generated bill.
        </div>
      </div>
    </div>
  );
};

export default BillTemplate;
