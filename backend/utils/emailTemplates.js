function wrapHtml(title, bodyHtml) {
  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:0;">
    <div style="max-width:680px;margin:24px auto;padding:20px;border:1px solid #e6edf3;border-radius:8px;background:#fff;">
      <header style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div style="width:48px;height:48px;background:#2563eb;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700">EC</div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#0f172a">ElectroCart</div>
          <div style="font-size:12px;color:#64748b">Your friendly e-commerce store</div>
        </div>
      </header>
      <main>
        ${bodyHtml}
      </main>
      <footer style="margin-top:20px;font-size:12px;color:#94a3b8">
        <div>Need help? Reply to this email or visit our <a href="${process.env.CLIENT_URL || ''}/contact">Contact page</a>.</div>
      </footer>
    </div>
  </body>
  </html>`;
}

function orderPlacedHtml({ order, clientUrl }) {
  const orderId = order.id || order._id || '';
  // Support both order.items and order.orderItems
  const items = order.items || order.orderItems || [];
  const itemsHtml = items.map(it => `<li>${(it.name || it.product?.name || '')} — Qty: ${it.quantity || 1} — Rs ${it.price || ''}</li>`).join('');
  const viewUrl = (clientUrl || '') + '/orders';
  const html = `
    <h2 style="margin-top:0;color:#0f172a">Thanks — your order is confirmed</h2>
    <p>We've received your order <strong>${orderId}</strong>. We'll notify you when it ships.</p>
    <h4 style="margin-bottom:6px">Order summary</h4>
    <ul style="padding-left:18px">${itemsHtml}</ul>
    <p><strong>Total:</strong> Rs ${order.totalPrice || order.total || 0}</p>
    <p><strong>Shipping Address:</strong><br/>${(order.shippingAddress?.fullName || order.shippingAddress?.name || '')}<br/>${(order.shippingAddress?.line1 || order.shippingAddress?.address || '')}<br/>${(order.shippingAddress?.city || '')}${order.shippingAddress?.city && order.shippingAddress?.country ? ', ' : ''}${order.shippingAddress?.country || ''}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod || 'COD'}</p>
    <p style="margin-top:18px"><a href="${viewUrl}" style="display:inline-block;background:#2563eb;color:white;padding:10px 14px;border-radius:6px;text-decoration:none">View your orders</a></p>
  `;
  return wrapHtml('Order confirmation — ElectroCart', html);
}

function orderStatusHtml({ order, clientUrl }) {
  const orderId = order.id || order._id || '';
  const state = order.status || order.deliveryStatus || 'updated';
  const viewUrl = (clientUrl || '') + '/orders';
  const html = `
    <h2 style="margin-top:0;color:#0f172a">Update on your order ${orderId}</h2>
    <p>The status for your order <strong>${orderId}</strong> has changed to <strong>${state}</strong>.</p>
    <p>If you want to track delivery, click below:</p>
    <p><a href="${viewUrl}" style="display:inline-block;background:#10b981;color:white;padding:10px 14px;border-radius:6px;text-decoration:none">Track order</a></p>
  `;
  return wrapHtml(`Order update — ${orderId}`, html);
}

module.exports = { orderPlacedHtml, orderStatusHtml, wrapHtml };
