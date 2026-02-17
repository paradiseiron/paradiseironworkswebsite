import './globals.css';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import Header from "@/components/Header";
import Footer from "@/components/footer";

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
  description:
    'Expert fabrication and installation of custom iron gates, railings, stairs, and architectural metalwork for residential and commercial properties.',
};

const SITE_URL = "https://paradiseironworks.com";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: "Paradise Ironworks & Construction",
    url: SITE_URL,
    image: `${SITE_URL}/images/logo.png`,
    telephone: "+1-202-309-6610",
    description:
      "Custom ironwork, metal railings, gates, structural steel, and ornamental metal fabrication serving Washington DC, Maryland, and Northern Virginia.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "College Park",
      addressRegion: "MD",
      addressCountry: "US",
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Washington DC",
      },
      {
        "@type": "AdministrativeArea",
        name: "Maryland",
      },
      {
        "@type": "AdministrativeArea",
        name: "Northern Virginia",
      },
    ],
    priceRange: "$$",
  };

  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
