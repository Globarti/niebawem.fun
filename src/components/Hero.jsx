import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Hero() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4 });

      tl.from('.hero-l1', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      })
        .from(
          '.hero-l2',
          {
            y: 80,
            opacity: 0,
            duration: 1.4,
            ease: 'power3.out',
          },
          '-=0.8'
        )
        .from(
          '.hero-sub',
          {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
          },
          '-=0.6'
        )
        .from(
          '.hero-cta',
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.4'
        )
        .from(
          '.hero-scroll',
          {
            opacity: 0,
            duration: 1.2,
            ease: 'power2.out',
          },
          '-=0.3'
        );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={ref} className="relative h-dvh overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero.jpeg"
          alt="Niebawem na scenie"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 55%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-transparent to-transparent h-32" />
      </div>

      {/* Content — bottom-left */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-16 sm:pb-20 md:pb-28 px-5 sm:px-10 md:px-16 lg:px-24 max-w-5xl">
        <h1 className="select-none">
          <span className="hero-l1 block font-sans font-extrabold text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight drop-shadow-lg">
            Teatr jest
          </span>
          <span className="hero-l2 block font-serif italic text-magenta text-5xl sm:text-7xl md:text-[8rem] lg:text-[9rem] leading-[0.85] mt-1 md:mt-3 drop-shadow-2xl">
            improwizowany.
          </span>
        </h1>

        <p className="hero-sub text-cream/60 text-xs sm:text-sm tracking-[0.2em] uppercase mt-5 md:mt-6 max-w-md font-light leading-relaxed">
          Każdy spektakl istnieje tylko raz. Bez scenariusza. Bez powtórek.
        </p>

        <button
          onClick={() =>
            document
              .getElementById('kontakt')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
          className="hero-cta btn-magnetic mt-5 md:mt-8 bg-magenta text-void font-sans font-bold text-xs sm:text-sm uppercase tracking-wider px-7 sm:px-9 py-3 sm:py-4 rounded-full w-fit"
        >
          <span className="btn-bg bg-cream rounded-full" />
          <span className="btn-label relative z-10 transition-colors duration-300">
            Zaproś nas
          </span>
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-cream/20 text-[10px] tracking-[0.35em] uppercase font-light">
          Scroll
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/20 to-transparent relative overflow-hidden">
          <div className="w-full h-3 bg-magenta/60 absolute animate-bounce" />
        </div>
      </div>
    </section>
  );
}
