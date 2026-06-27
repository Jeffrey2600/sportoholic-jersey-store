# Automated Bill Email via Gmail SMTP

Send a branded HTML bill to the customer automatically after they place an order. Sender: `sportoholicjersey@gmail.com`. Zero cost. No customer action required.

## What the customer experiences

1. Customer completes payment on the Payment page and clicks "Confirm & Place Order".
2. Order saves to the database (already working today).
3. A bill email is automatically sent to their account email within ~2 seconds.
4. The Payment page then routes to a new "Order Success" screen that also shows the same bill on-screen (no action needed — just a nice confirmation). No download button, per your preference.

## What you need to do (one-time, 2 minutes)

Gmail blocks regular passwords for SMTP. We need a **16-character App Password** from the Gmail account itself.

1. Sign in to `sportoholicjersey@gmail.com`.
2. Enable 2-Step Verification at https://myaccount.google.com/security (required by Google before App Passwords work).
3. Open https://myaccount.google.com/apppasswords → create one named "Sportoholic" → copy the 16-character password.
4. Paste it into the secure form Lovable will open (I'll trigger it). The password is stored encrypted as `GMAIL_APP_PASSWORD` and never appears in code.

## Honest limitations of Gmail SMTP (so you know what to expect)

- **Daily limit:** ~500 emails/day. Fine for early-stage; will need upgrade later.
- **Spam risk:** Roughly 10–20% of first-time recipients may see it in Spam/Promotions. Once a customer marks it "Not spam" or replies, future emails land in Inbox.
- **Sender label:** Inbox will show "Sportoholic Jersey <sportoholicjersey@gmail.com>" — looks legit, but not as branded as a custom domain.
- **No delivery analytics:** Gmail SMTP doesn't tell us if a mail bounced. We only know it was accepted by Gmail's outbound server.

If volume grows or spam becomes an issue, we can switch to a custom domain later — the bill template and trigger code stay the same.

## Technical Details

### 1. Secret
- Add `GMAIL_APP_PASSWORD` via the secrets tool (secure form for you).
- Sender email is hardcoded as `sportoholicjersey@gmail.com` in the edge function.

### 2. New Edge Function: `send-bill-email`
Location: `supabase/functions/send-bill-email/index.ts`

- Uses Deno's `nodemailer` (`npm:nodemailer@6`) over Gmail SMTP (`smtp.gmail.com:465`, SSL).
- Auth: `sportoholicjersey@gmail.com` + `GMAIL_APP_PASSWORD`.
- Validates input with Zod: `recipientEmail`, `customerName`, `phone`, `address`, `transactionId`, `items[]`, `totalAmount`.
- Renders an inline HTML bill (no external CSS — required for email clients):
  - Header: **SPORTOHOLIC** wordmark on a dark gradient band + tagline "Authentic Jersey Store".
  - Order meta: Order ID (short), Date, Transaction ID.
  - Customer block: Name, Phone, Delivery Address.
  - Itemized table: Product, Size, Qty, Add-ons (Full Sleeve / Name Print), Line Total.
  - Totals: Subtotal, Add-on charges, **Grand Total** highlighted.
  - Footer: "Pay verified within a few hours • Questions? WhatsApp Rohit 9360565212 / Haris 9750536411" + Instagram link.
- CORS headers included for browser invocation.
- Returns `{ success: true, messageId }` or 4xx/5xx with error details.

### 3. Trigger from `Payment.tsx`
After the existing `orders.insert(...)` succeeds and before navigation:
- Call `supabase.functions.invoke('send-bill-email', { body: { ... } })` (best-effort — wrapped in try/catch so an email hiccup never blocks order placement).
- Pass the same data already collected: items, totals, customer details, transaction ID.
- Toast: "Order placed! Bill emailed to <email>".

### 4. New Page: `OrderSuccess.tsx` (route: `/order-success`)
After successful submission, navigate here with order data in route state instead of going straight to `/profile`.

- Renders the same elegant HTML bill on-screen (shared React component `BillTemplate.tsx`).
- Shows "✓ Bill sent to your email" badge.
- Two buttons: "Share on WhatsApp" (pre-filled text summary) and "Continue Shopping".
- No download button (per your request).

### 5. Shared component: `src/components/BillTemplate.tsx`
Same visual structure as the email HTML so what the customer sees on-screen matches their inbox. Used by `OrderSuccess.tsx`.

### 6. Files touched

```text
NEW  supabase/functions/send-bill-email/index.ts
NEW  src/components/BillTemplate.tsx
NEW  src/pages/OrderSuccess.tsx
EDIT src/pages/Payment.tsx          # invoke function + navigate to /order-success
EDIT src/App.tsx                    # register /order-success route
SECRET GMAIL_APP_PASSWORD           # added via secure form
```

### 7. Verification after build
- Place a test order with a real email I can't see — you check inbox + spam.
- Check edge function logs for SMTP success.
- Confirm bill renders cleanly in Gmail (mobile + desktop).
