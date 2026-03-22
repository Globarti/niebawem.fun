import { useState, useEffect } from 'react';

const links = [
  { id: 'o-nas', label: 'O nas' },
  { id: 'spektakle', label: 'Spektakle' },
  { id: 'zespol', label: 'Zespół' },
  { id: 'kontakt', label: 'Kontakt' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-out ${
        scrolled
          ? 'bg-void/70 backdrop-blur-2xl border border-deep-purple/25 rounded-full px-5 py-2.5 shadow-2xl shadow-magenta/5'
          : 'bg-transparent px-8 py-4 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-6 md:gap-10">
        {/* Logo */}
        <button
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2.5 hover-lift"
        >
          <img
            src="/images/sygnet_white.svg"
            alt=""
            className="h-5 w-auto opacity-90"
          />
          <span className="font-sans font-bold text-sm tracking-tight text-cream">
            niebawem
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-cream/40 hover:text-cream text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 hover-lift font-light"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <button
          onClick={() => scrollTo('kontakt')}
          className="hidden md:block btn-magnetic bg-magenta rounded-full px-5 py-2"
        >
          <span className="btn-bg bg-cream rounded-full" />
          <span className="btn-label relative z-10 text-void text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300">
            Zaproś nas
          </span>
        </button>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-cream/70 hover:text-cream transition-colors"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-3 bg-void/90 backdrop-blur-2xl rounded-4xl border border-deep-purple/20 p-6 flex flex-col gap-4 shadow-2xl">
          {links.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-cream/60 hover:text-cream text-sm tracking-[0.12em] uppercase transition-colors text-left font-light"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('kontakt')}
            className="mt-2 bg-magenta text-void text-sm font-semibold uppercase tracking-wider px-6 py-3 rounded-full"
          >
            Zaproś nas
          </button>
        </div>
      )}
    </nav>
  );
}
