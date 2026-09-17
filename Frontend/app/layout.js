import './globals.css';
import SiteShell from '../components/SiteShell';

export const metadata = {
  title: 'KFC | King of Good Food',
  description: 'KFC storefront built with Next.js and ready for Cloudflare deployment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
