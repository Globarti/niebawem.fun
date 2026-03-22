# Niebawem.fun — Landing Page

## Linki społecznościowe
- **Facebook**: https://www.facebook.com/profile.php?id=61587727553623
- **Instagram**: https://www.instagram.com/niebawem.impro/
- **Email**: kontakt@niebawem.fun
- **Domena**: niebawem.fun

## Zasoby zewnętrzne
- **Google Drive (grafiki/portrety)**: https://drive.google.com/drive/u/0/folders/1lS2iIShzw6cI9c1Arwu2c2xTZFvuil1w
- **Lokalna ścieżka GDrive**: `/Users/bartlomiejglowacki/Library/CloudStorage/GoogleDrive-globartre@gmail.com/My Drive/Impro_Niebawem/Grafiki/Portrety/Portrety/`

## Deploy
- GitHub Actions → VPS (51.38.141.16)
- Push na `main` → automatyczny deploy
- `npm run build` generuje statyczny output do `dist/`

## Stack technologiczny
- **Astro 4.16** (static output) + **React** (client:load islands)
- **Tailwind CSS** z custom paletą w `tailwind.config.mjs`
- **GSAP 3** + ScrollTrigger (animacje)
- **Fonty**: Sora (headings/UI), Cormorant Garamond (italic drama), Fira Code (mono/labels)

## Paleta kolorów (tailwind.config.mjs)
- `void` #0A0A0A — tło główne (prawie czarny)
- `cream` #FDF4FF — tekst jasny
- `lavender` #F5D0FE — delikatny fiolet
- `deep-purple` #4A1A7A — ciemny fiolet (footer, akcenty)
- `magenta` #D946EF — główny accent (CTA, headingi)
- `lime` #A4C639 — status/live indicator

## Struktura komponentów (src/components/)
- `App.jsx` — główny wrapper, ładuje wszystkie sekcje
- `Navbar.jsx` — floating pill, morph na scroll (transparent → glass blur)
- `Hero.jsx` — fullscreen hero ze zdjęciem, GSAP staggered fade-up
- `Features.jsx` — "Radio Improwizowane" z 3 interaktywnymi kartami
- `Philosophy.jsx` — parallax zdjęcie + word-by-word GSAP reveal
- `Protocol.jsx` — 3 sticky stacking cards (Ciemność/Radio/Scena) z canvas
- `Team.jsx` — grupowe zdjęcie + grid 9 członków
- `Contact.jsx` — CTA "Chcesz nas zaprosić?" + email/Instagram/Facebook
- `Footer.jsx` — rounded-t-4rem, nawigacja, sociale, status "Na żywo od 2024"

## Obrazy (public/images/)
- `hero.jpeg` — zdjęcie z DK Włochy
- `philosophy.jpeg` — zdjęcie do sekcji filozofii
- `team-stage.jpeg` — grupowe na scenie
- `team-pionki.jpg` — zdjęcie zespołu
- `portraits/` — portrety członków (bartek-p.jpg, julka.jpg, pawel.jpg, kosma.jpg)
- `logo.svg`, `logo_white.svg` — pełne logo (wordmark) — używane w Navbar i Footer
- `sygnet.svg`, `sygnet_white.svg` — sygnet (ikona) — używany jako favicon

## Zasady dot. obrazów — WAŻNE

**Źródło**: oryginalne pliki są w Google Drive (patrz "Zasoby zewnętrzne"). PNG z GDrive ważą 6-11MB — ZAWSZE kompresuj przed dodaniem do repo.

### Maksymalne wymiary i formaty
| Typ obrazu | Max szerokość | Format | Jakość | Przykład komendy |
|---|---|---|---|---|
| Portrety | 400px | JPEG | 85 | `sips -Z 400 input.png -s format jpeg -s formatOptions 85 --out output.jpg` |
| Hero / sekcje | 1200px | JPEG | 85 | `sips -Z 1200 input.png -s format jpeg -s formatOptions 85 --out output.jpeg` |
| Team (grupowe) | 1200px | JPEG | 85 | j.w. |
| Logo / sygnet | oryginał | SVG | — | nie kompresować, kopiować as-is |

### Logo vs Sygnet
- **Logo** (`logo_white.svg`) = pełny wordmark "niebawem" — używać w Navbar i Footer
- **Sygnet** (`sygnet.svg`) = sam symbol — używać jako favicon i tam gdzie potrzebna mała ikona
- Logo ma być zawsze takie samo — nie łączyć sygnetu z osobnym tekstem

## Porady dot. edycji

### Dodawanie nowego członka zespołu
1. Pobierz portret z GDrive (`Grafiki/Portrety/Portrety/IMIĘ N/`)
2. Skompresuj: `sips -Z 400 input.png -s format jpeg -s formatOptions 85 --out public/images/portraits/imie.jpg`
3. Edytuj tablicę `members` w `Team.jsx` — ustaw `img: '/images/portraits/imie.jpg'`

### Zmiana zdjęć hero/sekcji
1. Skompresuj do max 1200px: `sips -Z 1200 input.png -s format jpeg -s formatOptions 85 --out output.jpeg`
2. Podmień plik w `public/images/`

### Animacje GSAP
- Każdy komponent ma własny `useEffect` z `gsap.context()` + cleanup
- ScrollTrigger jest rejestrowany globalnie w `App.jsx`
- W dev mode animacje mogą się resetować przy HMR — to normalne

### Dodawanie nowej sekcji
1. Stwórz komponent w `src/components/NazwaSekcji.jsx`
2. Zaimportuj i dodaj w `App.jsx` w odpowiednim miejscu
3. Dodaj `id` do sekcji jeśli ma być w nawigacji
4. Zaktualizuj tablicę linków w `Navbar.jsx` i `Footer.jsx`

### Polskie znaki
- Wszystkie teksty powinny mieć poprawne polskie znaki (ą, ę, ś, ć, ź, ż, ó, ł, ń)
- Strona ma `lang="pl"` w `index.astro`
