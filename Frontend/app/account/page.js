'use client';

import { useEffect, useState } from 'react';

export default function AccountPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    } catch (error) {
      setUser(null);
    }
  }, []);

  if (!user) {
    return (
      <main className="page-shell">
        <h1 className="page-title">My Account</h1>
        <p className="page-subtitle">Please log in to view your account details.</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <h1 className="page-title">My Account</h1>
      <div className="account-layout" style={{ display: 'grid' }}>
        <div className="account-card">
          <h3>Account Overview</h3>
          <div className="table-list">
            <div className="table-row"><span>Name</span><strong>{user.name || 'N/A'}</strong></div>
            <div className="table-row"><span>Email</span><strong>{user.email || 'N/A'}</strong></div>
            <div className="table-row"><span>Mobile</span><strong>{user.mobile || 'N/A'}</strong></div>
          </div>
        </div>

        <div className="account-card">
          <h3>Quick Actions</h3>
          <div className="table-list">
            <div className="table-row"><span>Order History</span><strong>View</strong></div>
            <div className="table-row"><span>Saved Addresses</span><strong>3</strong></div>
            <div className="table-row"><span>Favorite Items</span><strong>7</strong></div>
          </div>
        </div>
      </div>
    </main>
  );
}
