import Link from 'next/link';
import MenuClient from './menu/MenuClient';
import { getMenuCategories, getMenuItems } from '../lib/contentful';

const categories = [
  'sunset', 'ember', 'gold', 'crimson', 'sand', 'chili', 'steel', 'charcoal',
];

export default async function HomePage() {
  let menuItems = [];
  let menuCategories = [];

  try {
    [menuItems, menuCategories] = await Promise.all([getMenuItems(), getMenuCategories()]);
  } catch (error) {
    console.error('Home menu fetch error:', error);
  }

  return (
    <main className="page-shell">
      <section className="hero-banner">
        <div className="rewards-icon" aria-hidden="true">★</div>
        <div className="hero-copy">
          <p className="eyebrow">Make every order count</p>
          <h1>Join KFC rewards</h1>
          <p className="lead">
            Earn points on every order and get more insider offers, exclusive deals, and delicious rewards.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/login" className="primary-btn large">Join Now</Link>
          <span>Already a member? <Link href="/login" className="inline-link">Sign in</Link></span>
        </div>
      </section>

      <section className="category-grid">
        {menuCategories.map((category, index) => {
          const categoryItem = menuItems.find(
            (item) => item.categoryId === category._id && item.image,
          );
          const categoryItems = menuItems.filter((item) => item.categoryId === category._id);
          const color = categories[index % categories.length];

          return (
          <article
            key={category._id}
            className={`category-card ${color}`}
          >
            <Link className="category-card-link" href={`/menu?category=${encodeURIComponent(category._id)}`}>
              <div
                className="card-image"
                style={categoryItem?.image ? {
                  backgroundImage: `url("${categoryItem.image}"), linear-gradient(135deg, #ffd7ad, #d83f37, #6d1818)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : undefined}
              />
              <div className="category-card-copy">
                <h3>{category.name}</h3>
                <span>{categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}</span>
                <p>Fresh favourites and signature choices for every craving.</p>
              </div>
            </Link>
          </article>
          );
        })}
        <article className={`category-card ${categories[categories.length - 1]}`}>
          <Link className="category-card-link" href="/menu">
            <div className="card-image" />
            <div className="category-card-copy">
              <h3>View All Menu</h3>
              <span>{menuItems.length} items</span>
              <p>Explore the complete menu and find your next favourite.</p>
            </div>
          </Link>
        </article>
      </section>

      <section className="home-menu-section">
        <div className="section-heading">
          <div>
            <span className="deal-tag">From our kitchen</span>
            <h2>Featured menu</h2>
          </div>
          <Link href="/menu" className="secondary-btn">View full menu</Link>
        </div>
        {menuItems.length > 0 ? (
          <MenuClient items={menuItems.slice(0, 6)} />
        ) : (
          <p className="page-subtitle">Menu items are temporarily unavailable.</p>
        )}
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
