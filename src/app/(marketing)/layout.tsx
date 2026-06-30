import Header from '@/components/Header';
import Footer from '@/components/footer';

const SITE_URL = 'https://www.paradiseironworks.com';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Paradise Ironworks & Construction',
    url: SITE_URL,
    image: `${SITE_URL}/images/paradise_ironworks_logo.png`,
    telephone: '+1-202-309-6610',
    description:
      'Custom ironwork, metal railings, gates, structural steel, and ornamental metal fabrication serving Washington DC, Maryland, and Northern Virginia.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'College Park',
      addressRegion: 'MD',
      addressCountry: 'US',
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Washington DC' },
      { '@type': 'AdministrativeArea', name: 'Maryland' },
      { '@type': 'AdministrativeArea', name: 'Northern Virginia' },
    ],
    priceRange: '$$',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <Header />
      {children}
      <Footer />
    </>
  );
}
