/**
 * META
 * @file: src/lib/scene/ParticleEngine.ts
 * @role: service (rendering engine)
 * @does: Manages Three.js scene, camera, and custom shader particles system.
 * @depends_on: Three.js
 * @used_by: SceneRoot.tsx
 */
import * as THREE from 'three';

export interface ParticleSystemState {
    handX: number;
    handY: number;
    hand2X: number;
    hand2Y: number;
    handVx: number;
    handVy: number;
    isFist: boolean;
    isMiddle: boolean;
    aspect: number;
    colorPaletteIndex: number;
    explosionStrength: number;
    visualMode: 'kinetic' | 'galaxy' | 'fire' | 'rain' | 'vortex' | 'spectrum';
    audioIntensity: number; // 0.0 - 1.0 from FFT
    energyLevel: number;
    isAudioReactive: boolean;
}

const PALETTES = [
    [0x1a4c8a, 0x40b0ff], // Cyan
    [0x8a2020, 0xff6040], // Ember
    [0x1a8a4c, 0x60ff90], // Lime
    [0x6a1a8a, 0xc060ff], // Violet
    [0x8a6a1a, 0xffcc40], // Gold
];

export class ParticleEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private material: THREE.ShaderMaterial;
    private particles: THREE.Points;
    private time = 0;

    private smoothX = 0.5;
    private smoothY = 0.5;
    private smooth2X = 0.5;
    private smooth2Y = 0.5;
    private smoothFist = 0;
    private currentPalette = 0;
    private blendProgress = 0;

    // Smooth transition for visual mode (0=kinetic, 1=galaxy, etc)
    private currentModeValue = 0;
    private targetModeValue = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 400);
        this.camera.position.z = 150;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x050510);

        // Detect mobile to optimize particle count
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const count = isMobile ? 3500 : 8000;

        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 2);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 350;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 220;
            positions[i * 3 + 2] = Math.random() * 100 - 50;
            randoms[i * 2] = Math.random();
            randoms[i * 2 + 1] = Math.random();
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 2));

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uHand: { value: new THREE.Vector2(0.5, 0.5) },
                uHand2: { value: new THREE.Vector2(0.5, 0.5) },
                uFist: { value: 0 },
                uExplosion: { value: 0 },
                uEnergy: { value: 0 },
                uAudioReactive: { value: 1.0 },
                uMode: { value: 0 }, // 0=K, 1=G, 2=F, 3=R, 4=V, 5=S
                uColor1: { value: new THREE.Color(PALETTES[0][0]) },
                uColor2: { value: new THREE.Color(PALETTES[0][1]) },
                uNextColor1: { value: new THREE.Color(PALETTES[0][0]) },
                uNextColor2: { value: new THREE.Color(PALETTES[0][1]) },
                uBlend: { value: 0 },
                uAudio: { value: 0 },
                uAspect: { value: window.innerWidth / window.innerHeight }
            },
            vertexShader: `
        uniform float uTime;
        uniform vec2 uHand;
        uniform vec2 uHand2;
        uniform float uFist;
          uniform float uExplosion;
          uniform float uEnergy;
          uniform float uAudioReactive;
          uniform float uMode;
        uniform float uAudio;
        uniform float uAspect;
        attribute vec2 aRandom;
        varying float vAlpha;
        varying float vExplosion;
        varying float vAudio;
        varying float vFireLife;
        varying float vIsFire;
        varying float vEnergy;
        
        vec2 rotate(vec2 v, float a) {
            float s = sin(a); float c = cos(a);
            return mat2(c, -s, s, c) * v;
        }

        void main() {
          vec3 pos = position;
          
          float mG = clamp(1.0 - abs(uMode - 1.0), 0.0, 1.0);
          float mF = clamp(1.0 - abs(uMode - 2.0), 0.0, 1.0);
          float mR = clamp(1.0 - abs(uMode - 3.0), 0.0, 1.0);
          float mV = clamp(1.0 - abs(uMode - 4.0), 0.0, 1.0);
          float mS = clamp(uMode - 4.0, 0.0, 1.0); // Spectrum
          float mK = clamp(1.0 - uMode, 0.0, 1.0);
          
          float audioIntensity = uAudio * uAudioReactive;
          
          vIsFire = step(0.5, mF);
          vEnergy = uEnergy;

          // --- KINETIC ---
          vec3 kineticPos = pos;
          kineticPos.x += sin(uTime * 0.2 + aRandom.x * 6.28) * 4.0;
          kineticPos.y += cos(uTime * 0.15 + aRandom.y * 6.28) * 3.0;
          kineticPos.z += sin(uTime * 0.1 + pos.x * 0.01) * 2.0;

          // --- GALAXY ---
          float distCenter = length(pos.xy);
          float spiralAngle = uTime * 0.2 + (500.0 / (distCenter + 10.0)) + aRandom.x * 6.0;
          vec2 rotGalaxy = rotate(pos.xy, spiralAngle * 0.5);
          vec3 galaxyPos = vec3(rotGalaxy, sin(spiralAngle) * 3.0);
          galaxyPos.xy *= (1.0 + audioIntensity * 0.15);

          // --- FIRE ---
          float riseSpeed = 40.0 + aRandom.y * 30.0;
          float yFire = mod(uTime * riseSpeed + aRandom.x * 1000.0, 250.0) - 125.0;
          float fireLife = (yFire + 125.0) / 250.0;
          vFireLife = fireLife;
          float fireSway = sin(uTime * 2.0 + yFire * 0.04 + aRandom.x * 5.0) * (20.0 * fireLife);
          vec3 firePos = vec3(pos.x * (0.4 + fireLife * 0.6) + fireSway, yFire, pos.z * 0.5);
          firePos.y += audioIntensity * 30.0 * fireLife;

          // --- RAIN ---
          float fallSpeed = 50.0 + aRandom.y * 40.0;
          float yRain = 125.0 - mod(uTime * fallSpeed + aRandom.x * 1000.0, 250.0);
          vec3 rainPos = vec3(pos.x + sin(uTime * 0.5) * 10.0, yRain, pos.z);

          // --- VORTEX ---
          float vX = pos.x * (0.8 + 0.2 * sin(uTime + aRandom.x * 6.28));
          float vY = pos.y;
          float vZ = pos.z;
          float vSpiral = uTime * 3.0 + (vY * 0.05) + aRandom.x * 6.28;
          vec2 vRot = rotate(vec2(vX, vZ), vSpiral);
          vec3 vortexPos = vec3(vRot.x, vY, vRot.y);

          // --- SPECTRUM ---
          float sAngle = aRandom.x * 6.28;
          float sRadius = 40.0 + audioIntensity * 60.0 * aRandom.y;
          vec3 spectrumPos = vec3(cos(sAngle) * sRadius, sin(sAngle) * sRadius, (aRandom.y - 0.5) * 20.0);
          spectrumPos.x += sin(uTime + sAngle) * 5.0;

          vec3 finalPos = kineticPos * mK + galaxyPos * mG + firePos * mF + rainPos * mR + vortexPos * mV + spectrumPos * mS;

          // --- HAND INFLUENCE (BOTH HANDS) ---
          vec2 world1 = (uHand - 0.5) * vec2(350.0 * uAspect, 220.0);
          vec2 world2 = (uHand2 - 0.5) * vec2(350.0 * uAspect, 220.0);
          
          vec2 delta1 = world1 - finalPos.xy;
          vec2 delta2 = world2 - finalPos.xy;
          float dist1 = length(delta1);
          float dist2 = length(delta2);
          
          float pull1 = smoothstep(120.0, 0.0, dist1);
          float pull2 = smoothstep(120.0, 0.0, dist2);
          float pull = max(pull1, pull2);
          
          // Interactions based on mode
          float isGalaxy = step(0.5, mG);
          float isFire = vIsFire;
          float isRain = step(0.5, mR);
          float isKinetic = step(0.5, mK);
          float isVortex = step(0.5, mV);
          float isSpectrum = step(0.5, mS);

          // Hand 1
          finalPos.xy += delta1 * pull1 * 0.12 * isKinetic * (1.0 - uFist * 0.5);
          finalPos.xy += normalize(delta1 + 0.001) * pull1 * (1.5 + uAudio * 2.0) * isGalaxy;
          finalPos.xy -= normalize(delta1 + 0.001) * pull1 * 2.0 * isFire;
          
          // Hand 2
          finalPos.xy += delta2 * pull2 * 0.12 * isKinetic * (1.0 - uFist * 0.5);
          finalPos.xy += normalize(delta2 + 0.001) * pull2 * (1.5 + uAudio * 2.0) * isGalaxy;
          finalPos.xy -= normalize(delta2 + 0.001) * pull2 * 2.0 * isFire;

          // Rain bounce
          float rb1 = step(dist1, 40.0) * step(world1.y, finalPos.y);
          float rb2 = step(dist2, 40.0) * step(world2.y, finalPos.y);
          finalPos.xy -= normalize(delta1 + 0.001) * (40.0 - dist1) * 0.5 * rb1 * isRain;
          finalPos.xy -= normalize(delta2 + 0.001) * (40.0 - dist2) * 0.5 * rb2 * isRain;
          finalPos.y += 2.0 * (rb1 + rb2) * isRain;
          
          // Vortex attraction
          finalPos.xy += normalize(delta1 + 0.001) * pull1 * 5.0 * isVortex;
          finalPos.xy += normalize(delta2 + 0.001) * pull2 * 5.0 * isVortex;
          
          // Spectrum following hands
          finalPos.xy += delta1 * pull1 * 0.8 * isSpectrum;
          finalPos.xy += delta2 * pull2 * 0.8 * isSpectrum;

          // Energy Charge (Energy pulls everything in)
          float energyPull = uEnergy * pull * 15.0;
          finalPos.xy += normalize(delta1 + 0.001) * energyPull * pull1;
          finalPos.xy += normalize(delta2 + 0.001) * energyPull * pull2;

          // Fist & Explosion
          finalPos.xy -= (normalize(delta1 + 0.001) * pull1 + normalize(delta2 + 0.001) * pull2) * uFist * 12.0;
          
          vec2 toCenter = finalPos.xy;
          finalPos.xy += normalize(toCenter + 0.001) * uExplosion * 80.0 * (1.0 + aRandom.x);
          finalPos.z += (aRandom.y - 0.5) * uExplosion * 40.0;

          vec4 mv = modelViewMatrix * vec4(finalPos, 1.0);
          
          float fireSize = mix(12.0, 2.0, fireLife);
          float baseSize = mix(8.0, 5.0, isGalaxy);
          baseSize = mix(baseSize, fireSize, isFire);
          baseSize = mix(baseSize, 4.0, isVortex);
          baseSize = mix(baseSize, 7.0, isSpectrum);
          baseSize += uExplosion * 4.0 + audioIntensity * 6.0 + uEnergy * 8.0;
          
          gl_PointSize = max(2.0, baseSize * (100.0 / -mv.z));
          gl_Position = projectionMatrix * mv;

          vAlpha = (0.6 + pull * 0.4 + uExplosion * 0.3 + uAudio * 0.2 + uEnergy * 0.5) * mix(1.0, 1.0 - fireLife, isFire);
          vExplosion = uExplosion;
          vAudio = uAudio;
        }
      `,
            fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uNextColor1;
        uniform vec3 uNextColor2;
        uniform float uBlend;
        uniform float uFist;
        uniform float uExplosion;
        uniform float uMode;
        uniform float uAudio;
        uniform float uEnergy;
        varying float vAlpha;
        varying float vExplosion;
        varying float vAudio;
        varying float vFireLife;
        varying float vIsFire;
        varying float vEnergy;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          
          float glow = pow(1.0 - d * 2.0, 1.2);
          
          // Rain mode: sharper drops
          if (uMode > 2.5 && uMode < 3.5) {
             glow = pow(1.0 - d * 2.0, 0.5); 
          }
          
          vec3 c1 = mix(uColor1, uColor2, glow);
          vec3 c2 = mix(uNextColor1, uNextColor2, glow);
          vec3 baseColor = mix(c1, c2, uBlend);
          
          // --- FIRE COLOR LOGIC (Vibrant Flames) ---
          vec3 fireColor = mix(vec3(1.2, 1.1, 0.6), vec3(1.0, 0.5, 0.0), smoothstep(0.0, 0.3, vFireLife));
          fireColor = mix(fireColor, vec3(1.0, 0.2, 0.0), smoothstep(0.3, 0.7, vFireLife));
          fireColor = mix(fireColor, vec3(0.4, 0.05, 0.0), smoothstep(0.7, 1.0, vFireLife));
          
          vec3 color = mix(baseColor, fireColor, vIsFire);
          
          // Energy color (Electric White/Blue)
          color = mix(color, vec3(0.8, 0.9, 1.0), vEnergy * glow);

          color *= (1.3 + vAudio * 0.5);
          color += vec3(0.25, 0.12, 0.0) * uFist * glow;
          color = mix(color, vec3(1.0, 0.3, 0.1), vExplosion * 0.85);
          
          float alpha = glow * vAlpha * (vIsFire > 0.5 ? 2.5 : 1.5);
          gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, this.material);
        this.scene.add(this.particles);
    }

    resize(w: number, h: number) {
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.material.uniforms.uAspect.value = w / h;
    }

    update(dt: number, state: ParticleSystemState) {
        this.time += dt;
        this.material.uniforms.uTime.value = this.time;

        // Audio Reactivity
        this.material.uniforms.uAudio.value = state.audioIntensity;

        // Energy level
        this.material.uniforms.uEnergy.value = state.energyLevel;

        // Smooth hand 1
        this.smoothX += (state.handX - this.smoothX) * 0.15;
        this.smoothY += (state.handY - this.smoothY) * 0.15;
        this.material.uniforms.uHand.value.set(this.smoothX, 1 - this.smoothY);

        // Audio Reactive State
        this.material.uniforms.uAudioReactive.value = state.isAudioReactive ? 1.0 : 0.0;

        // Smooth hand 2
        this.smooth2X += (state.hand2X - this.smooth2X) * 0.15;
        this.smooth2Y += (state.hand2Y - this.smooth2Y) * 0.15;
        this.material.uniforms.uHand2.value.set(this.smooth2X, 1 - this.smooth2Y);

        // Mode Interpolation
        switch (state.visualMode) {
            case 'galaxy': this.targetModeValue = 1.0; break;
            case 'fire': this.targetModeValue = 2.0; break;
            case 'rain': this.targetModeValue = 3.0; break;
            case 'vortex': this.targetModeValue = 4.0; break;
            case 'spectrum': this.targetModeValue = 5.0; break;
            default: this.targetModeValue = 0.0; break; // kinetic
        }

        // Smoothly transition mode value
        const modeDiff = this.targetModeValue - this.currentModeValue;
        if (Math.abs(modeDiff) > 0.01) {
            this.currentModeValue += modeDiff * dt * 2.0; // 0.5s transition
        } else {
            this.currentModeValue = this.targetModeValue;
        }
        this.material.uniforms.uMode.value = this.currentModeValue;


        // Color transition
        const target = state.colorPaletteIndex % PALETTES.length;
        if (target !== this.currentPalette) {
            this.material.uniforms.uNextColor1.value.setHex(PALETTES[target][0]);
            this.material.uniforms.uNextColor2.value.setHex(PALETTES[target][1]);
            this.blendProgress += dt * 3;
            this.material.uniforms.uBlend.value = Math.min(1, this.blendProgress);

            if (this.blendProgress >= 1) {
                this.currentPalette = target;
                this.blendProgress = 0;
                this.material.uniforms.uColor1.value.setHex(PALETTES[target][0]);
                this.material.uniforms.uColor2.value.setHex(PALETTES[target][1]);
                this.material.uniforms.uBlend.value = 0;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.renderer.dispose();
        this.particles.geometry.dispose();
        (this.particles.material as THREE.Material).dispose();
    }
}
