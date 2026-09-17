import Link from 'next/link';

const categories = [
  { name: 'HOT DEALS', color: 'sunset' },
  { name: 'CHICKEN BUCKETS', color: 'ember' },
  { name: 'HOT LAUNCHES', color: 'gold' },
  { name: 'BOX MEALS', color: 'crimson' },
  { name: 'BURGERS', color: 'sand' },
  { name: 'BIRIYANI BUCKETS', color: 'chili' },
  { name: 'SNACKS', color: 'steel' },
  { name: 'VIEW ALL MENU', color: 'charcoal' },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-banner">
        <div className="hero-copy">
          <p className="eyebrow">Let&apos;s order for delivery, pickup, or dine-in</p>
          <h1>Fresh, hot, and made to satisfy every craving.</h1>
          <p className="lead">
            A classic KFC-inspired ordering experience with guest login, account signup, and quick checkout flow.
          </p>
          <div className="cta-row">
            <Link href="/menu" className="primary-btn large">Start Order</Link>
            <Link href="/login" className="secondary-btn large">Login</Link>
          </div>
        </div>

        <div className="promo-visual" aria-label="KFC promotional image area">
          <div className="promo-card promo-card-top" />
          <div className="promo-card promo-card-bottom" />
        </div>
      </section>

      <section className="category-grid">
        {categories.map((item) => (
          <article key={item.name} className={`category-card ${item.color}`}>
            <div className="card-image" />
            <h3>{item.name}</h3>
          </article>
        ))}
      </section>

      <section className="deal-banner">
        <div>
          <span className="deal-tag">Exclusive deals</span>
          <h2>Big flavor. Bigger value.</h2>
        </div>
        <Link href="/deals" className="primary-btn">View All Deals</Link>
      </section>

      <section className="feature-grid">
        <div className="feature-box">
          <h3>Fast checkout</h3>
          <p>Responsive ordering for desktop and mobile users, with a smooth login and cart flow.</p>
        </div>
        <div className="feature-box">
          <h3>Account access</h3>
          <p>Login and signup follow the legacy KFC patterns and connect to the users microservice.</p>
        </div>
        <div className="feature-box">
          <h3>Cloud-ready</h3>
          <p>Built for static hosting and CDN delivery through Cloudflare Pages.</p>
        </div>
      </section>
    </main>
  );
}
