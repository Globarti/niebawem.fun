import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ─── SVG Animations ─── */

function Waveform() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    let id;
    let offset = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      c.scale(dpr, dpr);

      c.clearRect(0, 0, w, h);
      c.strokeStyle = '#D946EF';
      c.lineWidth = 1.5;
      c.globalAlpha = 0.5;
      c.beginPath();

      for (let x = 0; x < w; x++) {
        const y =
          h / 2 +
          Math.sin((x + offset) * 0.025) * 18 +
          Math.sin((x + offset) * 0.06) * 8 +
          Math.sin((x + offset) * 0.01) * 12;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
      offset += 1.5;
      id = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(id);
  }, []);

  return <canvas ref={ref} className="w-full h-20 md:h-24 mt-6" />;
}

function LaserGrid() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    let id;
    let pos = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      c.scale(dpr, dpr);

      c.clearRect(0, 0, w, h);

      const cols = 16;
      const rows = 4;
      const gapX = w / (cols + 1);
      const gapY = h / (rows + 1);
      c.fillStyle = 'rgba(253,244,255,0.08)';
      for (let r = 1; r <= rows; r++) {
        for (let col = 1; col <= cols; col++) {
          c.beginPath();
          c.arc(col * gapX, r * gapY, 2, 0, Math.PI * 2);
          c.fill();
        }
      }

      const lineX = ((pos % 100) / 100) * w;
      const grad = c.createLinearGradient(lineX, 0, lineX, h);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, '#D946EF');
      grad.addColorStop(1, 'transparent');
      c.strokeStyle = grad;
      c.lineWidth = 2;
      c.globalAlpha = 0.7;
      c.beginPath();
      c.moveTo(lineX, 0);
      c.lineTo(lineX, h);
      c.stroke();

      c.fillStyle = '#D946EF';
      c.globalAlpha = 0.6;
      for (let r = 1; r <= rows; r++) {
        for (let col = 1; col <= cols; col++) {
          const dx = Math.abs(col * gapX - lineX);
          if (dx < 20) {
            c.globalAlpha = 0.6 * (1 - dx / 20);
            c.beginPath();
            c.arc(col * gapX, r * gapY, 3, 0, Math.PI * 2);
            c.fill();
          }
        }
      }

      pos += 0.4;
      id = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(id);
  }, []);

  return <canvas ref={ref} className="w-full h-20 md:h-24 mt-6" />;
}

function SpotlightRings() {
  const waves = 18;
  return (
    <>
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.3); opacity: 0.6; filter: blur(0px); }
          100% { transform: scale(1); opacity: 0; filter: blur(8px); }
        }
      `}</style>
      <div className="flex items-center justify-center mt-8 h-72 md:h-96">
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          {Array.from({ length: waves }, (_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-magenta"
              style={{
                animation: `ripple ${4}s ease-out infinite`,
                animationDelay: `${(i / waves) * 4}s`,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-magenta animate-pulse shadow-lg shadow-magenta/60" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Steps data ─── */
const steps = [
  {
    num: '01',
    title: 'Ciemność',
    desc: 'Gasną światła. Widzowie słyszą ciemność. Potem — pierwszy dźwięk, który buduje świat.',
    Visual: Waveform,
    bg: 'from-void to-[#120824]',
  },
  {
    num: '02',
    title: 'Radio',
    desc: 'Audycja radiowa na żywo. Dżingle, muzyka, rap, rymowane wejścia — wszystko improwizowane.',
    Visual: LaserGrid,
    bg: 'from-[#120824] to-[#1a0a30]',
  },
  {
    num: '03',
    title: 'Scena',
    desc: 'Światło odsłania scenę. Audycja płynnie staje się teatrem. Publiczność współtworzy spektakl.',
    Visual: SpotlightRings,
    bg: 'from-[#1a0a30] to-deep-purple',
  },
];

/* ─── Protocol Section ─── */
export default function Protocol() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.protocol-card');

      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          ScrollTrigger.create({
            trigger: card,
            start: 'top top',
            endTrigger: cards[i + 1],
            end: 'top top',
            pin: true,
            pinSpacing: false,
            onUpdate: (self) => {
              const p = self.progress;
              gsap.set(card, {
                scale: 1 - p * 0.08,
                filter: `blur(${p * 12}px)`,
                opacity: 1 - p * 0.5,
              });
            },
          });
        }
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref}>
      {steps.map(({ num, title, desc, Visual, bg }) => (
        <div
          key={num}
          className={`protocol-card min-h-screen flex items-center justify-center px-5 sm:px-10 md:px-16 bg-gradient-to-b ${bg}`}
        >
          <div className="max-w-2xl w-full">
            <span className="font-mono text-magenta/40 text-xs tracking-[0.3em]">
              {num}
            </span>
            <h3 className="font-sans font-extrabold text-3xl sm:text-4xl md:text-6xl text-cream mt-3 tracking-tight">
              {title}
            </h3>
            <p className="text-cream/40 text-sm md:text-base mt-4 md:mt-6 max-w-md leading-relaxed font-light">
              {desc}
            </p>
            <Visual />
          </div>
        </div>
      ))}
    </section>
  );
}
