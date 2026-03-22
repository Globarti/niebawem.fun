import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const members = [
  { name: 'Damian Samosyn', initials: 'DS', img: null },
  { name: 'Rafal Smietana', initials: 'RS', img: null },
  { name: 'Bartek Pochylski', initials: 'BP', img: '/images/portraits/bartek-p.jpg' },
  { name: 'Bartek Glowacki', initials: 'BG', img: null },
  { name: 'Kosma Masny', initials: 'KM', img: '/images/portraits/kosma.jpg' },
  { name: 'Zosia Sniegocka', initials: 'ZS', img: null },
  { name: 'Rafal Jakubanis', initials: 'RJ', img: null },
  { name: 'Paweł Czarnocki', initials: 'PC', img: '/images/portraits/pawel.jpg' },
  { name: 'Julia Korsakowska-Grzelczyk', initials: 'JK', img: '/images/portraits/julka.jpg' },
];

export default function Team() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.team-card', {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 70%',
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="zespol"
      ref={ref}
      className="relative z-10 py-20 md:py-36 px-5 sm:px-10 md:px-16 bg-void"
    >
      <div className="max-w-6xl mx-auto">
        <span className="font-mono text-[10px] text-magenta/50 uppercase tracking-[0.25em] block mb-3">
          Zespół
        </span>
        <h2 className="font-sans font-extrabold text-2xl sm:text-3xl md:text-5xl text-cream tracking-tight mb-4 max-w-xl">
          Ludzie Niebawem
        </h2>
        <p className="text-cream/35 text-sm md:text-base max-w-lg mb-14 md:mb-20 leading-relaxed font-light">
          Dziewięcioro improwizatorów, dla których każdy spektakl jest jedynym w swoim rodzaju.
        </p>

        {/* Team photo */}
        <div className="mb-16 md:mb-24 rounded-4xl overflow-hidden">
          <img
            src="/images/team-stage.jpeg"
            alt="Zespół Niebawem na scenie"
            className="w-full h-[280px] sm:h-[360px] md:h-[460px] object-cover"
            style={{ objectPosition: '50% 35%' }}
          />
        </div>

        {/* Member grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
          {members.map((m) => (
            <div
              key={m.initials}
              className="team-card group flex flex-col items-center text-center"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-magenta/40 transition-all duration-500 group-hover:scale-105">
                {m.img ? (
                  <img
                    src={m.img}
                    alt={m.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-deep-purple/40 flex items-center justify-center">
                    <span className="font-mono text-lg text-cream/40 group-hover:text-magenta transition-colors duration-300">
                      {m.initials}
                    </span>
                  </div>
                )}
                {/* Hover glow */}
                <div className="absolute inset-0 bg-magenta/0 group-hover:bg-magenta/10 transition-colors duration-500 rounded-full" />
              </div>
              <span className="text-cream/70 text-xs sm:text-sm font-light tracking-wide group-hover:text-cream transition-colors duration-300">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
