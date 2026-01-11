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

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 400);
        this.camera.position.z = 150;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x050510);

        const count = 5000;
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
        uniform float uAspect;
        attribute vec2 aRandom;
        varying float vAlpha;
        varying float vExplosion;

        void main() {
          vec3 pos = position;
          
          // Slow organic drift
          pos.x += sin(uTime * 0.2 + aRandom.x * 6.28) * 4.0;
          pos.y += cos(uTime * 0.15 + aRandom.y * 6.28) * 3.0;
          pos.z += sin(uTime * 0.1 + pos.x * 0.01) * 2.0;
          
          // Hand influence
          vec2 handWorld = (uHand - 0.5) * vec2(350.0 * uAspect, 220.0);
          vec2 delta = handWorld - pos.xy;
          float dist = length(delta);
          float pull = smoothstep(120.0, 0.0, dist);
          
          // Attract towards hand
          pos.xy += delta * pull * 0.12 * (1.0 - uFist * 0.5);
          
          // Fist = ripple outward
          if (uFist > 0.1) {
            pos.xy -= normalize(delta + 0.001) * pull * uFist * 12.0;
          }
          
          // EXPLOSION - push everything outward from center!
          if (uExplosion > 0.01) {
            vec2 toCenter = pos.xy;
            float centerDist = length(toCenter);
            vec2 explosionDir = normalize(toCenter + vec2(0.001, 0.001));
            
            // Strong outward push
            float explosionForce = uExplosion * 80.0 * (1.0 + aRandom.x * 0.5);
            pos.xy += explosionDir * explosionForce;
            pos.z += (aRandom.y - 0.5) * uExplosion * 40.0;
          }

          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          
          float baseSize = 5.0 + uExplosion * 3.0;
          gl_PointSize = max(2.0, baseSize * (100.0 / -mv.z));
          gl_Position = projectionMatrix * mv;

          vAlpha = 0.4 + pull * 0.6 + uExplosion * 0.4;
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
        varying float vAlpha;
        varying float vExplosion;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          
          float glow = pow(1.0 - d * 2.0, 1.5);
          
          vec3 c1 = mix(uColor1, uColor2, glow);
          vec3 c2 = mix(uNextColor1, uNextColor2, glow);
          vec3 color = mix(c1, c2, uBlend);
          
          // Fist warmth
          color += vec3(0.2, 0.1, 0.0) * uFist * glow;
          
          // Explosion = RED flash
          color = mix(color, vec3(1.0, 0.2, 0.1), vExplosion * 0.8);
          
          gl_FragColor = vec4(color, glow * vAlpha);
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
