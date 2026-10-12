import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Hábitos Simples - Água, Exercício, Sono e Remédios',
  description: 'Aplicativo gratuito e leve para cuidar de 4 hábitos essenciais: beber água, se exercitar, dormir bem e tomar remédios. 100% offline, fácil e sem cadastro.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hábitos Simples',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Hábitos Simples',
    description: 'Aplicativo leve e gratuito para manter 4 hábitos essenciais: beber água, se exercitar, dormir bem e tomar remédios.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hábitos Simples',
    description: 'Aplicativo leve e gratuito para manter 4 hábitos essenciais: beber água, se exercitar, dormir bem e tomar remédios.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen selection:bg-sky-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
