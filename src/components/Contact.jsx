import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Contact() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact-reveal', {
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 65%',
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="kontakt"
      ref={ref}
      className="relative py-28 md:py-44 px-5 sm:px-10 md:px-16 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0A0A0A, #1a0a2e)' }}
    >
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-magenta/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <span className="contact-reveal font-mono text-[10px] text-magenta/50 uppercase tracking-[0.25em] block mb-6">
          Kontakt
        </span>

        <h2 className="contact-reveal font-sans font-extrabold text-3xl sm:text-4xl md:text-6xl text-cream tracking-tight mb-6 leading-tight">
          Chcesz nas
          <span className="font-serif italic text-magenta ml-3">zaprosić?</span>
        </h2>

        <p className="contact-reveal text-cream/35 text-sm md:text-base max-w-md mx-auto mb-12 leading-relaxed font-light">
          Gramy na eventach firmowych, festiwalach, w domach kultury i wszędzie tam, gdzie jest publiczność. Napisz — odpowiemy niebawem.
        </p>

        <div className="contact-reveal flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="mailto:kontakt@niebawem.fun"
            className="btn-magnetic bg-magenta text-void font-sans font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-full"
          >
            <span className="btn-bg bg-cream rounded-full" />
            <span className="btn-label relative z-10 transition-colors duration-300">
              kontakt@niebawem.fun
            </span>
          </a>

          <a
            href="https://www.instagram.com/niebawem.impro/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-magnetic border border-deep-purple/30 text-cream/60 hover:text-cream font-sans text-sm uppercase tracking-wider px-8 py-4 rounded-full transition-colors duration-300"
          >
            <span className="btn-bg bg-deep-purple/30 rounded-full" />
            <span className="relative z-10 flex items-center gap-2">
              Instagram
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 17L17 7M17 7H7M17 7v10"
                />
              </svg>
            </span>
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61587727553623"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-magnetic border border-deep-purple/30 text-cream/60 hover:text-cream font-sans text-sm uppercase tracking-wider px-8 py-4 rounded-full transition-colors duration-300"
          >
            <span className="btn-bg bg-deep-purple/30 rounded-full" />
            <span className="relative z-10 flex items-center gap-2">
              Facebook
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 17L17 7M17 7H7M17 7v10"
                />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
