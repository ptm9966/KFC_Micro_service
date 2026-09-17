'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_PRODUCTS_API_URL || 'http://localhost:8083';
const CART_API_BASE_URL = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8080';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=900&q=80';

function getSafeImageUrl(rawImage) {
  if (!rawImage) return FALLBACK_IMAGE;

  const trimmed = String(rawImage).trim();
  if (!trimmed || trimmed.includes('test_imaged')) return FALLBACK_IMAGE;

  return trimmed;
}

function updateCartCount(nextCount) {
  const normalized = Number(nextCount) || 0;
  localStorage.setItem('cartCount', String(normalized));
  window.dispatchEvent(new Event('cart-count-change'));
}

export default function MenuPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/product`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status}`);
        }

        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Menu fetch error:', err);
        setError('Unable to load menu right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (item) => {
    try {
      setAddingId(item._id || item.title);

      const payload = {
        _id: item._id || item.productId || item.title,
        productId: item._id || item.productId || item.title,
        title: item.title || item.name,
        name: item.title || item.name,
        image: getSafeImageUrl(item.image),
        desc: item.description || item.desc || 'Freshly prepared KFC item.',
        description: item.description || item.desc || 'Freshly prepared KFC item.',
        price: Number(item.price || 0),
        qty: 1,
      };

      const response = await fetch(`${CART_API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.err || 'Unable to add item to cart');
      }

      const currentCount = Number(localStorage.getItem('cartCount') || '0');
      updateCartCount(currentCount + 1);
      router.push('/cart');
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert(err.message || 'Unable to add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main className="page-shell">
      <h1 className="page-title">Our Menu</h1>
      <p className="page-subtitle">Freshly loaded from the product service.</p>

      {loading && <p className="page-subtitle">Loading menu...</p>}
      {error && <p className="page-subtitle" style={{ color: '#b80020' }}>{error}</p>}

      {!loading && !error && (
        <div className="menu-grid">
          {items.map((item) => (
            <article key={item._id || item.title} className="menu-item">
              <img
                src={getSafeImageUrl(item.image)}
                alt={item.title || item.name || 'KFC item'}
                style={{ width: '100%', height: '170px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="menu-copy">
                <h3>{item.title || item.name}</h3>
                <p>{item.description || item.desc || 'Freshly prepared with signature KFC flavour.'}</p>
                <div className="price-row">
                  <span className="price-tag">${Number(item.price || 0).toFixed(2)}</span>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => handleAddToCart(item)}
                    disabled={addingId === (item._id || item.title)}
                  >
                    {addingId === (item._id || item.title) ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
