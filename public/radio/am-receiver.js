// Symulacja odbiornika fal krótkich (AM, pasmo 49 m): stacje modulowane amplitudowo, gęsto co 5 kHz,
// rozchodzenie się przez jonosferę w modelu Wattersona (1970): dwie drogi fali, każda z zanikiem
// o gaussowskim widmie Dopplera, różne opóźnienia → zaniki selektywne („falowanie”, przesuwanie barwy).
// Między stacjami słychać dudnienia nośnych (gwizdy), przeciek generatora odbiornika daje gwizd,
// który opada do zera, gdy stacja się nastraja. Trzaski atmosferyczne: impulsy klasy A Middletona,
// pioruny jako serie wyładowań. ARW (automatyczna regulacja wzmocnienia) pompuje szum jak w lampowym odbiorniku.

const TWO_PI = Math.PI * 2;
const HZ_PER_UNIT = 50000;   // 0,1 działki skali = 5 kHz (odstęp kanałów na krótkich falach)
const IF_FC = 4000;          // połowa szerokości filtra p.cz. (Hz)
const REACH = 0.45;          // dalej niż tyle działek nośna nie wpada do filtra
const IF_NOISE = 2 * IF_FC / 48000;
const DLY = 256;             // bufor opóźnienia drugiej drogi fali (próbki)

function butterLP(fc, q, sr) {
  const w = TWO_PI * fc / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
  return { b0: (1 - c) / 2 / a0, b1: (1 - c) / a0, b2: (1 - c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 };
}
function biq(f, s, x) {
  const y = f.b0 * x + s[0];
  s[0] = f.b1 * x - f.a1 * y + s[1];
  s[1] = f.b2 * x - f.a2 * y;
  return y;
}
const rnd = (a, b) => a + Math.random() * (b - a);
function gauss() { let u = 0; while (u === 0) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * Math.random()); }

// Zanik o gaussowskim widmie Dopplera (jak w modelu Wattersona): suma zespolonych sinusoid
// o częstotliwościach losowanych z rozkładu normalnego. spread = 2σ widma (Hz), shift = przesunięcie Dopplera.
class GaussFader {
  constructor(spread, shift = 0, k = 0, M = 10) {
    this.f = []; this.ph = [];
    for (let n = 0; n < M; n++) { this.f.push(TWO_PI * (shift + gauss() * spread / 2)); this.ph.push(rnd(0, TWO_PI)); }
    this.sc = 1 / Math.sqrt(M);
    this.los = Math.sqrt(k / (k + 1)); this.dif = Math.sqrt(1 / (k + 1)); this.losPh = rnd(0, TWO_PI);
    this.t = rnd(0, 1000); this.re = 1; this.im = 0;
  }
  step(dt) {
    this.t += dt;
    let re = 0, im = 0;
    for (let n = 0; n < this.f.length; n++) { const a = this.f[n] * this.t + this.ph[n]; re += Math.cos(a); im += Math.sin(a); }
    this.re = this.los * Math.cos(this.losPh) + this.dif * this.sc * re;
    this.im = this.los * Math.sin(this.losPh) + this.dif * this.sc * im;
  }
}
// kanał Wattersona: dwie drogi (np. odbicie jedno- i dwuskokowe), każda z własnym zanikiem i opóźnieniem
function channel(p2db, delayMs, spread, k1) {
  return { a: new GaussFader(spread, rnd(-.1, .1), k1), b: new GaussFader(spread * rnd(.7, 1.5), rnd(-.3, .3)),
           g2: Math.pow(10, p2db / 20), dly: Math.min(DLY - 2, Math.round(delayMs * 48)) };
}

