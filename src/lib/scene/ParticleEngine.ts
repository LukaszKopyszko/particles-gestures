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
    handVx: number;
    handVy: number;
    isFist: boolean;
    isMiddle: boolean;
    aspect: number;
    colorPaletteIndex: number;
    explosionStrength: number;
    visualMode: 'kinetic' | 'galaxy' | 'fire' | 'rain';
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
                uFist: { value: 0 },
                uExplosion: { value: 0 },
                uMode: { value: 0 }, // 0=Kinetic, 1=Galaxy, 2=Fire, 3=Rain
                uColor1: { value: new THREE.Color(PALETTES[0][0]) },
                uColor2: { value: new THREE.Color(PALETTES[0][1]) },
                uNextColor1: { value: new THREE.Color(PALETTES[0][0]) },
                uNextColor2: { value: new THREE.Color(PALETTES[0][1]) },
                uBlend: { value: 0 },
                uAspect: { value: window.innerWidth / window.innerHeight }
            },
            vertexShader: `
        uniform float uTime;
        uniform vec2 uHand;
        uniform float uFist;
        uniform float uExplosion;
        uniform float uMode;
        uniform float uAspect;
        attribute vec2 aRandom;
        varying float vAlpha;
        varying float vExplosion;
        
        vec2 rotate(vec2 v, float a) {
            float s = sin(a); float c = cos(a);
            return mat2(c, -s, s, c) * v;
        }

        void main() {
          vec3 pos = position;
          
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

          // --- FIRE ---
          float riseSpeed = 30.0 + aRandom.y * 20.0;
          float yFire = mod(uTime * riseSpeed + aRandom.x * 1000.0, 250.0) - 125.0;
          vec3 firePos = vec3(pos.x + sin(uTime * 1.5 + yFire * 0.05) * 10.0, yFire, pos.z);

          // --- RAIN ---
          float fallSpeed = 50.0 + aRandom.y * 40.0;
          float yRain = 125.0 - mod(uTime * fallSpeed + aRandom.x * 1000.0, 250.0);
          vec3 rainPos = vec3(pos.x + sin(uTime * 0.5) * 10.0, yRain, pos.z);

          // --- BRANCHLESS MODE MAPPING ---
          float mG = clamp(1.0 - abs(uMode - 1.0), 0.0, 1.0);
          float mF = clamp(1.0 - abs(uMode - 2.0), 0.0, 1.0);
          float mR = clamp(uMode - 2.0, 0.0, 1.0);
          float mK = clamp(1.0 - uMode, 0.0, 1.0);

          vec3 finalPos = kineticPos * mK + galaxyPos * mG + firePos * mF + rainPos * mR;

          // --- HAND INFLUENCE ---
          vec2 handWorld = (uHand - 0.5) * vec2(350.0 * uAspect, 220.0);
          vec2 delta = handWorld - finalPos.xy;
          float dist = length(delta);
          float pull = smoothstep(120.0, 0.0, dist);
          
          // Influence based on mode (using steps instead of ifs)
          float isGalaxy = step(0.5, mG);
          float isFire = step(0.5, mF);
          float isRain = step(0.5, mR);
          float isKinetic = step(0.5, mK);

          // Kinetic: Attraction
          finalPos.xy += delta * pull * 0.12 * isKinetic * (1.0 - uFist * 0.5);
          // Galaxy: Gravity
          finalPos.xy += normalize(delta + 0.001) * pull * 1.5 * isGalaxy;
          // Fire: Repel
          finalPos.xy -= normalize(delta + 0.001) * pull * 2.0 * isFire;
          // Rain: Umbrella
          float rainBounce = step(dist, 40.0) * step(handWorld.y, finalPos.y);
          finalPos.xy -= normalize(delta + 0.001) * (40.0 - dist) * 0.5 * rainBounce * isRain;
          finalPos.y += 2.0 * rainBounce * isRain;

          // Fist & Explosion
          finalPos.xy -= normalize(delta + 0.001) * pull * uFist * 12.0;
          
          vec2 toCenter = finalPos.xy;
          finalPos.xy += normalize(toCenter + 0.001) * uExplosion * 80.0 * (1.0 + aRandom.x);
          finalPos.z += (aRandom.y - 0.5) * uExplosion * 40.0;

          vec4 mv = modelViewMatrix * vec4(finalPos, 1.0);
          float baseSize = mix(8.0, 5.0, isGalaxy) + uExplosion * 4.0;
          gl_PointSize = max(2.0, baseSize * (100.0 / -mv.z));
          gl_Position = projectionMatrix * mv;

          vAlpha = 0.6 + pull * 0.4 + uExplosion * 0.3;
          vExplosion = uExplosion;
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
        varying float vAlpha;
        varying float vExplosion;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          
          float glow = pow(1.0 - d * 2.0, 1.2);
          
          // Rain mode: sharper drops
          if (uMode > 2.5) {
             glow = pow(1.0 - d * 2.0, 0.5); 
          }
          
          vec3 c1 = mix(uColor1, uColor2, glow);
          vec3 c2 = mix(uNextColor1, uNextColor2, glow);
          vec3 color = mix(c1, c2, uBlend);
          
          color *= 1.3;
          color += vec3(0.25, 0.12, 0.0) * uFist * glow;
          color = mix(color, vec3(1.0, 0.3, 0.1), vExplosion * 0.85);
          
          float alpha = glow * vAlpha * 1.2;
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

        // Smooth hand
        this.smoothX += (state.handX - this.smoothX) * 0.15;
        this.smoothY += (state.handY - this.smoothY) * 0.15;
        this.material.uniforms.uHand.value.set(this.smoothX, 1 - this.smoothY);

        // Smooth fist
        this.smoothFist += ((state.isFist ? 1 : 0) - this.smoothFist) * 0.12;
        this.material.uniforms.uFist.value = this.smoothFist;

        // Explosion
        this.material.uniforms.uExplosion.value = state.explosionStrength;

        // Mode Interpolation
        switch (state.visualMode) {
            case 'galaxy': this.targetModeValue = 1.0; break;
            case 'fire': this.targetModeValue = 2.0; break;
            case 'rain': this.targetModeValue = 3.0; break;
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
