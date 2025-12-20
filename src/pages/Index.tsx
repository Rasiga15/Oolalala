import {Navbar} from '../components/layout/Navbar';
import {HeroSection} from '../components/Home/herosection';
import {Footer} from '../components/layout/Footer';

import {AboutSection } from '../components/Home/aboutsection';
import {WhyPassengersLove }from '../components/Home/whypasangerlove';
import {PromiseSection} from '../components/Home/promisesection';
import {FAQSection} from '../components/Home/faqsection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
         <PromiseSection />
         <AboutSection />
        <WhyPassengersLove />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;