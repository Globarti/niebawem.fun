// Symulacja odbiornika UKF, wersja 2: każda stacja jest modulowana na nośną FM w paśmie podstawowym,
// dochodzi szum radiowy, zakłócenia impulsowe, potem filtr p.cz. i dyskryminator fazy.
// Względem v1 (fm-receiver-v1.js) pasmo nie jest puste ani nieruchome:
//  • zaniki wielodrogowe: każda nośna ma zespolone wzmocnienie Rice'a/Rayleigha z widmem Dopplera
//    (model sumy sinusoid Zhenga i Xiao, 2002) — sygnał „oddycha” i chwilami tonie w szumie,
//  • „dywan” dalekich stacji: dziesiątki słabych nośnych na progu FM, które co chwilę przechwytują
//    demodulator (efekt progowy, kliki Rice'a, 1963) — szum przestaje być jednolity,
//  • zakłócenia przemysłowe w modelu impulsowym (Middleton, klasa A) + okresy brzęczenia 100 Hz
//    od urządzeń sieciowych.
// Statystyki obwiedni (McDermott i Simoncelli, 2011) porównane z nagraniami prawdziwego szumu radia.

const TWO_PI = Math.PI * 2;
const HZ_PER_MHZ = 80000;   // 0,1 MHz na skali = 8 kHz od środka filtra
const DEV = 5000;           // dewiacja przy pełnej modulacji (Hz)
const IF_FC = 8500;         // połowa szerokości filtra p.cz. (Hz)
const REACH = 0.26;         // dalej niż tyle MHz stacja nie wpada do filtra
const IF_NOISE = 2 * IF_FC / 48000;   // jaka część mocy szumu przechodzi przez filtr p.cz.
const BLOCK = 128;

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

// Zanik Rayleigha: suma M sinusoid z losowymi kątami przyjścia (Zheng i Xiao 2002).
// fd = częstotliwość Dopplera (Hz); k = współczynnik Rice'a (moc składowej bezpośredniej / rozproszonej).
class Fader {
  constructor(fd, k, M = 8) {
    const th = rnd(-Math.PI, Math.PI);
    this.w = []; this.ph = []; this.cI = []; this.cQ = [];
    for (let n = 1; n <= M; n++) {
      const a = (TWO_PI * n - Math.PI + th) / (4 * M), psi = rnd(-Math.PI, Math.PI);
      this.w.push(TWO_PI * fd * Math.cos(a)); this.ph.push(rnd(-Math.PI, Math.PI));
      this.cI.push(Math.cos(psi)); this.cQ.push(Math.sin(psi));
    }
    this.sc = Math.sqrt(2 / M);
    this.los = Math.sqrt(k / (k + 1)); this.dif = Math.sqrt(1 / (k + 1));
    this.losPh = rnd(0, TWO_PI);
    this.t = rnd(0, 1000);
    this.re = 1; this.im = 0;
  }
  step(dt) {
    this.t += dt;
    let re = 0, im = 0;
    for (let n = 0; n < this.w.length; n++) { const c = Math.cos(this.w[n] * this.t + this.ph[n]); re += this.cI[n] * c; im += this.cQ[n] * c; }
    this.re = this.los * Math.cos(this.losPh) + this.dif * this.sc * re;
    this.im = this.los * Math.sin(this.losPh) + this.dif * this.sc * im;
  }
}

