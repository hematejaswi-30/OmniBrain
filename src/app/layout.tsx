import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniBrain — Personal Knowledge Graph',
  description: 'Consolidate, cluster, and synthesize saved content across WhatsApp, Instagram, Drive, and the web.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-[#fafafa] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
