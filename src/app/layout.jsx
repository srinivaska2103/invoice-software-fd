import '../index.css';
import Providers from './providers';

export const metadata = {
  title: 'Vexatech Billing & Inventory System',
  description: 'Production-ready billing, invoicing, and stock management system',
  icons: {
    icon: '/vexatechlogo.jpeg',
    shortcut: '/vexatechlogo.jpeg',
    apple: '/vexatechlogo.jpeg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/jpeg" href="/vexatechlogo.jpeg" />
        <link rel="shortcut icon" href="/vexatechlogo.jpeg" />
        <link rel="apple-touch-icon" href="/vexatechlogo.jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50/80 text-slate-900 antialiased font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-500 selection:text-white min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
