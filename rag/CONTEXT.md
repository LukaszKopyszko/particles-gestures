# Architektura Techniczna Aplikacji Next.js z Systemem Cząsteczek i Sterowaniem Gestami

Dokument zawiera kompletną, techniczną architekturę dla aplikacji Next.js, która łączy system cząsteczek (particle system) ze sterowaniem za pomocą gestów dłoni.

**Główne założenia funkcjonalne:**
- Renderowanie podglądu kamery użytkownika (np. w lewym dolnym rogu).
- Ruch dłoni wpływa na obiekty w scenie (np. pole sił / kursor w przestrzeni cząstek).
- Wykrycie "zamknięcia dłoni w pięść" powoduje zmianę globalnego stanu (np. zmiana koloru, impuls).
- Fallback dla urządzeń dotykowych przy użyciu bibliotek gestów (Hammer.js / Interact.js).

**Ważna uwaga dot. instalacji:**
Wszystkie pakiety NPM są instalowane ręcznie przez użytkownika z terminala. Asystent (AI) przystępuje do kodowania dopiero po potwierdzeniu instalacji wymaganych zależności.

---

## 1. Stos Technologiczny

### Warstwa UI / Framework
- **Framework:** Next.js (App Router)
- **Biblioteka UI:** React 18
- **Język:** TypeScript
- **Strony:**
  - Scena główna (`/`)
  - Ustawienia (`/settings`) - kalibracja, zgody, diagnostyka FPS.

### Rendering i Particles
**Wariant A (Rekomendowany):**
- **Silnik:** Three.js (WebGL)
- **Particles:** Własny system na GPU (BufferGeometry + ShaderMaterial) lub Instancing.
- **Postprocessing:** Opcjonalnie (bloom, afterimage) - z uwagą na wydajność.

**Wariant B (Alternatywny):**
- **Silnik:** PixiJS (GPU 2D) - prostszy, bardzo wydajny dla efektów 2D.

### Rozpoznawanie Dłoni (Computer Vision)
- **Rekomendacja:** MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`).
  - Działa w przeglądarce, zwraca landmarki dłoni, handedness, wspiera tryb stream.
- **Alternatywa:** TensorFlow.js handpose / hand-pose-detection.

### Fallback Input (Dotyk)
- **Biblioteki:** Hammer.js / Interact.js / ZingTouch.
- Służą do obsługi gestów dotykowych (drag/pinch/swipe) na urządzeniach bez kamery.

---

## 2. Architektura Modułów

### A. Warstwa "Scene" (Render + Symulacja)
Cel: Stabilna pętla renderująca, niezależna od re-renderów Reacta.

- **SceneRoot (Client Component):**
  - Inicjuje renderer (Three/Pixi), canvasy, ResizeObserver.
  - Zarządza pętlą symulacji (`requestAnimationFrame`).
  - Subskrybuje stan wejścia (hand/touch) minimalizując reaktywność Reacta.
- **ParticleEngine:**
  - Przechowuje bufory pozycji, prędkości i koloru cząstek.
  - `applyHandField(handState)`: oblicza wpływ pola sił dłoni.
  - `triggerFistPulse()`: wyzwala impuls zmiany kolorów/parametrów.
  - `update(dt)`: krok symulacji fizyki.
  - `render()`: rysowanie klatki.

### B. Warstwa "Vision / Hand Tracking"
Cel: Przetwarzanie obrazu z kamery na stabilny stan gestów bez blokowania UI.

- **HandTrackerService:**
  - Obsługuje `getUserMedia`.
  - Utrzymuje ukryty element `<video>`.
  - Uruchamia detektor MediaPipe w trybie stream.
  - Udostępnia API Pub/Sub `onHandState(cb)`.
- **HandStateNormalizer:**
  - Mapuje współrzędne landmarków na układ sceny/viewportu (0..1).
  - Wygładza ruch (EMA / OneEuroFilter).
  - Wyznacza "punkt sterujący" (np. czubek palca wskazującego lub środek dłoni).
- **GestureClassifier:**
  - Wykrywa gest "pięść" (stan binarny) z debouncingiem i histerezą.
  - Prosta heurystyka: suma odległości opuszka (tip) do stawu (MCP) dla palców.
  - Generuje zdarzenia: `FIST_START`, `FIST_END`, `HAND_MOVE` (throttled).

### C. Warstwa "Input Fallback"
- **TouchGestureAdapter:**
  - Mapuje zdarzenia pinch/drag na wirtualną pozycję dłoni (`virtualHandPosition`).
  - Mapuje np. long-press na wirtualną pięść (`virtualFist`).

### D. Warstwa "UI / Overlay"
- **CameraPreviewOverlay:**
  - Renderuje podgląd video (lewy dolny róg).
  - Opcjonalnie canvas z landmarkami (tryb debug).
- **HUD:**
  - Licznik FPS, status kamery, zgody, pauza, kalibracja.

---

## 3. Przepływ Danych (Pipeline)

1. **Inicjalizacja:** Przeglądarka prosi o dostęp do kamery (Input Video).
2. **Akwizycja:** `HandTrackerService` pobiera klatki z video.
3. **Detekcja:** MediaPipe zwraca 21 landmarków + handedness.
4. **Normalizacja (`HandStateNormalizer`):**
   - Wybór punktu sterującego.
   - Filtracja jittera.
   - Normalizacja do przestrzeni sceny.
5. **Klasyfikacja (`GestureClassifier`):**
   - Detekcja zamknięcia dłoni.
   - Emisja zdarzeń (tylko przy zmianie stanu).
6. **Symulacja (`ParticleEngine`):**
   - `applyHandField(handState.position)`: interakcja fizyczna (przyciąganie, wir).
   - `FIST_START`: zmiana shaderów/kolorów.

---

## 4. Struktura Projektu (Next.js App Router)

```
app/
├── layout.tsx          # Globalne style, fonty
├── page.tsx            # Główna scena (dynamic import, client-only)
└── settings/
    └── page.tsx        # Kalibracja i diagnostyka

