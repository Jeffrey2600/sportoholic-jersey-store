## Add ₹49 price to Customized Name button

### What
Treat customized name printing as a paid add-on (₹49), same as full sleeve. Show the price on the toggle button, charge it at checkout, and display it clearly in cart, payment summary, and admin order panel.

### Files to change
- `src/pages/ProductDetail.tsx`
  - Add `CUSTOM_NAME_EXTRA = 49` constant.
  - Customized name button label: show `+₹49` when not selected, and include the charge in the active state text.
  - `extraCharges` passed to cart/payment = full-sleeve extra + customized-name extra (so both can be selected together).
- `src/contexts/CartContext.tsx`
  - No structural changes needed; `extraCharges` stays a single total add-on field.
- `src/pages/Cart.tsx`
  - Show customized name charge separately (e.g. `Name print (+₹49)`) alongside the full-sleeve line.
- `src/pages/Payment.tsx`
  - Show customized name charge separately in the order summary line items.
- `src/pages/OrderDetail.tsx`
  - Split the "Extra Charges" display into two lines: "Full Sleeve" and "Customized Name", each with its own ₹49 value when applicable. Keep total amount unchanged.

### Technical note
The `orders` table only stores one `extra_charges` total. We derive the two line-item charges from the existing `full_sleeve` and `customized_name` booleans/fields at display time (each known to be ₹49 when present).