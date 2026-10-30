# Statystyki tekstury dźwięku wg McDermott & Simoncelli (2011), uproszczone:
# pasma ERB -> obwiednia (Hilbert) -> kompresja ^0.3 -> momenty, moc modulacji, korelacje pasm.
import sys, numpy as np, subprocess
from scipy import signal

SR = 16000

def load(path, start=0, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start)] + (['-t', str(dur)] if dur else []) + \
          ['-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).astype(float)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)

def erb_space(lo, hi, n):
    e = lambda f: 21.4 * np.log10(1 + .00437 * f)
    ie = lambda E: (10 ** (E / 21.4) - 1) / .00437
    return ie(np.linspace(e(lo), e(hi), n))

FC = erb_space(150, 6500, 16)
MODB = [(0.5, 2), (2, 8), (8, 32), (32, 128)]

def stats(x):
    envs = []
    for fc in FC:
        bw = 24.7 * (4.37 * fc / 1000 + 1)
        sos = signal.butter(2, [fc - bw / 2 * 1.5, fc + bw / 2 * 1.5], 'band', fs=SR, output='sos')
        env = np.abs(signal.hilbert(signal.sosfilt(sos, x))) ** .3
        envs.append(signal.resample_poly(env, 1, 40))   # 400 Hz
    E = np.array(envs)[:, 40:]
    fs = SR / 40
    mu = E.mean(1); sd = E.std(1)
    cv = sd / mu
    k = ((E - mu[:, None]) ** 4).mean(1) / sd ** 4
    mp = []
    for a, b in MODB:
        sos = signal.butter(2, [a, min(b, fs / 2 * .95)], 'band', fs=fs, output='sos')
        mp.append(((signal.sosfilt(sos, E - mu[:, None], axis=1)) ** 2).mean(1) / mu ** 2)
    C = np.corrcoef(E)
    corr = C[np.triu_indices(len(FC), 1)].mean()
    # niestacjonarność: zmienność głośności w oknach 250 ms
    w = int(SR * .25); L = len(x) // w
    lv = 10 * np.log10((x[:L * w].reshape(L, w) ** 2).mean(1) + 1e-12)
    # centroid widma
    f, P = signal.welch(x, SR, nperseg=2048)
    cen = (f * P).sum() / P.sum()
    return dict(cv=cv.mean(), kurt=k.mean(), **{f'mod{a}-{b}': np.sqrt(m.mean()) for (a, b), m in zip(MODB, mp)},
                corr=corr, loud_sd_db=lv.std(), centroid=cen)

if __name__ == '__main__':
    rows = []
    for spec in sys.argv[1:]:
        p, *r = spec.split('@')
        st, du = (map(float, r[0].split(':')) if r else (0, None))
        rows.append((spec.split('/')[-1], stats(load(p, st, du))))
    keys = list(rows[0][1])
    print(f"{'plik':32s}" + ''.join(f'{k:>11s}' for k in keys))
    for n, s in rows:
        print(f'{n[:32]:32s}' + ''.join(f'{s[k]:11.3f}' for k in keys))
