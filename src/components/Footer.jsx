export default function Footer() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-deep-purple rounded-t-[3rem] md:rounded-t-[4rem] pt-16 md:pt-20 pb-8 px-5 sm:px-10 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/images/sygnet_white.svg"
                alt=""
                className="h-6 w-auto opacity-80"
              />
              <span className="font-sans font-bold text-cream text-lg tracking-tight">
                niebawem
              </span>
            </div>
            <p className="text-cream/30 text-sm leading-relaxed font-light max-w-xs">
              Grupa improwizacji teatralnej. Teatr, który najpierw słychać, a
              dopiero potem widać.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-mono text-[10px] text-cream/30 uppercase tracking-[0.25em] mb-5">
              Nawigacja
            </h4>
            <div className="flex flex-col gap-3">
              {[
                { id: 'hero', label: 'Start' },
                { id: 'o-nas', label: 'O nas' },
                { id: 'spektakle', label: 'Spektakle' },
                { id: 'zespol', label: 'Zespół' },
                { id: 'kontakt', label: 'Kontakt' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-cream/40 hover:text-cream text-sm transition-colors duration-300 text-left hover-lift font-light"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact + Status */}
          <div>
            <h4 className="font-mono text-[10px] text-cream/30 uppercase tracking-[0.25em] mb-5">
              Kontakt
            </h4>
            <div className="flex flex-col gap-3 mb-8">
              <a
                href="mailto:kontakt@niebawem.fun"
                className="text-cream/40 hover:text-cream text-sm transition-colors duration-300 hover-lift font-light"
              >
                kontakt@niebawem.fun
              </a>
              <a
                href="https://instagram.com/niebawem"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream/40 hover:text-cream text-sm transition-colors duration-300 hover-lift font-light"
              >
                @niebawem
              </a>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
              </span>
              <span className="font-mono text-[10px] text-cream/25 uppercase tracking-[0.2em]">
                Na żywo od 2024
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-cream/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-cream/15 text-xs font-light">
            &copy; {new Date().getFullYear()} Niebawem
          </span>
          <span className="text-cream/10 text-xs font-mono">
            niebawem.fun
          </span>
        </div>
      </div>
    </footer>
  );
}
