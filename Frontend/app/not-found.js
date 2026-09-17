import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-shell" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h1 className="page-title">Page Not Found</h1>
      <p className="page-subtitle">The page you are looking for doesn’t exist or may have moved.</p>
      <Link href="/" className="primary-btn">Go Home</Link>
    </main>
  );
}
