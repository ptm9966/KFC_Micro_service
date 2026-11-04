'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const CART_API_BASE_URL = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8080';

function getAuthHeaders() {
  const token = localStorage.getItem('id_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${CART_API_BASE_URL}/api/cart`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Unable to load cart from backend');
        }

        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Cart fetch failed:', err);
        setError('Unable to load your cart right now.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
    const delivery = items.length ? 1.99 : 0;
    const taxes = subtotal * 0.18;
    const total = subtotal + delivery + taxes;

    return { subtotal, delivery, taxes, total };
  }, [items]);

  return (
    <main className="page-shell">
      <h1 className="page-title">Your Cart</h1>

      {loading && <p className="page-subtitle">Loading cart...</p>}
      {!loading && error && <p className="page-subtitle" style={{ color: '#b80020' }}>{error}</p>}

      {!loading && !error && (
        <div className="cart-layout">
          <div className="panel">
            {items.length === 0 ? (
              <div className="auth-card">
                <h3>Your cart is empty</h3>
                <p className="page-subtitle">Add items from the menu to begin your order.</p>
                <Link href="/menu" className="primary-btn">Browse Menu</Link>
              </div>
            ) : (
              <div className="card-list">
                {items.map((item) => (
                  <div key={item._id || item.productId || item.title} className="cart-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=400&q=80'}
                        alt={item.title || item.name || 'Cart item'}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <div>
                        <strong>{item.title || item.name}</strong>
                        <div className="muted">Qty: {item.qty || 1}</div>
                      </div>
                    </div>
                    <strong>${Number(item.price || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="panel">
            <h3>Order Summary</h3>
            <div className="sum-row"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
            <div className="sum-row"><span>Delivery</span><span>${totals.delivery.toFixed(2)}</span></div>
            <div className="sum-row"><span>Taxes</span><span>${totals.taxes.toFixed(2)}</span></div>
            <div className="total-row"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
            <Link href="/checkout" className="primary-btn" style={{ marginTop: 20, width: '100%' }}>Checkout</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
