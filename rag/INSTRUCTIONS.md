# INSTRUKCJA PRACY ASYSTENTA
(obowiązkowe do przeczytania przed rozpoczęciem jakichkolwiek działań w projekcie)

**WAŻNE:** Po przeczytaniu tego pliku odpowiedz tylko "ok" - nie marnuj tokenów na podsumowania.

---

## 0. Quick Reference: Pliki w `rag/`

| Plik | Rola | Czytaj na start | Aktualizuj |
|------|------|-----------------|------------|
| `INSTRUCTIONS.md` | 📜 Konstytucja - zasady pracy | ✅ Przed pierwszą akcją | Gdy zmieniają się zasady |
| `INDEX.md` | 🗺️ Mapa - stan projektu, drzewo plików | ✅ Start sesji | Po zmianie struktury |
| `SESSION.md` | 📓 Dziennik - co robiono, TODO | ✅ Start sesji | 🚨 ZAWSZE na koniec sesji |
| `MODULES.md` | 🧩 Tech docs - szczegóły komponentów | Gdy potrzebujesz | Po modyfikacji modułów |

**Kolejność czytania:** `INSTRUCTIONS` → `INDEX` → `SESSION` → (opcjonalnie) `MODULES`

---

## 1. Kontekst projektu

**Typ projektu:** Aplikacja WWW (Next.js) z interaktywną grafiką 3D (Three.js) i Computer Vision (MediaPipe).

**Krótki opis:** Aplikacja "Motion Particles" (Aether), która umożliwia sterowanie systemem cząsteczek w czasie rzeczywistym za pomocą gestów dłoni wykrywanych przez kamerę internetową. Projekt ma charakter artystycznego dema technologicznego (creative coding).

---

## 2. Źródła prawdy (priorytetowe)

| Priorytet | Źródło | Opis |
|-----------|--------|------|
| 0 | **Użytkownik** | Bezpośrednie instrukcje i wymagania |
| 1 | `rag/INDEX.md` | Aktualny stan i struktura projektu |
| 2 | `codebase` | Kod źródłowy (stan faktyczny) |
| 3 | `rag/MODULES.md` | Dokumentacja techniczna modułów |

---

## 3. Założenia architektoniczne

- **Next.js App Router:** Główne ramy aplikacji.
- **Three.js:** Rendering cząsteczek (WebGL) na pełnym ekranie.
- **MediaPipe Hand Landmarker:** Detekcja dłoni w przeglądarce (Client-side).
- **Zustand:** Zarządzanie stanem (pozycja dłoni, gesty, FPS).
- **Styling:** Inline styles + CSS Modules (unikanie Tailwind tam gdzie powoduje konflikty z canvas).
- **Responsive:** Pełna obsługa mobile (dvh, touch fallback).

---

## 4. Cel nadrzędny

**Minimalny koszt tokenów + szybki onboarding nowego asystenta.**

Po powrocie do projektu w nowym oknie kontekstowym asystent ma:
- zrozumieć aktualny stan projektu w 1–2 minuty
- nie czytać całego repo
- nie zgadywać

---

## 5. Zasady pracy asystenta

1. **Zanim zaczniesz cokolwiek robić:**
   - przeczytaj `rag/INDEX.md`
   - sprawdź `rag/SESSION.md`

2. **Nie skanuj całego repo "na wszelki wypadek":**
   - wybieraj 1–3 najbardziej prawdopodobne pliki
   - kieruj się INDEX i SESSION

3. **Po każdej istotnej zmianie:**
   - aktualizuj `rag/INDEX.md` (stan, drzewo, decyzje)
   - aktualizuj `rag/SESSION.md` (co zrobiono)

4. **Brak informacji ≠ zgadywanie:**
   - przedstaw max 2 interpretacje
   - wybierz najbardziej prawdopodobną

---

## 6. Procedury sesji

### 6.1 START SESJI (komenda: "Start sesji")

1. Przeczytaj `rag/SESSION.md` - co było robione
2. Przeczytaj `rag/INDEX.md` - stan projektu
3. Zgłoś gotowość użytkownikowi:
   - ✅ Sesja rozpoczęta
   - 📋 Podsumowanie ostatniej sesji
   - 📌 Opcje do rozważenia
   - 🚀 Czekam na decyzję

### 6.2 KONIEC SESJI (komenda: "Kończę sesję")

1. Zaktualizuj `rag/SESSION.md`:
   - Data sesji
   - Co zostało zrobione
   - Next steps
   - Problemy (jeśli były)

2. Zaktualizuj `rag/INDEX.md` jeśli potrzeba:
   - Nowe pliki → drzewo
   - Nowe decyzje → sekcja decyzji
   - Zmiana stanu → tabela statusów

3. Podsumowanie dla użytkownika:
   - ✅ Co zrobiliśmy
   - 📁 Zmienione pliki
   - 🎯 Co zostało do zrobienia

---

## 7. 🚨 KRYTYCZNA ZASADA: Aktualizacja RAG

> **ZAWSZE przy końcu sesji lub update aktualizuj pliki w `rag/`!**

Katalog `rag/` to **jedyne źródło pamięci projektu** między sesjami.
Nowy asystent NIE MA dostępu do poprzednich rozmów - zna tylko to, co jest w `rag/`.

**Kiedy aktualizować:**
- ✅ Komenda "Kończę sesję"
- ✅ Po każdej znaczącej zmianie
- ✅ Gdy użytkownik prosi o update

**KONSEKWENCJA NIEDOPEŁNIENIA:** Następna sesja zacznie od nieaktualnych danych!

---

## 8. Zasada nadrzędna

**Najpierw dokumentacja, potem kod.**
**Najpierw rag/, potem czytanie plików.**

Jeśli nie wiesz, gdzie jesteś, wróć do `rag/INDEX.md`.
