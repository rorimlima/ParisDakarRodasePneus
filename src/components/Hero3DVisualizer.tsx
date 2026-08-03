import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Play, Pause, Sun, Sparkles, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { WheelFinish, TireType } from '../types';

interface Hero3DVisualizerProps {
  onConsultWhatsApp: (details: string) => void;
  onExploreCatalog: () => void;
}

export const Hero3DVisualizer: React.FC<Hero3DVisualizerProps> = ({
  onConsultWhatsApp,
  onExploreCatalog
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [selectedFinish, setSelectedFinish] = useState<WheelFinish>('Preto Fosco');
  const [selectedTread, setSelectedTread] = useState<TireType>('MT');
  const [rimSize, setRimSize] = useState<number>(17);
  const [activeTab, setActiveTab] = useState<'3d' | 'specs'>('3d');

  // Scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const wheelMeshGroupRef = useRef<THREE.Group | null>(null);
  const wheelMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const beadlockMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2.8, 1.2, 3.8);
    camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b0000, 1.5); // Burgundy rim highlight accent
    dirLight2.position.set(-5, -2, -4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.8, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 5. Build Procedural 3D Wheel & Off-Road Tire Assembly
    const wheelGroup = new THREE.Group();
    wheelMeshGroupRef.current = wheelGroup;

    // --- Wheel Materials ---
    const getFinishColor = (finish: WheelFinish) => {
      switch (finish) {
        case 'Bronze Off-Road': return { color: 0xB8860B, metalness: 0.85, roughness: 0.25 };
        case 'Grafite Acetinado': return { color: 0x3A3D40, metalness: 0.9, roughness: 0.3 };
        case 'Cromo Satinado': return { color: 0xD0D5DD, metalness: 0.95, roughness: 0.15 };
        case 'Vermelho Dakar Accent': return { color: 0x8B0000, metalness: 0.8, roughness: 0.2 };
        case 'Preto Fosco':
        default:
          return { color: 0x1A1B1E, metalness: 0.8, roughness: 0.4 };
      }
    };

    const finishProps = getFinishColor(selectedFinish);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: finishProps.color,
      metalness: finishProps.metalness,
      roughness: finishProps.roughness,
    });
    wheelMaterialRef.current = wheelMaterial;

    const beadlockMaterial = new THREE.MeshStandardMaterial({
      color: selectedFinish === 'Vermelho Dakar Accent' ? 0x111111 : 0x8B0000,
      metalness: 0.9,
      roughness: 0.2,
    });
    beadlockMaterialRef.current = beadlockMaterial;

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x121315,
      roughness: 0.85,
      metalness: 0.05,
    });

    const brakeMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.2,
    });

    const caliperMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      metalness: 0.7,
      roughness: 0.3,
    });

    // --- A. Brake Disc & Caliper ---
    const discGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 32);
    const discMesh = new THREE.Mesh(discGeo, brakeMaterial);
    discMesh.rotation.x = Math.PI / 2;
    discMesh.position.z = -0.15;
    wheelGroup.add(discMesh);

    const caliperGeo = new THREE.BoxGeometry(0.35, 0.45, 0.25);
    const caliperMesh = new THREE.Mesh(caliperGeo, caliperMaterial);
    caliperMesh.position.set(0.65, 0.4, -0.1);
    wheelGroup.add(caliperMesh);

    // --- B. Tire Outer Doughnut ---
    const outerRadius = 1.65;
    const innerRadius = 1.0;
    const tireGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, 0.8, 48);
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.rotation.x = Math.PI / 2;
    wheelGroup.add(tireMesh);

    // --- C. Tire Tread Lug Blocks (MT / AT Off-Road Lugs) ---
    const lugCount = selectedTread === 'MT' ? 28 : 36;
    const lugGeo = new THREE.BoxGeometry(selectedTread === 'MT' ? 0.18 : 0.12, 0.84, 0.08);
    for (let i = 0; i < lugCount; i++) {
      const angle = (i / lugCount) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, tireMaterial);
      lug.position.x = Math.cos(angle) * (outerRadius + 0.03);
      lug.position.y = Math.sin(angle) * (outerRadius + 0.03);
      lug.rotation.z = angle;
      lug.rotation.x = Math.PI / 2;
      wheelGroup.add(lug);
    }

    // --- D. Main Rim Barrel & Lip ---
    const rimGeo = new THREE.CylinderGeometry(innerRadius, innerRadius - 0.1, 0.75, 40);
    const rimMesh = new THREE.Mesh(rimGeo, wheelMaterial);
    rimMesh.rotation.x = Math.PI / 2;
    wheelGroup.add(rimMesh);

    // Outer Beadlock Ring
    const beadlockRingGeo = new THREE.TorusGeometry(innerRadius + 0.02, 0.05, 12, 48);
    const beadlockRing = new THREE.Mesh(beadlockRingGeo, beadlockMaterial);
    beadlockRing.position.z = 0.38;
    wheelGroup.add(beadlockRing);

    // Beadlock Ring Bolts
    const boltGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.95 });
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.x = Math.cos(angle) * (innerRadius + 0.02);
      bolt.position.y = Math.sin(angle) * (innerRadius + 0.02);
      bolt.position.z = 0.40;
      bolt.rotation.x = Math.PI / 2;
      wheelGroup.add(bolt);
    }

    // --- E. Wheel Center Cap & Heavy Duty Spokes (6-Spoke Off-Road Pattern) ---
    const centerCapGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24);
    const centerCap = new THREE.Mesh(centerCapGeo, wheelMaterial);
    centerCap.rotation.x = Math.PI / 2;
    centerCap.position.z = 0.35;
    wheelGroup.add(centerCap);

    // Spokes
    const spokeCount = 6;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spokeGroup = new THREE.Group();

      const spokeGeo = new THREE.BoxGeometry(0.2, innerRadius - 0.28, 0.12);
      const spoke = new THREE.Mesh(spokeGeo, wheelMaterial);
      spoke.position.y = (innerRadius + 0.2) / 2;
      spoke.position.z = 0.28;

      spokeGroup.add(spoke);
      spokeGroup.rotation.z = angle;
      wheelGroup.add(spokeGroup);
    }

    // --- F. Ground Shadow Plane ---
    const planeGeo = new THREE.PlaneGeometry(10, 10);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
    shadowPlane.position.y = -1.75;
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    scene.add(wheelGroup);

    // 6. Mouse Drag Interaction
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !wheelGroup) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;

      wheelGroup.rotation.y += deltaX * 0.008;
      wheelGroup.rotation.x += deltaY * 0.008;

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating && !isDragging && wheelGroup) {
        wheelGroup.rotation.y += 0.008;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [selectedFinish, selectedTread, rimSize, isRotating]);

  // Handle finish change
  const handleFinishChange = (finish: WheelFinish) => {
    setSelectedFinish(finish);
    if (wheelMaterialRef.current) {
      let color = 0x1A1B1E;
      let metalness = 0.8;
      let roughness = 0.4;
      if (finish === 'Bronze Off-Road') { color = 0xB8860B; metalness = 0.85; roughness = 0.25; }
      else if (finish === 'Grafite Acetinado') { color = 0x3A3D40; metalness = 0.9; roughness = 0.3; }
      else if (finish === 'Cromo Satinado') { color = 0xD0D5DD; metalness = 0.95; roughness = 0.15; }
      else if (finish === 'Vermelho Dakar Accent') { color = 0x8B0000; metalness = 0.8; roughness = 0.2; }

      wheelMaterialRef.current.color.setHex(color);
      wheelMaterialRef.current.metalness = metalness;
      wheelMaterialRef.current.roughness = roughness;
    }
  };

  return (
    <section className="relative overflow-hidden bg-carbon text-white py-12 md:py-20 border-b border-zinc-800">
      {/* Decorative Brand Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-950/25 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Typography & Conversion Copy */}
          <div className="lg:col-span-5 space-y-6 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-[11px] font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulador 3D Interativo 360º</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight font-heading">
              Paris Dakar <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-amber-400 font-semibold">
                Rodas &amp; Pneus para Caminhonetes 4x4
              </span>
            </h1>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-normal">
              Consulte e configure conjuntos de rodas forjadas, pneus Mud-Terrain / All-Terrain e kits de elevação de suspensão para caminhonetes 4x4.
            </p>

            {/* Quick Specs Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-center">
                <p className="text-xs text-zinc-400">Garantia</p>
                <p className="font-bold text-white text-sm">5 Anos</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-center">
                <p className="text-xs text-zinc-400">Resistência</p>
                <p className="font-bold text-white text-sm">Forged T6</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-center">
                <p className="text-xs text-zinc-400">Atendimento</p>
                <p className="font-bold text-emerald-400 text-sm">WhatsApp</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => onConsultWhatsApp('Olá! Gostaria de consultar um conjunto de rodas e pneus configurado no Simulador 3D.')}
                className="btn-paris flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm tracking-wide shadow-lg uppercase"
              >
                <span>Consultar no WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreCatalog}
                className="px-6 py-3.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold text-sm border border-zinc-700 transition flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Explorar Catálogo
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Suporte técnico de furação, offset e compatibilidade para pickups e SUVs 4x4.</span>
            </div>
          </div>

          {/* Right Column: 3D Visualizer Canvas & Controls */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-2xl bg-zinc-950/80 border border-zinc-800 p-2 sm:p-4 shadow-2xl backdrop-blur-sm">
              
              {/* Header Bar inside 3D Box */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 text-xs">
                <div className="flex items-center gap-2 text-zinc-300 font-mono">
                  <Rotate3d className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>VISUALIZADOR 3D // DAKAR SPEC</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRotating(!isRotating)}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                    title={isRotating ? "Pausar Rotação" : "Girar 360º"}
                  >
                    {isRotating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded font-semibold border border-red-800/40">
                    Arraste para Girar
                  </span>
                </div>
              </div>

              {/* Three.js Canvas Container */}
              <div
                ref={mountRef}
                className="w-full h-[320px] sm:h-[420px] cursor-grab active:cursor-grabbing relative flex items-center justify-center overflow-hidden"
              />

              {/* Interactive Controls Overlay */}
              <div className="mt-2 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-3">
                
                {/* Finish Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Acabamento da Roda: <span className="text-white font-bold">{selectedFinish}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Preto Fosco', 'Bronze Off-Road', 'Grafite Acetinado', 'Cromo Satinado', 'Vermelho Dakar Accent'] as WheelFinish[]).map((finish) => (
                      <button
                        key={finish}
                        onClick={() => handleFinishChange(finish)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                          selectedFinish === finish
                            ? 'bg-red-900/60 border-red-500 text-white font-bold shadow-sm'
                            : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tread & Size Selectors */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800/60">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Banda do Pneu
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTread('MT')}
                        className={`flex-1 text-xs py-1 rounded border font-medium ${
                          selectedTread === 'MT' ? 'bg-red-800 text-white border-red-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        Mud Terrain (MT)
                      </button>
                      <button
                        onClick={() => setSelectedTread('AT')}
                        className={`flex-1 text-xs py-1 rounded border font-medium ${
                          selectedTread === 'AT' ? 'bg-red-800 text-white border-red-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        All Terrain (AT)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Diâmetro do Aro
                    </label>
                    <div className="flex gap-2">
                      {[17, 18, 20].map((size) => (
                        <button
                          key={size}
                          onClick={() => setRimSize(size)}
                          className={`flex-1 text-xs py-1 rounded border font-bold ${
                            rimSize === size ? 'bg-amber-600 text-white border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          Aro {size}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
