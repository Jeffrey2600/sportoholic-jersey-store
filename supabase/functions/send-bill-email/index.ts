import nodemailer from "npm:nodemailer@6.9.14";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ItemSchema = z.object({
  title: z.string().max(200),
  sku: z.string().max(100).optional().nullable(),
  size: z.string().max(20).optional().nullable(),
  quantity: z.number().int().min(1).max(99),
  basePrice: z.number().min(0),
  extraCharges: z.number().min(0),
  fullSleeve: z.boolean().optional(),
  customizedName: z.string().max(50).optional().nullable(),
  lineTotal: z.number().min(0),
});

const BodySchema = z.object({
  recipientEmail: z.string().email(),
  customerName: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  address: z.string().min(5).max(500),
  transactionId: z.string().min(4).max(50),
  items: z.array(ItemSchema).min(1).max(50),
  totalAmount: z.number().min(0),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBillHtml(data: z.infer<typeof BodySchema>): string {
  const dateStr = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  const shortId = data.transactionId.slice(-8).toUpperCase();

  const rows = data.items
    .map((it) => {
      const addons: string[] = [];
      if (it.fullSleeve) addons.push("Full Sleeve (+₹49)");
      if (it.customizedName) addons.push(`Name: ${escapeHtml(it.customizedName)} (+₹49)`);
      const addonHtml = addons.length
        ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">${addons.join(" • ")}</div>`
        : "";
      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <div style="font-weight:600;color:#0f172a;">${escapeHtml(it.title)}</div>
            ${it.sku ? `<div style="font-size:12px;color:#64748b;font-family:monospace;">SKU: ${escapeHtml(it.sku)}</div>` : ""}
            ${addonHtml}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#334155;">${it.size ? escapeHtml(it.size) : "-"}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#334155;">${it.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#0f172a;">₹${it.lineTotal.toFixed(0)}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Your Sportoholic Bill</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 28px 22px;color:#ffffff;">
          <div style="font-size:26px;font-weight:800;letter-spacing:2px;">SPORTOHOLIC</div>
          <div style="font-size:12px;opacity:0.85;margin-top:4px;letter-spacing:1px;">AUTHENTIC JERSEY STORE</div>
        </td></tr>

        <!-- Title -->
        <tr><td style="padding:22px 28px 6px;">
          <div style="font-size:20px;font-weight:700;">Order Confirmed ✓</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Thank you, ${escapeHtml(data.customerName)}. Here's your bill.</div>
        </td></tr>

        <!-- Meta -->
        <tr><td style="padding:16px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:14px 16px;">
            <tr>
              <td style="font-size:12px;color:#64748b;padding:4px 8px;">ORDER #</td>
              <td style="font-size:13px;font-weight:600;color:#0f172a;padding:4px 8px;text-align:right;font-family:monospace;">${shortId}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;padding:4px 8px;">DATE</td>
              <td style="font-size:13px;color:#0f172a;padding:4px 8px;text-align:right;">${dateStr}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;padding:4px 8px;">UPI TXN</td>
              <td style="font-size:13px;color:#0f172a;padding:4px 8px;text-align:right;font-family:monospace;">${escapeHtml(data.transactionId)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Customer -->
        <tr><td style="padding:6px 28px 16px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#64748b;margin-bottom:8px;">DELIVER TO</div>
          <div style="font-size:14px;font-weight:600;">${escapeHtml(data.customerName)}</div>
          <div style="font-size:13px;color:#334155;margin-top:2px;">+91 ${escapeHtml(data.phone)}</div>
          <div style="font-size:13px;color:#334155;margin-top:6px;line-height:1.5;">${escapeHtml(data.address)}</div>
        </td></tr>

        <!-- Items -->
        <tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid #0f172a;">
            <thead>
              <tr style="background:#f8fafc;">
                <th align="left" style="font-size:11px;letter-spacing:1px;color:#64748b;padding:10px 8px;font-weight:700;">ITEM</th>
                <th style="font-size:11px;letter-spacing:1px;color:#64748b;padding:10px 8px;font-weight:700;">SIZE</th>
                <th style="font-size:11px;letter-spacing:1px;color:#64748b;padding:10px 8px;font-weight:700;">QTY</th>
                <th align="right" style="font-size:11px;letter-spacing:1px;color:#64748b;padding:10px 8px;font-weight:700;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>

        <!-- Total -->
        <tr><td style="padding:18px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:15px;font-weight:700;color:#0f172a;">GRAND TOTAL</td>
              <td align="right" style="font-size:22px;font-weight:800;color:#1e3a8a;">₹${data.totalAmount.toFixed(0)}</td>
            </tr>
            <tr><td colspan="2" style="font-size:12px;color:#64748b;padding-top:4px;">Paid via UPI • Free shipping included</td></tr>
          </table>
        </td></tr>

        <!-- Status note -->
        <tr><td style="padding:14px 28px;">
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:12px 14px;font-size:13px;color:#065f46;">
            Your payment will be verified within a few hours. We'll ship as soon as it's confirmed.
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f172a;color:#cbd5e1;padding:22px 28px;font-size:12px;line-height:1.7;">
          <div style="color:#ffffff;font-weight:700;margin-bottom:6px;">Need help?</div>
          <div>WhatsApp Rohit: <a href="https://wa.me/919360565212" style="color:#93c5fd;text-decoration:none;">+91 93605 65212</a></div>
          <div>WhatsApp Haris: <a href="https://wa.me/919750536411" style="color:#93c5fd;text-decoration:none;">+91 97505 36411</a></div>
          <div style="margin-top:10px;"><a href="https://www.instagram.com/sportoho7ic__jersey_store" style="color:#93c5fd;text-decoration:none;">@sportoho7ic__jersey_store</a></div>
          <div style="margin-top:14px;font-size:11px;color:#64748b;">© Sportoholic. This is a computer-generated bill.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const password = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!password) {
      return new Response(JSON.stringify({ error: "GMAIL_APP_PASSWORD not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parsed.data;
    const sender = "sportoholicjersey@gmail.com";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: sender, pass: password.replace(/\s+/g, "") },
    });

    const html = buildBillHtml(data);
    const shortId = data.transactionId.slice(-8).toUpperCase();

    const info = await transporter.sendMail({
      from: `"Sportoholic Jersey" <${sender}>`,
      to: data.recipientEmail,
      subject: `Your Sportoholic Bill • Order #${shortId} • ₹${data.totalAmount.toFixed(0)}`,
      html,
      text: `Thanks for your order, ${data.customerName}! Order #${shortId}, total ₹${data.totalAmount.toFixed(0)}. We'll verify your payment shortly.`,
      replyTo: sender,
    });

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-bill-email error:", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