components/
├── SceneRoot.tsx       # (Client) Kontener sceny 3D/2D
├── CameraPreviewOverlay.tsx # (Client) Podgląd kamery
└── HUD.tsx             # Interfejs użytkownika

lib/
├── scene/
│   ├── ParticleEngine.ts
│   ├── Renderer.ts     # Wrapper na Three/Pixi
│   └── Shaders/        # Kod shaderów GLSL
├── vision/
│   ├── HandTrackerService.ts
│   ├── HandStateNormalizer.ts
│   └── GestureClassifier.ts
└── input/
    └── TouchGestureAdapter.ts

state/
└── useInputStore.ts    # (Zustand) Minimalny stan współdzielony

workers/ (opcjonalnie)
└── vision.worker.ts    # Web Worker do detekcji (uwaga na kompatybilność)
```

**Ważne:** Komponenty sceny i wizji muszą być `client-only` (brak dostępu do kamery/WebGL w SSR). Używaj `dynamic(() => import(...), { ssr: false })`.

---

## 5. Model Interakcji i Fizyki

### A. Sterowanie Ruchem (Pole Sił)
Pozycja dłoni działa jak źródło pola sił:
```glsl
// Przykładowy model siły
force = k * (handPos - particlePos) / (dist^2 + eps);
```
Dla lepszego efektu warto dodać komponent rotacyjny (curl) tworzący wir wokół dłoni.

### B. Zmiana Koloru (Gest Pięści)
- "Pięść" jest zdarzeniem logicznym (`FIST_START`), nie ciągłym stanem.
- Po wykryciu: `colorMode = nextPalette`, uruchomienie animacji przejścia (`pulseTimer`).
- Shader: `mix(baseColor, paletteColor, pulseCurve(t))`.

### C. Stabilizacja
Kluczowa dla uniknięcia migotania (flickering):
- **Histereza:** Inne progi dla wejścia w stan pięści i wyjścia z niego.
- **Debounce:** Wymagany stabilny stan przez np. 120-200ms.

---

## 6. Wydajność i Bezpieczeństwo

### Wydajność
- **Cele:** 60 FPS dla renderu, 15-30 FPS dla detekcji dłoni.
- **Throttling:** Analiza obrazu co N ms (nie każdą klatkę renderu).
- **Quality Tiers:** Dostosowanie liczby cząstek do capabilities urządzenia (FPS check).
- **Wątki:** Preferowanie Web Workera dla detekcji, ale z zachowaniem fallbacku do głównego wątku.

### Bezpieczeństwo i Prywatność
- **Zgody:** Kamera uruchamiana tylko po wyraźnej zgodzie użytkownika.
- **Prywatność:** Jasny komunikat "Processing on-device" (brak wysyłki video na serwer).
- **CSP:** Jeśli modele ładowane są z CDN, należy skonfigurować Content Security Policy. Zalecany hosting lokalny modeli.