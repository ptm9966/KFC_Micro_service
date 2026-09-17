'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function readUserFromStorage() {
  try {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
}

function readCartCount() {
  try {
    return Number(localStorage.getItem('cartCount') || '0');
  } catch (error) {
    return 0;
  }
}

export default function SiteShell({ children }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const syncUser = () => setUser(readUserFromStorage());
    const syncCartCount = () => setCartCount(readCartCount());

    syncUser();
    syncCartCount();

    const handleSessionChange = () => syncUser();
    const handleCartChange = () => syncCartCount();

    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('storage', handleCartChange);
    window.addEventListener('user-session-change', handleSessionChange);
    window.addEventListener('cart-count-change', handleCartChange);

    return () => {
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('storage', handleCartChange);
      window.removeEventListener('user-session-change', handleSessionChange);
      window.removeEventListener('cart-count-change', handleCartChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('user-session-change'));
  };

  const profileName = user?.name || user?.email || 'Profile';

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <span className="brand-mark">K</span>
            <span>King of Good Food</span>
          </div>

          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/menu">Menu</Link>
            <Link href="/deals">Deals</Link>
            <Link href="/cart">Cart ({cartCount})</Link>
            {!user && <Link href="/login">Login</Link>}
            {!user && <Link href="/signup">Signup</Link>}
          </nav>

          <div className="top-actions">
            {user ? (
              <>
                <Link href="/account" className="ghost-btn">Hi, {profileName}</Link>
                <button type="button" className="secondary-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="ghost-btn">Login</Link>
                <Link href="/menu" className="primary-btn">Order Now</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong>King of Good Food</strong>
            <div className="muted">Fast, fresh, and made for every craving.</div>
          </div>
          <div>Contact us • Support • Privacy</div>
          <div>© 2026 KFC-inspired storefront</div>
        </div>
      </footer>
    </div>
  );
}
