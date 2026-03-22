import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Philosophy from './Philosophy';
import Protocol from './Protocol';
import Team from './Team';
import Contact from './Contact';
import Footer from './Footer';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    // Refresh ScrollTrigger after all images load
    const imgs = document.querySelectorAll('img');
    let loaded = 0;
    const total = imgs.length;
    const onLoad = () => {
      loaded++;
      if (loaded >= total) ScrollTrigger.refresh();
    };
    imgs.forEach(img => {
      if (img.complete) onLoad();
      else img.addEventListener('load', onLoad);
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Philosophy />
        <Protocol />
        <Team />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
