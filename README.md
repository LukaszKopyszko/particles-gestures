# AETHER KINETIC - Motion Particles

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.2.0-purple.svg)

**Aether Kinetic** is an interactive web experience that blends creative coding with computer vision. It uses your webcam to detect hand gestures in real-time and lets you manipulate a complex particle system (5000+ interactive points) directly in your browser.

> **Privacy Focus:** All video processing happens locally on your device using MediaPipe. No video data is ever sent to the cloud.

---

## ✨ Features

- **Advanced Particle Engine**: Custom Three.js renderer handling 5000+ particles with physics simulations (flow, attraction, explosion).
- **Real-time Hand Tracking**: Powered by Google's MediaPipe Hand Landmarker for low-latency detection.
- **Gesture Control**: Use hand signs to trigger visuals:
  - ✋ **Flow**: Move particles with your hand (Energy Field).
  - ✊ **Fist**: Change color palette + Warmth effect.
  - 👌 **Perfect**: Special "Perfect" mode interaction.
  - 👍 **Thumbs Up**: visual feedback "NICE!".
  - 🖕 **Middle Finger**: Explosive particle dispersion (Red flash).
- **Responsive Design**: optimized for Desktop and Mobile (using `dvh` units), works on iOS/Android.
- **Glassmorphism UI**: Modern, clean overlay interface with real-time FPS and status monitoring.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **3D Engine**: [Three.js](https://threejs.org/) (GLSL Shaders)
- **Computer Vision**: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: Inline Styles / CSS Modules (Engine-optimized)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Webcam

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/LukaszKopyszko/particles-gestures.git
   cd particles-gestures/app-content
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 How to Use

1. **Grant Permission**: Click "Start Experience" and allow camera access when prompted.
2. **Move Hand**: The particles will follow your hand movement like a fluid.
3. **Gestures**:
   | Gesture | Reaction | Visual |
   |---------|----------|--------|
   | **Fist** ✊ | Pallete Swap | Particles glow warmer and change color theme. |
   | **Thumb Up** 👍 | Validation | "NICE!" message overlay. |
   | **OK Sign** 👌 | Special | "Perfect" visual mode. |
   | **Middle** 🖕 | Explosion | Particles explode outward violently in red. |

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx            # Main entry (FullScreen canvas)
│   └── globals.css         # Global resets & mobile dvh fixes
├── components/
│   ├── SceneRoot.tsx       # Core orchestrator (Vision + Scene + UI)
│   ├── IntroOverlay.tsx    # Welcome screen
│   ├── CameraPreviewOverlay.tsx # Local webcam mirror
│   └── HUD.tsx             # UI Overlay (FPS, Legend)
├── lib/
│   ├── scene/              # Three.js logic & Shaders
│   └── vision/             # MediaPipe logic & Gesture Classification
└── state/                  # Global Zustand store
```

## 🧠 Documentation (RAG)

This project maintains its own active documentation context for AI agents in the `rag/` directory:
- `rag/INDEX.md`: Current project status and file map.
- `rag/MODULES.md`: Technical details of algorithms.
- `rag/INSTRUCTIONS.md`: Rules for AI contributors.

---

## 📄 License

This project is licensed under the MIT License.