class FMReceiver extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const n = opts.numberOfInputs;
    this.sr = sampleRate;
    this.freq = new Float32Array(n);    // MHz
    this.amp = new Float32Array(n);     // siła nadajnika
    this.ampNow = new Float32Array(n);
    this.phase = new Float64Array(n);
    this.pre = new Float32Array(n);     // stan pre-emfazy
    // stacje z programu: odbiór pokojowy, w miarę stabilny (Rice, K 4–20, wolny Doppler od ludzi w sali)
    this.fad = Array.from({ length: n }, () => new Fader(rnd(.05, .5), rnd(4, 20)));
    this.gRe = new Float32Array(n).fill(1); this.gIm = new Float32Array(n);
    this.x = 96; this.xt = 96;
    this.sigma = 0.06;                  // szum radiowy
    this.hiss = 0.5;                    // głośność szumu przy braku stacji (soft-mute)
    this.impRate = 0.4;                 // zakłócenia impulsowe na sekundę
    this.imp = 0; this.impAmp = 0; this.impDecay = 1;
    this.buzz = 0; this.buzzAmp = 0; this.buzzPh = 0;   // brzęczenie od urządzeń sieciowych
    this.fadeLvl = 1; this.buzzLvl = .2; this.whistle = 0; this.excl = [];
    this.makeCarpet(n);
    this.f1 = butterLP(IF_FC, 0.5412, this.sr); this.f2 = butterLP(IF_FC, 1.3066, this.sr);
    this.sI1 = [0, 0]; this.sI2 = [0, 0]; this.sQ1 = [0, 0]; this.sQ2 = [0, 0];
    this.pI = 1; this.pQ = 0;
    this.deA = Math.exp(-1 / (this.sr * 50e-6)); this.de = 0;   // de-emfaza 50 µs
    this.dcX = 0; this.dcY = 0;
    this.mute = 0; this.cnrSm = 0;
    this.spare = null;
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
  // dalekie stacje: gęsto w całym paśmie, siła w okolicy progu FM, zaniki Rayleigha (brak widoczności nadajnika)
  makeCarpet(n) {
    this.carpetLvl = 1;
    this.carpetSrc = Array.from({ length: n }, (_, i) => i);
    const C = [];
    for (let f = 87.6; f < 108; f += rnd(.07, .2)) {
      C.push({
        f: +f.toFixed(2) + rnd(-.004, .004),             // lekko obok kanału: dudnienia z sąsiadami
        db: rnd(-10, 8),                                  // CNR w paśmie p.cz. przy średniej mocy
        fad: new Fader(rnd(.08, 1.6), Math.random() < .25 ? rnd(.5, 3) : 0),
        src: Math.floor(Math.random() * 1e6), gain: Math.random() < .2 ? 0 : rnd(.4, 1),
        phase: 0, pre: 0, gRe: 0, gIm: 0,
      });
    }
    this.carpet = C;
  }
  gauss() {
    if (this.spare !== null) { const s = this.spare; this.spare = null; return s; }
    let u = 0; while (u === 0) u = Math.random();
    const r = Math.sqrt(-2 * Math.log(u)), t = TWO_PI * Math.random();
    this.spare = r * Math.sin(t); return r * Math.cos(t);
  }
  process(inputs, outputs) {
    const out = outputs[0][0]; if (!out) return true;
    const L = out.length, sr = this.sr, n = this.freq.length, dtB = L / sr, sig = this.sigma;
    // stacje w zasięgu filtra + zaniki
    const near = [], cnear = [];
    let carrier = 0;
    for (let i = 0; i < n; i++) {
      this.ampNow[i] += (this.amp[i] - this.ampNow[i]) * .08;
      const d = this.freq[i] - this.xt;
      if (Math.abs(d) < REACH && this.ampNow[i] > 1e-4) {
        const F = this.fad[i], fl = this.fadeLvl; F.step(dtB);
        this.gRe[i] = 1 + fl * (F.re - 1); this.gIm[i] = fl * F.im;
        near.push(i);
        const hz = d * HZ_PER_MHZ, h2 = 1 / (1 + (hz / IF_FC) ** 8);
        carrier += this.ampNow[i] ** 2 * (this.gRe[i] ** 2 + this.gIm[i] ** 2) * h2;
      }
    }
    const cAmp0 = sig * Math.sqrt(2 * IF_NOISE) * this.carpetLvl;
    if (cAmp0 > 0) for (const c of this.carpet) {
      const d = c.f - this.xt;
      if (Math.abs(d) >= REACH || this.excl.some(f => Math.abs(c.f - f) < .17)) continue;
      c.fad.step(dtB);
      const a = cAmp0 * Math.pow(10, c.db / 20), fl = this.fadeLvl;
      c.gRe = a * (1 + fl * (c.fad.re - 1)); c.gIm = a * fl * c.fad.im;
      cnear.push(c);
      const hz = d * HZ_PER_MHZ, h2 = 1 / (1 + (hz / IF_FC) ** 8);
      carrier += (c.gRe * c.gRe + c.gIm * c.gIm) * h2;
    }
    // soft-mute jak w prawdziwym tunerze: przy słabym sygnale przycisza szum
    const cnr = carrier / (2 * sig * sig * IF_NOISE + 1e-9);
    const cnrDb = 10 * Math.log10(cnr + 1e-6);
    this.cnrSm += (cnrDb - this.cnrSm) * .2;
    const sm = Math.min(1, Math.max(0, (this.cnrSm - 6) / 18));
    const muteT = this.hiss + (1 - this.hiss) * sm * sm * (3 - 2 * sm);
    // zakłócenia przemysłowe: czasem przez kilka sekund brzęczy urządzenie zsynchronizowane z siecią
    if (this.buzz <= 0 && Math.random() < this.buzzLvl * .04 * dtB) { this.buzz = rnd(1, 5) * sr; this.buzzAmp = sig * rnd(1.5, 5) * this.buzzLvl; }
    const gR = this.gRe, gI = this.gIm;
    for (let k = 0; k < L; k++) {
      this.x += (this.xt - this.x) * .0015;
      let I = 0, Q = 0;
      for (let j = 0; j < near.length; j++) {
        const i = near[j], inp = inputs[i] && inputs[i][0];
        let m = inp ? Math.tanh(inp[k] * 3) : 0;   // kompresor nadajnika
        const p = m - .55 * this.pre[i]; this.pre[i] = m; m = p;   // pre-emfaza
        if (m > 1.2) m = 1.2; else if (m < -1.2) m = -1.2;
        const d = this.freq[i] - this.x;
        const edge = Math.abs(d) > REACH - .05 ? Math.max(0, (REACH - Math.abs(d)) / .05) : 1;
        this.phase[i] += TWO_PI * (d * HZ_PER_MHZ + DEV * m) / sr;
        if (this.phase[i] > 1e6) this.phase[i] %= TWO_PI;
        const a = this.ampNow[i] * edge, c = Math.cos(this.phase[i]), s = Math.sin(this.phase[i]);
        I += a * (gR[i] * c - gI[i] * s); Q += a * (gR[i] * s + gI[i] * c);
      }
      for (let j = 0; j < cnear.length; j++) {
        const c = cnear[j], src = this.carpetSrc[c.src % this.carpetSrc.length], inp = inputs[src] && inputs[src][0];
        let m = inp ? Math.tanh(inp[k] * 3) * c.gain : 0;
        const p = m - .55 * c.pre; c.pre = m; m = p;
        const d = c.f - this.x;
        const edge = Math.abs(d) > REACH - .05 ? Math.max(0, (REACH - Math.abs(d)) / .05) : 1;
        c.phase += TWO_PI * (d * HZ_PER_MHZ + DEV * m) / sr;
        if (c.phase > 1e6) c.phase %= TWO_PI;
        const cs = Math.cos(c.phase) * edge, sn = Math.sin(c.phase) * edge;
        I += c.gRe * cs - c.gIm * sn; Q += c.gRe * sn + c.gIm * cs;
      }
      // szum radiowy + impulsy (klasa A Middletona: przychodzą wg Poissona, gasną wykładniczo)
      if (Math.random() < this.impRate / sr) { this.imp = 1; this.impAmp = sig * Math.exp(rnd(1, 4)); this.impDecay = Math.exp(-1 / (sr * rnd(.0002, .004))); }
      let ns = sig;
      if (this.imp > .01) { ns += this.impAmp * this.imp; this.imp *= this.impDecay; }
      if (this.buzz > 0) {
        this.buzz--; this.buzzPh += 100 / sr;
        if (this.buzzPh >= 1) this.buzzPh -= 1;
        if (this.buzzPh < .06) ns += this.buzzAmp * (1 - this.buzzPh / .06);
      }
      I += ns * this.gauss(); Q += ns * this.gauss();
      // filtr p.cz.
      I = biq(this.f2, this.sI2, biq(this.f1, this.sI1, I));
      Q = biq(this.f2, this.sQ2, biq(this.f1, this.sQ1, Q));
      // dyskryminator fazy
      const re = I * this.pI + Q * this.pQ, im = Q * this.pI - I * this.pQ;
      this.pI = I; this.pQ = Q;
      let y = Math.atan2(im, re) * sr / TWO_PI / DEV;
      this.de = y + this.deA * (this.de - y);          // de-emfaza
      const dc = this.de - this.dcX + .997 * this.dcY;  // usunięcie składowej stałej
      this.dcX = this.de; this.dcY = dc;
      this.mute += (muteT - this.mute) * .0008;
      out[k] = dc * .5 * this.mute;
    }
    if (outputs[0][1]) outputs[0][1].set(out);
    return true;
  }
}
registerProcessor('fm-receiver', FMReceiver);
