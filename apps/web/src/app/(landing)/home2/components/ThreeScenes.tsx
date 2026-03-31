"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   SHARED PRIMITIVES
   ============================================================ */

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const green = new THREE.Color("#22c55e");
    const emerald = new THREE.Color("#10b981");
    const lime = new THREE.Color("#84cc16");
    const palette = [green, emerald, lime];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.015;
    pointsRef.current.rotation.x += delta * 0.008;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function FloatingSphere({ position, scale, speed, index }: { position: [number, number, number]; scale: number; speed: number; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001 * speed + index * 1.3) * 0.4;
    meshRef.current.rotation.y += 0.01;
    if (glowRef.current) {
      const pulse = 1.3 + Math.sin(Date.now() * 0.002 + index) * 0.2;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[scale * 1.8, 16, 16]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} transparent opacity={0.08} />
      </mesh>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[scale, 24, 24]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#22c55e" emissiveIntensity={0.6} metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

function FloatingAvatarSpheres() {
  const groupRef = useRef<THREE.Group>(null);

  const spheres = useMemo(() => {
    const count = 8;
    const result: { pos: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      result.push({
        pos: [Math.cos(angle) * radius, (Math.random() - 0.5) * 3, Math.sin(angle) * radius],
        scale: 0.15 + Math.random() * 0.25,
        speed: 0.5 + Math.random() * 1,
      });
    }
    return result;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;
  });

  return (
    <group ref={groupRef}>
      {spheres.map((s, i) => (
        <FloatingSphere key={i} position={s.pos} scale={s.scale} speed={s.speed} index={i} />
      ))}
    </group>
  );
}

function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.2;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.15;
    if (ring3Ref.current) ring3Ref.current.rotation.x += delta * 0.1;
  });

  return (
    <>
      <mesh ref={ring1Ref} rotation={[1.2, 0.3, 0]}>
        <torusGeometry args={[3.5, 0.012, 8, 100]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} transparent opacity={0.25} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0.8, -0.5, 0.3]}>
        <torusGeometry args={[4, 0.01, 8, 100]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={1.5} transparent opacity={0.15} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0.3, 0.8, -0.2]}>
        <torusGeometry args={[4.5, 0.008, 8, 100]} />
        <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={1} transparent opacity={0.1} />
      </mesh>
    </>
  );
}

function DataStreams() {
  const groupRef = useRef<THREE.Group>(null);

  const streams = useMemo(() => {
    const result: THREE.TubeGeometry[] = [];
    for (let i = 0; i < 10; i++) {
      const pts: THREE.Vector3[] = [];
      const sx = (Math.random() - 0.5) * 8;
      const sy = (Math.random() - 0.5) * 6;
      const sz = (Math.random() - 0.5) * 4 - 3;
      for (let j = 0; j < 20; j++) {
        pts.push(new THREE.Vector3(
          sx + j * 0.2,
          sy + Math.sin(j * 0.5 + i) * 0.4,
          sz + Math.cos(j * 0.3 + i) * 0.3
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      result.push(new THREE.TubeGeometry(curve, 40, 0.008, 4, false));
    }
    return result;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.02;
  });

  const palette = ["#22c55e", "#4ade80", "#86efac", "#16a34a"];

  return (
    <group ref={groupRef}>
      {streams.map((geom, i) => (
        <mesh key={i} geometry={geom}>
          <meshStandardMaterial color={palette[i % 4]} emissive={palette[i % 4]} emissiveIntensity={1.5} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);

  const { tubes, spheres } = useMemo(() => {
    const pts1: THREE.Vector3[] = [];
    const pts2: THREE.Vector3[] = [];
    const sphereData: { pos: THREE.Vector3; color: string }[] = [];
    const segments = 60;
    const height = 8;

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const y = t * height - height / 2;
      const angle = t * Math.PI * 4;
      const r = 1.2;
      pts1.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      pts2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r));

      if (i % 4 === 0) {
        sphereData.push({ pos: pts1[pts1.length - 1].clone(), color: "#22c55e" });
        sphereData.push({ pos: pts2[pts2.length - 1].clone(), color: "#16a34a" });
      }
    }

    const curve1 = new THREE.CatmullRomCurve3(pts1);
    const curve2 = new THREE.CatmullRomCurve3(pts2);
    const tube1 = new THREE.TubeGeometry(curve1, 80, 0.03, 6, false);
    const tube2 = new THREE.TubeGeometry(curve2, 80, 0.03, 6, false);

    return { tubes: [tube1, tube2], spheres: sphereData };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={groupRef}>
      {tubes.map((geom, i) => (
        <mesh key={i} geometry={geom}>
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} transparent opacity={0.5} />
        </mesh>
      ))}
      {spheres.map((s, i) => (
        <mesh key={`s-${i}`} position={s.pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function PipelineNode({ position, index }: { position: THREE.Vector3; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const colors = ["#22c55e", "#4ade80", "#16a34a"];

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.z = Math.sin(Date.now() * 0.002 + index) * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.03;
      const pulse = 1 + Math.sin(Date.now() * 0.003 + index * 1.2) * 0.1;
      ringRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.02, 8, 32]} />
        <meshStandardMaterial color={colors[index]} emissive={colors[index]} emissiveIntensity={2} transparent opacity={0.3} />
      </mesh>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={colors[index]} emissive={colors[index]} emissiveIntensity={1} metalness={0.9} roughness={0.1} />
      </mesh>
      <pointLight intensity={0.4} distance={2} color={colors[index]} />
    </group>
  );
}

function PipelineFlow() {
  const groupRef = useRef<THREE.Group>(null);
  const positions = useMemo(() => [
    new THREE.Vector3(-3, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(3, 0, 0),
  ], []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(Date.now() * 0.0004) * 0.2;
  });

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <PipelineNode key={i} position={pos} index={i} />
      ))}
      {[0, 1].map(i => {
        const curve = new THREE.CatmullRomCurve3([
          positions[i],
          new THREE.Vector3((positions[i].x + positions[i + 1].x) / 2, 0.5, 0),
          positions[i + 1],
        ]);
        const geom = new THREE.TubeGeometry(curve, 20, 0.02, 6, false);
        return (
          <mesh key={`tube-${i}`} geometry={geom}>
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} transparent opacity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================
   EXPORTED SCENE COMPONENTS
   ============================================================ */

export function HeroScene() {
  return (
    <div className="absolute inset-0" style={{ zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["transparent"]} />
        <fog attach="fog" args={["#050505", 6, 22]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.6} color="#22c55e" />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="#16a34a" />
        <pointLight position={[0, 3, -3]} intensity={0.2} color="#4ade80" />
        <ParticleField />
        <FloatingAvatarSpheres />
        <OrbitalRings />
        <DataStreams />
      </Canvas>
    </div>
  );
}

export function FeaturesScene() {
  return (
    <div className="absolute inset-0 opacity-30">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={0.5} color="#22c55e" />
        <DNAHelix />
      </Canvas>
    </div>
  );
}

export function StepsScene() {
  return (
    <div className="absolute inset-0 opacity-20">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 3, 5]} intensity={0.5} color="#22c55e" />
        <PipelineFlow />
      </Canvas>
    </div>
  );
}
