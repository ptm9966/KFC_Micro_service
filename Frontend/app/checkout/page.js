import Link from 'next/link';

export default function CheckoutPage() {
  return (
    <main className="page-shell">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-grid">
        <div className="form-card">
          <h3>Delivery Information</h3>
          <div className="form-grid">
            <div className="form-row">
              <input className="field" placeholder="First name" />
              <input className="field" placeholder="Last name" />
            </div>
            <input className="text-input" placeholder="Street address" />
            <input className="text-input" placeholder="City" />
            <input className="text-input" placeholder="Phone number" />
          </div>
        </div>

        <aside className="panel">
          <h3>Payment</h3>
          <div className="sum-row"><span>Items</span><span>$22.46</span></div>
          <div className="sum-row"><span>Delivery</span><span>$1.99</span></div>
          <div className="total-row"><span>Total</span><span>$26.53</span></div>
          <Link href="/payment" className="primary-btn" style={{ marginTop: 20, width: '100%' }}>Continue to Payment</Link>
        </aside>
      </div>
    </main>
  );
}
