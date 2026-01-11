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
2. **Drzewo Decyzyjne (Hierarchia):**
   - 1. **OK** (Pinch + 3 open)
   - 2. **Middle** (Middle open only)
   - 3. **ThumbsUp** (Thumb UP + others closed)
   - 4. **Peace** (Index + Middle open)
   - ...innne...
   - Fallback: Open

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

### Shadery (GLSL)
Wbudowane w `ParticleEngine.ts`:
- **Vertex Shader:** Oblicza pozycję. Dodaje "organic drift" (sin/cos), obsługuje przyciąganie do dłoni (`pull`) i efekt eksplozji (`uExplosion`).
- **Fragment Shader:** Obsługuje kolory (mix palet) i "glow" cząsteczek.

### Interakcje
- **Open Hand:** Cząstki płyną za dłonią.
- **Fist:** Zmiana palety kolorów (impuls w shaderze).
- **Middle Finger:** Triggeruje `uExplosion` -> gwałtowne rozproszenie cząstek na zewnątrz + czerwony kolor.

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