class AMReceiver extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const n = opts.numberOfInputs;
    this.sr = sampleRate;
    this.freq = new Float32Array(n); this.amp = new Float32Array(n); this.ampNow = new Float32Array(n);
    this.phase = new Float64Array(n);
    this.ring = Array.from({ length: n }, () => new Float32Array(DLY)); this.w = 0;
    // stacje z programu: słuchalne, ale „oddychają” (mocna droga główna, słabsza druga)
    this.ch = Array.from({ length: n }, () => channel(rnd(-12, -5), rnd(.3, 1.5), rnd(.05, .3), rnd(3, 10)));
    this.x = 96; this.xt = 96;
    this.sigma = .06; this.hiss = .5; this.impRate = .4; this.carpetLvl = 1;
    this.carpetSrc = Array.from({ length: n }, (_, i) => i);
    this.imp = 0; this.impAmp = 0; this.impDecay = 1; this.burst = 0; this.burstNext = 0;
    this.lo = 0; this.loF = 0; this.loDrift = 0;   // przeciek generatora odbiornika
    this.fadeLvl = 1; this.buzzLvl = 0; this.whistle = .12; this.excl = [];
    this.makeCarpet();
    this.f1 = butterLP(IF_FC, .5412, this.sr); this.f2 = butterLP(IF_FC, 1.3066, this.sr);
    this.sI1 = [0, 0]; this.sI2 = [0, 0]; this.sQ1 = [0, 0]; this.sQ2 = [0, 0];
    this.env = 0; this.agc = 0; this.dcX = 0; this.dcY = 0;
    this.tone = butterLP(2800, .7071, this.sr); this.sT = [0, 0];   // wąskie pasmo m.cz. starego odbiornika
    this.port.onmessage = e => {
      const d = e.data;
      if (d.x !== undefined) this.xt = d.x;
      if (d.freq) this.freq.set(d.freq);
      if (d.amp) this.amp.set(d.amp);
      if (d.sigma !== undefined) this.sigma = d.sigma;
      if (d.hiss !== undefined) this.hiss = d.hiss;
      if (d.impRate !== undefined) this.impRate = d.impRate;
      if (d.carpetSrc) this.carpetSrc = d.carpetSrc;
      if (d.carpet !== undefined) this.carpetLvl = d.carpet;
      if (d.fade !== undefined) this.fadeLvl = d.fade;
      if (d.buzz !== undefined) this.buzzLvl = d.buzz;
      if (d.whistle !== undefined) this.whistle = d.whistle;
      if (d.excl) this.excl = d.excl;
    };
  }
  // krótkie fale są zatłoczone: nośna prawie w każdym kanale 5 kHz, lekko obok siatki → gwizdy dudnień
  makeCarpet() {
    const C = [];
    for (let f = 87.55; f < 108; f += .1) {
      if (Math.random() < .3) continue;
      C.push({
        f: f + rnd(-.012, .012), db: rnd(-4, 22),
        ch: channel(rnd(-6, 0), rnd(.5, 3), rnd(.1, 1.5), Math.random() < .2 ? rnd(1, 4) : 0),
        src: Math.floor(Math.random() * 1e6), gain: Math.random() < .25 ? 0 : rnd(.5, 1), phase: rnd(0, TWO_PI),
      });
    }
    this.carpet = C;
  }
  process(inputs, outputs) {
    const out = outputs[0][0]; if (!out) return true;
    const L = out.length, sr = this.sr, n = this.freq.length, dtB = L / sr, sig = this.sigma;
    const near = [], cnear = [];
    for (let i = 0; i < n; i++) {
      this.ampNow[i] += (this.amp[i] - this.ampNow[i]) * .08;
      if (Math.abs(this.freq[i] - this.xt) < REACH && this.ampNow[i] > 1e-4) { const c = this.ch[i]; c.a.step(dtB); c.b.step(dtB); near.push(i); }
    }
    const cA = sig * Math.sqrt(2 * IF_NOISE) * this.carpetLvl;
    if (cA > 0) for (const c of this.carpet) {
      if (Math.abs(c.f - this.xt) >= REACH || this.excl.some(f => Math.abs(c.f - f) < .17)) continue;
      c.ch.a.step(dtB); c.ch.b.step(dtB); c.A = cA * Math.pow(10, c.db / 20); cnear.push(c);
    }
    // generator odbiornika lekko pływa (nagrzewanie lamp)
    this.loDrift += (rnd(-1, 1) * 8 - this.loDrift) * .002;
    const loAmp = sig * Math.sqrt(2 * IF_NOISE) * this.whistle * 8, fl = this.fadeLvl;
    // pioruny: seria kilku wyładowań w odstępach dziesiątek ms
    if (this.burst <= 0 && Math.random() < this.impRate * .15 * dtB) { this.burst = 2 + Math.floor(Math.random() * 6); this.burstNext = 0; }
    const nIF = sig * Math.sqrt(2 * IF_NOISE);
    const agcFloor = nIF * (1.25 + .6 / (this.hiss + .05));   // im mniejszy „szum”, tym mniej ARW podbija pusty eter

    for (let k = 0; k < L; k++) {
      this.x += (this.xt - this.x) * .0015;
      const w = this.w = (this.w + 1) % DLY;
      let I = 0, Q = 0;
      for (const i of near) {
        const inp = inputs[i] && inputs[i][0];
        const m = inp ? Math.tanh(inp[k] * 2.5) : 0;
        this.ring[i][w] = m;
      }
      for (let j = 0; j < this.carpetSrc.length; j++) {   // bufory programu dla dalekich stacji
        const i = this.carpetSrc[j]; if (near.includes(i)) continue;
        const inp = inputs[i] && inputs[i][0]; this.ring[i][w] = inp ? Math.tanh(inp[k] * 2.5) : 0;
      }
      for (const i of near) {
        const c = this.ch[i], r = this.ring[i];
        const d = this.freq[i] - this.x;
        const edge = Math.abs(d) > REACH - .05 ? Math.max(0, (REACH - Math.abs(d)) / .05) : 1;
        this.phase[i] += TWO_PI * d * HZ_PER_UNIT / sr;
        if (this.phase[i] > 1e6) this.phase[i] %= TWO_PI;
        const s1 = Math.max(0, 1 + .85 * r[w]), s2 = Math.max(0, 1 + .85 * r[(w - c.dly + DLY) % DLY]) * c.g2;
        const gr = s1 * (1 + fl * (c.a.re - 1)) + fl * s2 * c.b.re, gi = fl * (s1 * c.a.im + s2 * c.b.im);
        const a = this.ampNow[i] * edge, cs = Math.cos(this.phase[i]), sn = Math.sin(this.phase[i]);
        I += a * (gr * cs - gi * sn); Q += a * (gr * sn + gi * cs);
      }
      for (const c of cnear) {
        const r = this.ring[this.carpetSrc[c.src % this.carpetSrc.length]];
        const d = c.f - this.x;
        const edge = Math.abs(d) > REACH - .05 ? Math.max(0, (REACH - Math.abs(d)) / .05) : 1;
        c.phase += TWO_PI * d * HZ_PER_UNIT / sr;
        if (c.phase > 1e6) c.phase %= TWO_PI;
        const s1 = Math.max(0, 1 + .85 * c.gain * r[w]), s2 = Math.max(0, 1 + .85 * c.gain * r[(w - c.ch.dly + DLY) % DLY]) * c.ch.g2;
        const gr = s1 * (1 + fl * (c.ch.a.re - 1)) + fl * s2 * c.ch.b.re, gi = fl * (s1 * c.ch.a.im + s2 * c.ch.b.im);
        const A = c.A * edge, cs = Math.cos(c.phase), sn = Math.sin(c.phase);
        I += A * (gr * cs - gi * sn); Q += A * (gr * sn + gi * cs);
      }
      // przeciek generatora: nośna w środku filtra — dudni z każdą stacją obok (gwizd przy strojeniu)
      this.lo += TWO_PI * this.loDrift / sr;
      I += loAmp * Math.cos(this.lo); Q += loAmp * Math.sin(this.lo);
      // szum + trzaski atmosferyczne
      if (this.burst > 0 && --this.burstNext <= 0) {
        this.imp = 1; this.impAmp = sig * Math.exp(rnd(2, 4)); this.impDecay = Math.exp(-1 / (sr * rnd(.001, .012)));
        this.burst--; this.burstNext = sr * rnd(.02, .15);
      } else if (Math.random() < this.impRate * 2 / sr) {
        this.imp = 1; this.impAmp = sig * Math.exp(rnd(.5, 2.8)); this.impDecay = Math.exp(-1 / (sr * rnd(.0002, .003)));
      }
      let ns = sig;
      if (this.imp > .01) { ns += this.impAmp * this.imp * (Math.random() < .5 ? 1 : .3); this.imp *= this.impDecay; }
      I += ns * gauss(); Q += ns * gauss();
      // filtr p.cz.
      I = biq(this.f2, this.sI2, biq(this.f1, this.sI1, I));
      Q = biq(this.f2, this.sQ2, biq(this.f1, this.sQ1, Q));
      // detektor obwiedni (dioda) + ARW
      const e = Math.sqrt(I * I + Q * Q);
      this.env += (e - this.env) * (e > this.env ? .004 : .00006);
      const g = .35 / Math.max(this.env, agcFloor);
      this.agc += (g - this.agc) * .002;
      const y = e * this.agc;
      const dc = y - this.dcX + .995 * this.dcY; this.dcX = y; this.dcY = dc;   // kondensator sprzęgający
      out[k] = Math.tanh(biq(this.tone, this.sT, dc) * 1.2) * .5;
    }
    if (outputs[0][1]) outputs[0][1].set(out);
    return true;
  }
}
registerProcessor('am-receiver', AMReceiver);
