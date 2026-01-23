import './globals.css';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import Header from "@/components/Header"; // adjust path to where your Header is

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Paradise Ironworks - Custom Ironwork That Stands the Test of Time',
  description: 'Expert fabrication and installation of custom iron gates, railings, stairs, and architectural metalwork for residential and commercial properties.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body><Header />{children}</body>
    </html>
  );
}
