import Header from '../components/Header';
import HeroSection from '../components/herosection';
import OurServices from '../components/OurServices';
import WorkPreview from '../components/WorkPreview';
import ChooseUs from '../components/ChooseUs';
import Footer from '@/components/footer';

export default function Page() {
  return (
   <div className="min-h-screen">
      <Header />
      <main >
      <HeroSection />
      <OurServices />
      <WorkPreview />
      <ChooseUs />
      <Footer />

    </main>
     </div>
  );
}
