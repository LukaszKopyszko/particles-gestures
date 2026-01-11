# PROJECT INDEX

> **Serce projektu** — pierwszy dokument do przeczytania po powrocie do pracy.

---

## 1. Cel projektu

**Nazwa projektu:** Motion Particles / Aether Kinetic

**Typ:** Next.js Web Application + Three.js + Computer Vision

**Opis:** Interaktywny system cząsteczek sterowany gestami dłoni przez kamerę internetową. Aplikacja wykrywa gesty (pięść, otwarta dłoń, OK, kciuk w górę) i przekłada je na efekty wizualne (zmiana koloru, przyciąganie, eksplozje).

---

## 2. Aktualny stan prac

| Element | Status | Opis |
|---------|--------|------|
| **Setup Next.js** | ✅ Gotowe | App Router, struktura katalogów |
| **Camera Access** | ✅ Gotowe | `CameraPreviewOverlay`, obsługa uprawnień |
| **MediaPipe** | ✅ Gotowe | Detekcja dłoni, landmarki 3D |
| **Particle Engine** | ✅ Gotowe | Three.js, shadery GLSL, 5000 cząstek |
| **Gesture Logic** | ✅ Gotowe | Klasyfikator geometryczny: Fist, OK, Peace, ThumbsUp, Middle |
| **Intro / Onboarding** | ✅ Gotowe | Ekran startowy z instrukcjami |
| **HUD / UI** | ✅ Gotowe | FPS, status, legenda gestów, powiadomienia |
| **Mobile Support** | ✅ Gotowe | `dvh`, responsywność |
| **Audio** | ✅ Gotowe | Tło ambientowe, analiza FFT (reaktywność), SFX gestów |
| **Tryby wizualne** | ✅ Gotowe | 4 tryby: Kinetic, Galaxy, Fire, Rain z płynnym przejściem (morphing shaders) |

**Legenda:** ❌ Do zrobienia | 🔄 W trakcie | ✅ Gotowe | ⏸️ Wstrzymane

**Etap:** Advanced Prototype / MVP Polish

---

## 3. Drzewo plików z rolami

```
<project-root>/
├── rag/                  [Baza wiedzy]
│   ├── INSTRUCTIONS.md   # Zasady pracy
│   ├── INDEX.md          # TEN PLIK - stan i mapa
│   ├── SESSION.md        # Dziennik sesji (log zmian)
│   ├── MODULES.md        # Dokumentacja techniczna modułów
│   └── CONTEXT.md        # (Legacy) Pierwotny kontekst architektoniczny
│
├── src/
│   ├── app/
│   │   ├── page.tsx            # Główny entry point (FullScreen)
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Globalne style (reset, dvh)
│   │
│   ├── components/
│   │   ├── SceneRoot.tsx       # Orkiestrator: Canvas + Vision + State
│   │   ├── IntroOverlay.tsx    # Ekran powitalny (start/instrukcja)
│   │   ├── CameraPreviewOverlay.tsx # Podgląd kamery + inicjalizacja
│   │   └── HUD.tsx             # Overlay UI (FPS, gesty, legenda)
│   │
│   ├── lib/
│   │   ├── scene/
│   │   │   └── ParticleEngine.ts # Three.js: System cząsteczek, shadery
│   │   │
│   │   └── vision/
│   │       ├── HandTrackerService.ts # MediaPipe wrapper (kamera, stream)
│   │       ├── HandStateNormalizer.ts # Przeliczanie współrzędnych
│   │       └── GestureClassifier.ts  # Logika wykrywania gestów (geometria)
│   │
│   └── state/
│       └── useInputStore.ts    # Zustand: Globalny stan (pozycja, gesty)
└── public/
    └── models/ (planowane)
```

---

## 4. Decyzje architektoniczne

| Decyzja | Powód |
|---------|-------|
| **Three.js + BufferGeometry** | Wydajność przy 5000+ cząsteczkach, kontrola shaderów. |
| **MediaPipe (Client-side)** | Niskie opóźnienie (brak round-trip do serwera), prywatność. |
| **Zustand** | Minimalny boilerplate, łatwa synchronizacja Vision -> UI -> Scene. |
| **Geometryczny Klasyfikator** | Zastąpienie prostego 'Y-check' analizą odległości i kątów dla lepszej odporności na rotację dłoni. |
| **Inline Styles & CSS Modules** | Unikanie problemów konfiguracyjnych i konfliktów Tailwind z Canvasem. |
| **100dvh** | Obsługa mobilnych przeglądarek (ukrywający się pasek adresu). |

---

## 5. Źródła prawdy

| Priorytet | Źródło | Opis |
|-----------|--------|------|
| 0 | **Kod (src/)** | Ostateczna prawda o działaniu aplikacji |
| 1 | `rag/INDEX.md` | Wysokopoziomowy przegląd stanu |
| 2 | `rag/MODULES.md` | Szczegóły implementacji algorytmów |

---

## 6. Kluczowe wartości

| Klucz | Wartość |
|-------|---------|
| **Particle Count** | 5000 |
| **FPS Target** | 60 (Render), 30 (Vision) |
| **Gestures** | Open, Fist, Pointing, Peace, Middle, ThumbsUp, OK |
| **Color Palettes** | Cyan, Ember, Lime, Violet, Gold |

---

## 7. Next steps

1. Rozbudowa trybów wizualnych (Galaxy, Fire).
2. Dodanie warstwy audio (Web Audio API).
3. Optymalizacja wydajności na low-end mobile.
4. Refaktoryzacja `SceneRoot` (wydzielenie hooków).

---

## 8. Aktualizacja dokumentu

**Ten plik musi być aktualizowany** po każdej istotnej zmianie:
- nowe pliki → dodać do drzewa
- zmiana architektury → zaktualizować sekcję 4
- nowe decyzje → udokumentować
- zmiana stanu → zaktualizować sekcję 2
