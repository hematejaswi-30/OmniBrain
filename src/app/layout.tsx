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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('omnibrain_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#FAF7F2] text-[#2B2B2B] dark:bg-[#1C1C1C] dark:text-[#EDE8DF] antialiased min-h-screen selection:bg-[#E2DDD3] dark:selection:bg-[#383632]">
        {children}
      </body>
    </html>
  );
}
