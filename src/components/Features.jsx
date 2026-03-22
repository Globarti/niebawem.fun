import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ═══════════════════════════════════════
   Card 1 — Diagnostic Shuffler
   ═══════════════════════════════════════ */
function ShufflerCard() {
  const items = [
    { label: 'Ciemność', desc: 'Gasną światła. Cisza wypełnia salę.' },
    { label: 'Dźwięk', desc: 'Audycja radiowa rodzi się z ciemności.' },
    { label: 'Scena', desc: 'Światło odsłania teatr improwizowany.' },
  ];

  const [order, setOrder] = useState([0, 1, 2]);

  useEffect(() => {
    const id = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        next.unshift(next.pop());
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="group bg-void border border-deep-purple/15 rounded-4xl p-7 md:p-8 h-full flex flex-col hover:border-magenta/30 transition-colors duration-500">
      <span className="font-mono text-[10px] text-magenta/60 uppercase tracking-[0.2em]">
        Transformacja
      </span>
      <h3 className="font-sans font-bold text-lg md:text-xl text-cream mt-2 mb-6 tracking-tight">
        Od ciemności do sceny
      </h3>

      <div className="relative h-48 flex-1 mb-4">
        {order.map((itemIdx, stackPos) => {
          const item = items[itemIdx];
          return (
            <div
              key={item.label}
              className="absolute inset-x-0 rounded-2xl p-5 border transition-all duration-700"
              style={{
                background:
                  stackPos === 0
                    ? 'rgba(74,26,122,0.35)'
                    : 'rgba(74,26,122,0.15)',
                borderColor:
                  stackPos === 0
                    ? 'rgba(217,70,239,0.3)'
                    : 'rgba(74,26,122,0.2)',
                transform: `translateY(${stackPos * 18}px) scale(${1 - stackPos * 0.04})`,
                opacity: 1 - stackPos * 0.3,
                zIndex: 3 - stackPos,
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <span className="font-sans font-semibold text-cream text-sm">
                {item.label}
              </span>
              <p className="text-cream/35 text-xs mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-cream/30 text-xs leading-relaxed">
        Każdy spektakl to podróż od ciemności do pełnego światła sceny.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   Card 2 — Telemetry Typewriter
   ═══════════════════════════════════════ */
function TypewriterCard() {
  const messages = [
    '> A co jeśli ten list nigdy nie dotarł?',
    '> Radio Niebawem nadaje z częstotliwości marzeń...',
    '> W tej historii nie ma złych odpowiedzi.',
    '> Słuchacze, to nie jest zwykły wieczór.',
    '> Następna piosenka pochodzi z waszych serc.',
    '> Uwaga, przerywamy program specjalnym komunikatem...',
    '> Jeśli mnie słyszysz, mrugaj dwa razy.',
  ];

  const [displayLine, setDisplayLine] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [fading, setFading] = useState(false);
  const msgRef = useRef(0);
  const charRef = useRef(0);

  useEffect(() => {
    let timeout;

    const tick = () => {
      const msg = messages[msgRef.current];

      if (charRef.current < msg.length) {
        setCurrentText((prev) => prev + msg[charRef.current]);
        charRef.current++;
        timeout = setTimeout(tick, 25 + Math.random() * 45);
      } else {
        // Line finished typing — wait, then fade out and start next
        timeout = setTimeout(() => {
          setDisplayLine(msg);
          setCurrentText('');
          // Fade out previous line before typing next
          timeout = setTimeout(() => {
            setFading(true);
            timeout = setTimeout(() => {
              setFading(false);
              setDisplayLine('');
              charRef.current = 0;
              msgRef.current = (msgRef.current + 1) % messages.length;
              timeout = setTimeout(tick, 300);
            }, 400);
          }, 1800);
        }, 200);
      }
    };

    timeout = setTimeout(tick, 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="group bg-void border border-deep-purple/15 rounded-4xl p-7 md:p-8 h-full flex flex-col hover:border-magenta/30 transition-colors duration-500">
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-magenta opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-magenta" />
        </span>
        <span className="font-mono text-[10px] text-magenta/60 uppercase tracking-[0.2em]">
          Live Feed
        </span>
      </div>
      <h3 className="font-sans font-bold text-lg md:text-xl text-cream mt-2 mb-6 tracking-tight">
        Każde słowo na żywo
      </h3>

      <div className="bg-deep-purple/10 rounded-2xl p-4 font-mono text-xs leading-relaxed flex-1 mb-4 h-[180px] overflow-hidden">
        {displayLine && (
          <div
            className="text-cream/20 mb-1.5 break-words transition-opacity duration-400"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {displayLine}
          </div>
        )}
        {currentText && (
          <div className="text-cream/60 break-words">
            {currentText}
            <span className="inline-block w-1.5 h-3.5 bg-magenta ml-0.5 -mb-0.5 animate-blink" />
          </div>
        )}
        {!currentText && !displayLine && (
          <div className="text-cream/60">
            <span className="inline-block w-1.5 h-3.5 bg-magenta ml-0.5 -mb-0.5 animate-blink" />
          </div>
        )}
      </div>

      <p className="text-cream/30 text-xs leading-relaxed">
        Bez scenariusza. Bez powtórek. Czysta improwizacja.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   Card 3 — Cursor Protocol Scheduler
   ═══════════════════════════════════════ */
function SchedulerCard() {
  const days = ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'So', 'Nd'];
  const [activeDay, setActiveDay] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: -30, y: -30 });
  const [showCursor, setShowCursor] = useState(false);
  const [saved, setSaved] = useState(false);
  const animating = useRef(false);

  useEffect(() => {
    const run = () => {
      if (animating.current) return;
      animating.current = true;

      setShowCursor(true);
      setSaved(false);
      setActiveDay(-1);

      const target = Math.floor(Math.random() * 7);
      const endX = target * 44 + 22;

      let step = 0;
      const move1 = () => {
        step++;
        const p = Math.min(step / 35, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setCursorPos({ x: -30 + (endX + 30) * e, y: -30 + 50 * e });
        if (p < 1) requestAnimationFrame(move1);
        else {
          setActiveDay(target);
          setTimeout(() => {
            let s2 = 0;
            const move2 = () => {
              s2++;
              const p2 = Math.min(s2 / 25, 1);
              const e2 = 1 - Math.pow(1 - p2, 3);
              setCursorPos({
                x: endX + (120 - endX) * e2,
                y: 20 + 50 * e2,
              });
              if (p2 < 1) requestAnimationFrame(move2);
              else {
                setTimeout(() => {
                  setSaved(true);
                  setTimeout(() => {
                    setShowCursor(false);
                    animating.current = false;
                  }, 2000);
                }, 400);
              }
            };
            move2();
          }, 500);
        }
      };
      move1();
    };

    run();
    const id = setInterval(run, 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="group bg-void border border-deep-purple/15 rounded-4xl p-7 md:p-8 h-full flex flex-col hover:border-magenta/30 transition-colors duration-500">
      <span className="font-mono text-[10px] text-magenta/60 uppercase tracking-[0.2em]">
        Dostępność
      </span>
      <h3 className="font-sans font-bold text-lg md:text-xl text-cream mt-2 mb-6 tracking-tight">
        Gramy wszędzie
      </h3>

      <div className="relative flex-1 mb-4">
        <div className="flex gap-1.5 sm:gap-2 mb-5 flex-wrap">
          {days.map((day, i) => (
            <div
              key={i}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[10px] font-mono transition-all duration-500 ${
                activeDay === i
                  ? 'bg-magenta text-void scale-90 font-bold shadow-lg shadow-magenta/30'
                  : 'bg-deep-purple/15 text-cream/30'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div
          className={`inline-flex items-center gap-2 font-mono text-[10px] px-4 py-2 rounded-xl transition-all duration-500 ${
            saved
              ? 'bg-lime/15 text-lime border border-lime/20'
              : 'bg-deep-purple/15 text-cream/30 border border-transparent'
          }`}
        >
          {saved ? '✓ Zarezerwowano' : 'Zapisz termin'}
        </div>

        {/* Cursor */}
        {showCursor && (
          <svg
            className="absolute pointer-events-none drop-shadow-lg"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              transition: 'left 0.08s linear, top 0.08s linear',
            }}
            width="18"
            height="22"
            viewBox="0 0 24 28"
            fill="none"
          >
            <path
              d="M5 2l15 10-7 2-4 8L5 2z"
              fill="#D946EF"
              stroke="#0A0A0A"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>

      <p className="text-cream/30 text-xs leading-relaxed">
        Sala, foyer, korytarz, plener — format dostosowuje się do warunków.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   Features Section
   ═══════════════════════════════════════ */
export default function Features() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 75%',
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="spektakle"
      ref={ref}
      className="py-20 md:py-36 px-5 sm:px-10 md:px-16 bg-void"
    >
      <div className="max-w-6xl mx-auto">
        <span className="font-mono text-[10px] text-magenta/50 uppercase tracking-[0.25em] block mb-3">
          Format
        </span>
        <h2 className="font-sans font-extrabold text-2xl sm:text-3xl md:text-5xl text-cream tracking-tight mb-4 max-w-xl">
          Radio Improwizowane
        </h2>
        <p className="text-cream/35 text-sm md:text-base max-w-lg mb-14 md:mb-20 leading-relaxed font-light">
          Teatr, który najpierw słychać, a dopiero potem widać. Trzy fazy jednego doświadczenia.
        </p>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          <div className="feature-card">
            <ShufflerCard />
          </div>
          <div className="feature-card">
            <TypewriterCard />
          </div>
          <div className="feature-card">
            <SchedulerCard />
          </div>
        </div>
      </div>
    </section>
  );
}
