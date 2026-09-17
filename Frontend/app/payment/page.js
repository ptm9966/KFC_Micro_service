import Link from 'next/link';

export default function PaymentPage() {
  return (
    <main className="page-shell">
      <h1 className="page-title">Payment</h1>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="form-grid">
            <input className="text-input" placeholder="Cardholder name" />
            <input className="text-input" placeholder="Card number" />
            <div className="form-row">
              <input className="field" placeholder="MM/YY" />
              <input className="field" placeholder="CVV" />
            </div>
            <Link href="/confirmation" className="primary-btn" style={{ width: '100%' }}>Pay Now</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
