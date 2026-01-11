# MODULES

> Szczegółowa dokumentacja techniczna modułów/komponentów projektu.

---

## Moduł: Vision (Rozpoznawanie Obrazu)

### Opis
Odpowiada za inicjalizację kamery, strumieniowanie video i przetwarzanie klatek przez MediaPipe w celu wykrycia landmarków dłoni. Zawiera również logikę klasyfikacji gestów.

### Pliki

| Plik | Rola |
|------|------|
| `HandTrackerService.ts` | Wrapper na `FilesetResolver` i `HandLandmarker`. Zarządza `getUserMedia`. |
| `GestureClassifier.ts` | **Core logic.** Analizuje geometrię dłoni (odległości, kąty) by zwrócić `GestureType`. |
| `HandStateNormalizer.ts` | Zamienia surowe współrzędne MediaPipe na przestrzeń sceny (wygładzanie, skalowanie). |

### Algorytm Klasyfikacji (`GestureClassifier`)
Nowa implementacja oparta na hierarchii i geometrii:
1. **Analiza:** Oblicza odległości Tip-Wrist vs PIP-Wrist (czy palec otwarty?), relacje kciuka (odstaje? w górę?), oraz "szczypanie" (pinch distance).
2. **Drzewo Decyzyjne (Hierarchia Priorytetów):**
   - 1. **OK (👌)**: Pinch distance < threshold + Middle/Ring/Pinky Open.
   - 2. **Middle (🖕)**: Middle Open + Index/Ring/Pinky Closed.
   - 3. **Thumbs Up (👍)**: Thumb UP (High Y diff) + Fingers Closed.
   - 4. **Peace (✌️)**: Index & Middle Open + Ring/Pinky Closed.
   - 5. **Pointing (☝️)**: Index Open + Middle/Ring/Pinky Closed.
   - 6. **Fist (✊)**: All fingers Closed + Thumb NOT Up.
   - 7. **Open (✋)**: Default/Fallback when multiple fingers are open.

### Uwagi
- Klasyfikator używa "Palm Scale" (odległość nadgarstek-środek) do normalizacji progów, dzięki czemu działa niezależnie od odległości dłoni od kamery.

---

## Moduł: Scene (Cząsteczki)

### Opis
Silnik renderujący oparty na Three.js. Generuje 5000 cząstek, które reagują na pozycję dłoni (siły przyciągania/odpychania) i zmieniają kolor/zachowanie w zależności od gestu.

### Pliki

| Plik | Rola |
|------|------|
| `ParticleEngine.ts` | Inicjalizuje Three.js, zarządza buforami cząstek i ShaderMaterialem. |
| `SceneRoot.tsx` | React wrapper. Łączy Vision (tracker) ze Scene (engine). Obsługuje pętlę `requestAnimationFrame`. |

### Audio (Web Audio API)
Moduł `AudioEngine.ts` zarządza warstwą dźwiękową:
- **Background Music:** Klimatyczny loop ambientowy (Mixkit).
- **FFT Analysis:** `AnalyserNode` dostarcza dane o amplitudzie częstotliwości (overall intensity).
- **Gesture SFX:** 
  - `Middle Finger` -> Deep Glitch Impact.
  - `Fist` -> Fast Magic Sweep.

### Shadery (GLSL)
Wbudowane w `ParticleEngine.ts`. Silnik obsługuje **Morphing Shaders** oraz **Audio-Reactivity**:

1.  **Kinetic:** Organiczny dryf + przyciąganie do dłoni.
2.  **Galaxy:** Spiralna rotacja. Dźwięk powoduje pulsowanie promienia spirali.
3.  **Fire:** Ruch w górę. Dźwięk zwiększa turbulencje i wysokość płomieni.
4.  **Rain:** Ruch w dół. Efekt parasola.

Uniform `uAudio` steruje jasnością cząstek (exposure) i ich rozmiarem w czasie rzeczywistym.

### Interakcje (Fizyka Dłoni)
Interakcja dłoni z cząsteczkami zmienia się dynamicznie w zależności od trybu wizualnego:
- **Kinetic (Default):** Przyciąganie (`Attraction`). Cząstki płyną za dłonią z opóźnieniem.
- **Galaxy:** Grawitacja orbitalna (`Black Hole`). Dłoń działa jak centrum grawitacyjne.
- **Fire:** Odpychanie turbulencyjne (`Wind`).
- **Rain:** Efekt parasola (`Umbrella`).

### Gesty (Zdarzenia)
- **Fist (✊):** Cykl kolorów + dźwięk "Sweep".
- **Middle Finger (🖕):** Eksplozja (`uExplosion`) + dźwięk "Boom Impact".
- **Thumbs Up (👍):** Informacja zwrotna ("NICE!") na ekranie.
- **OK Sign (👌):** Status "Perfect" w HUD.

---

## Moduł: State & UI

### Opis
Warstwa prezentacji i zarządzania stanem globalnym aplikacji.

### Pliki

| Plik | Rola |
|------|------|
| `useInputStore.ts` | Zustand store. Przechowuje: `hand` {x,y}, `gesture`, `fps`, `colorIndex`. |
| `HUD.tsx` | Wyświetla nakładkę (overlay): FPS, aktualny gest, legendę, powiadomienia ("NICE!", "FUCK YOU!"). |
| `IntroOverlay.tsx` | Ekran powitalny (Glassmorphism). Blokuje dostęp do kamery do momentu kliknięcia "Start". |
| `CameraPreviewOverlay.tsx` | Mały podgląd video w lewym dolnym rogu. |

### Konwencje
- UI używa pozycjonowania absolutnego i jest "click-through" (`pointer-events: none`) tam gdzie to możliwe.
- Style `globals.css` wymuszają `100dvh` i `overflow: hidden`.
