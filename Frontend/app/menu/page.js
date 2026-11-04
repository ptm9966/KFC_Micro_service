import MenuClient from './MenuClient';
import { getMenuItems } from '../../lib/contentful';

export default async function MenuPage() {
  let items = [];
  let error = '';

  try {
    items = await getMenuItems();
  } catch (err) {
    console.error('Menu fetch error:', err);
    error = 'Unable to load menu right now.';
  }

  return (
    <main className="page-shell">
      <h1 className="page-title">Our Menu</h1>
      <p className="page-subtitle">Freshly loaded from Contentful.</p>
      {error && <p className="page-subtitle" style={{ color: '#b80020' }}>{error}</p>}
      {!error && items.length === 0 && <p className="page-subtitle">No menu items are available.</p>}
      {!error && items.length > 0 && <MenuClient items={items} />}
    </main>
  );
}
