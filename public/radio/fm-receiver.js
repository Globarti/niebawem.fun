// Symulacja odbiornika UKF: każda stacja jest modulowana na nośną FM w paśmie podstawowym,
// dochodzi szum radiowy i zakłócenia impulsowe, potem filtr p.cz. i dyskryminator fazy.
// Szum między stacjami, trzaski progowe i przester przy złym dostrojeniu wynikają z fizyki.

const TWO_PI = Math.PI * 2;
const HZ_PER_MHZ = 80000;   // 0,1 MHz na skali = 8 kHz od środka filtra
const DEV = 5000;           // dewiacja przy pełnej modulacji (Hz)
const IF_FC = 8500;         // połowa szerokości filtra p.cz. (Hz)
const REACH = 0.26;         // dalej niż tyle MHz stacja nie wpada do filtra

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

class FMReceiver extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const n = opts.numberOfInputs;
    this.sr = sampleRate;
    this.freq = new Float32Array(n);    // MHz
    this.amp = new Float32Array(n);     // siła nadajnika × zaniki
    this.ampNow = new Float32Array(n);
    this.phase = new Float64Array(n);
    this.pre = new Float32Array(n);     // stan pre-emfazy
    this.fade = new Float32Array(n).fill(1);
    this.x = 96; this.xt = 96;
    this.sigma = 0.06;                  // szum radiowy
    this.hiss = 0.5;                    // głośność szumu przy braku stacji (soft-mute)
    this.impRate = 0.4;                 // zakłócenia impulsowe na sekundę
    this.imp = 0; this.impAmp = 0;
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
    };
  }
  gauss() {
    if (this.spare !== null) { const s = this.spare; this.spare = null; return s; }
    let u = 0; while (u === 0) u = Math.random();
    const r = Math.sqrt(-2 * Math.log(u)), t = TWO_PI * Math.random();
    this.spare = r * Math.sin(t); return r * Math.cos(t);
  }
  process(inputs, outputs) {
    const out = outputs[0][0]; if (!out) return true;
    const L = out.length, sr = this.sr, n = this.freq.length;
    // stacje w zasięgu filtra + ich wolne zaniki
    const near = [];
    let carrier = 0;
    for (let i = 0; i < n; i++) {
      this.fade[i] = Math.min(1.15, Math.max(.25, this.fade[i] + (Math.random() - .5) * .035));
      this.ampNow[i] += (this.amp[i] * this.fade[i] - this.ampNow[i]) * .08;
      const d = this.freq[i] - this.xt;
      if (Math.abs(d) < REACH && this.ampNow[i] > 1e-4) {
        near.push(i);
        const hz = d * HZ_PER_MHZ, h2 = 1 / (1 + (hz / IF_FC) ** 8);
        carrier += this.ampNow[i] ** 2 * h2;
      }
    }
    // soft-mute jak w prawdziwym tunerze: przy słabym sygnale przycisza szum
    const cnr = carrier / (2 * this.sigma * this.sigma + 1e-9);
    const cnrDb = 10 * Math.log10(cnr + 1e-6);
    this.cnrSm += (cnrDb - this.cnrSm) * .2;
    const sm = Math.min(1, Math.max(0, (this.cnrSm - 2) / 14));
    const muteT = this.hiss + (1 - this.hiss) * sm * sm * (3 - 2 * sm);
    const sig = this.sigma;
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
        const a = this.ampNow[i] * edge;
        I += a * Math.cos(this.phase[i]); Q += a * Math.sin(this.phase[i]);
      }
      // szum radiowy + iskrzenie (trzaski)
      if (this.imp <= 0 && Math.random() < this.impRate / sr) { this.imp = 20 + Math.random() * 600; this.impAmp = sig * (4 + Math.random() * 30); }
      let ns = sig;
      if (this.imp > 0) { this.imp--; ns += this.impAmp * (Math.random() < .2 ? 1 : .15); }
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
