'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

function getAuthHeaders() {
  const token = localStorage.getItem('id_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MenuClient({ items }) {
  const router = useRouter();
  const [addingId, setAddingId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    const categoryId = new URLSearchParams(window.location.search).get('category') || '';
    setSelectedCategoryId(categoryId);
  }, []);

  const visibleItems = selectedCategoryId
    ? items.filter((item) => item.categoryId === selectedCategoryId)
    : items;

  const handleAddToCart = async (item) => {
    try {
      const itemId = item._id || item.title;
      setAddingId(itemId);
      const description = item.description || item.desc || 'Freshly prepared KFC item.';
      const payload = {
        _id: itemId,
        productId: itemId,
        title: item.title || item.name,
        name: item.title || item.name,
        image: getSafeImageUrl(item.image),
        desc: description,
        description,
        price: Number(item.price || 0),
        qty: 1,
      };

      const response = await fetch(`${CART_API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.err || 'Unable to add item to cart');

      updateCartCount(Number(localStorage.getItem('cartCount') || '0') + 1);
      router.push('/cart');
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert(err.message || 'Unable to add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="menu-grid">
      {visibleItems.length === 0 && <p className="page-subtitle">No items are available in this category.</p>}
      {visibleItems.map((item) => {
        const itemId = item._id || item.title;
        return (
          <article key={itemId} className="menu-item">
            <img
              src={getSafeImageUrl(item.image)}
              alt={item.title || item.name || 'KFC item'}
              style={{ width: '100%', height: '170px', objectFit: 'cover', display: 'block' }}
              onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
            />
            <div className="menu-copy">
              <h3>{item.title || item.name}</h3>
              <p>{item.description || item.desc || 'Freshly prepared with signature KFC flavour.'}</p>
              <div className="price-row">
                <span className="price-tag">${Number(item.price || 0).toFixed(2)}</span>
                <button type="button" className="primary-btn" onClick={() => handleAddToCart(item)} disabled={addingId === itemId}>
                  {addingId === itemId ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}