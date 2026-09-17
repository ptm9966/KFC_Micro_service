export default function DealsPage() {
  return (
    <main className="page-shell">
      <h1 className="page-title">Deals & Offers</h1>
      <p className="page-subtitle">Fresh promotions for your next meal.</p>

      <div className="feature-grid">
        <div className="feature-box">
          <h3>Family Combo</h3>
          <p>Save up to 30% on buckets, fries, and drinks for up to 4 people.</p>
        </div>
        <div className="feature-box">
          <h3>Midnight Treat</h3>
          <p>Late-night value meal with crispy chicken and sides at a special price.</p>
        </div>
        <div className="feature-box">
          <h3>Lunch Rush</h3>
          <p>Limited-time offer for lunch combos served between 12:00 PM and 3:00 PM.</p>
        </div>
      </div>
    </main>
  );
}
