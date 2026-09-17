import Link from 'next/link';

export default function ConfirmationPage() {
  return (
    <main className="page-shell">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="page-title" style={{ marginBottom: 12 }}>Order Confirmed</h1>
          <p className="page-subtitle">Your order has been placed successfully.</p>
          <div className="order-card">
            <div className="table-row"><span>Order Number</span><strong>#KFC-2048</strong></div>
            <div className="table-row"><span>Status</span><strong>Preparing</strong></div>
            <div className="table-row"><span>ETA</span><strong>25-30 mins</strong></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href="/" className="primary-btn">Back to Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
