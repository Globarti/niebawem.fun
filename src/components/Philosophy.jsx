import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Philosophy() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Word-by-word reveal
      gsap.from('.philo-word', {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 55%',
        },
      });

      // Parallax background
      gsap.to('.philo-bg', {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  const W = ({ children, className = '' }) => (
    <span className={`philo-word inline-block mr-[0.28em] ${className}`}>
      {children}
    </span>
  );

  return (
    <section
      id="o-nas"
      ref={ref}
      className="relative py-28 md:py-44 px-5 sm:px-10 md:px-16 overflow-hidden"
      style={{ background: '#2a0e4a' }}
    >
      {/* Parallax background */}
      <div className="philo-bg absolute inset-0 -top-20">
        <img
          src="/images/philosophy.jpeg"
          alt=""
          className="w-full h-[130%] object-cover opacity-[0.12]"
          style={{ objectPosition: '50% 40%' }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a0e4a]/70 via-transparent to-[#2a0e4a]/80" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Line 1 — conventional */}
        <p className="text-cream/30 text-base sm:text-lg md:text-xl leading-relaxed mb-10 md:mb-16">
          <W>Większość</W>
          <W>teatrów</W>
          <W>skupia</W>
          <W>się</W>
          <W>na:</W>
          <W className="text-cream/50">scenariuszu,</W>
          <W className="text-cream/50">reżyserii,</W>
          <W className="text-cream/50">powtarzalnej</W>
          <W className="text-cream/50">perfekcji.</W>
        </p>

        {/* Line 2 — manifesto */}
        <div className="leading-[1.15]">
          <W className="font-sans font-extrabold text-cream text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            My
          </W>
          <W className="font-sans font-extrabold text-cream text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            skupiamy
          </W>
          <W className="font-sans font-extrabold text-cream text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            się
          </W>
          <W className="font-sans font-extrabold text-cream text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            na:
          </W>
          <br />
          <span className="philo-word inline-block font-serif italic text-magenta text-4xl sm:text-6xl md:text-7xl lg:text-8xl mt-2">
            momencie.
          </span>
        </div>
      </div>
    </section>
  );
}
