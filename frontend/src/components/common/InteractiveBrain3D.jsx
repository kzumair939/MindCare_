import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive 3D Neural Brain Visualizer
 * Built with WebGL / Three.js
 * Features:
 * - Dual-hemisphere parametric cortical structure
 * - Glowing neural particle nodes
 * - Synaptic axon connection network
 * - Real-time action potential firing pulses
 * - Scroll-synced 3D rotation, tilt, and depth transitions
 * - Mouse parallax reactivity
 * - Therapeutic modality lobe highlighting
 */
export default function InteractiveBrain3D({ activeMode = "all", className = "", style = {} }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 85;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Brain Main Group
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // Color definitions
    const colorCyan = new THREE.Color("#38bdf8");
    const colorIndigo = new THREE.Color("#818cf8");
    const colorPurple = new THREE.Color("#c084fc");
    const colorEmerald = new THREE.Color("#34d399");
    const colorAmber = new THREE.Color("#fbbf24");

    // 4. Generate Procedural Dual-Hemisphere Brain Points
    const nodeCountPerHemisphere = 900;
    const allPositions = [];
    const allColors = [];
    const nodes = [];

    // Mathematical formula for anatomical brain shape
    function generateHemisphere(sign) {
      for (let i = 0; i < nodeCountPerHemisphere; i++) {
        const u = Math.random() * Math.PI;
        const v = Math.random() * Math.PI * 2;

        // Base ellipsoid
        const a = 19; // X radius
        const b = 25; // Y radius (front-to-back)
        const c = 18; // Z radius (height)

        let x = a * Math.sin(u) * Math.cos(v);
        let y = b * Math.sin(u) * Math.sin(v);
        let z = c * Math.cos(u);

        // Cortical folds & sulci modulation using spherical harmonics
        const foldFrequency = 6.0;
        const foldNoise = Math.sin(x * 0.3) * Math.cos(y * 0.3) * Math.sin(z * 0.3) * 2.8;
        const gyriWave = Math.sin(foldFrequency * u) * Math.cos(foldFrequency * v) * 1.5;

        // Longitudinal fissure gap separation
        x = (Math.abs(x) + 2.2 + foldNoise * 0.4) * sign;
        y = y + foldNoise * 0.5 + gyriWave * 0.3;
        z = z + foldNoise * 0.5;

        // Flatten ventral bottom base
        if (z < -8) {
          z = z * 0.7 - 2;
          x = x * 0.85;
        }

        // Prefrontal frontal lobe protrusion
        if (y > 10) {
          y += Math.sin(u) * 2.5;
        }

        // Cerebellum lower posterior cluster
        if (y < -12 && z < -3) {
          z -= 2.5;
          x *= 0.9;
        }

        allPositions.push(x, y, z);
        nodes.push(new THREE.Vector3(x, y, z));

        // Color gradient by anatomical region
        let pointColor = colorCyan.clone();
        if (y > 8) {
          // Frontal / Prefrontal
          pointColor.lerp(colorPurple, 0.7);
        } else if (z > 5) {
          // Parietal / Sensory
          pointColor.lerp(colorIndigo, 0.8);
        } else if (y < -8 && z < 0) {
          // Occipital / Visual
          pointColor.lerp(colorEmerald, 0.6);
        } else {
          // Temporal / Limbic
          pointColor.lerp(colorCyan, 0.9);
        }

        allColors.push(pointColor.r, pointColor.g, pointColor.b);
      }
    }

    generateHemisphere(1);  // Right hemisphere
    generateHemisphere(-1); // Left hemisphere

    // 5. Brain Node Point Cloud (Particles)
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(allPositions, 3));
    pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(allColors, 3));

    // Custom Canvas Texture for glowing circular particles
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const ctx = particleCanvas.getContext("2d");
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(99, 102, 241, 0.8)");
    gradient.addColorStop(0.7, "rgba(56, 189, 248, 0.3)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const pointsMaterial = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);
    brainGroup.add(pointCloud);

    // 6. Synaptic Axon Network (Connecting Lines)
    const linePositions = [];
    const lineColors = [];
    const connections = [];
    const maxConnectionDistance = 5.2;

    for (let i = 0; i < nodes.length; i++) {
      let connectionsCount = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        // Prevent bridging across hemispheres unless close to corpus callosum
        if (Math.sign(nodes[i].x) !== Math.sign(nodes[j].x) && Math.abs(nodes[i].x) > 3.5) {
          continue;
        }

        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < maxConnectionDistance && connectionsCount < 3) {
          linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z);
          linePositions.push(nodes[j].x, nodes[j].y, nodes[j].z);

          const alpha = (1 - dist / maxConnectionDistance) * 0.45;
          lineColors.push(0.35 * alpha, 0.55 * alpha, 0.95 * alpha);
          lineColors.push(0.35 * alpha, 0.55 * alpha, 0.95 * alpha);

          connections.push({ from: nodes[i], to: nodes[j], dist });
          connectionsCount++;
        }
      }
    }

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    brainGroup.add(linesMesh);

    // 7. Action Potential Synaptic Pulses (Fast traveling neural signals)
    const pulseCount = 75;
    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulseColors = new Float32Array(pulseCount * 3);
    const pulseData = [];

    for (let p = 0; p < pulseCount; p++) {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      pulseData.push({
        conn,
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.015,
        color: Math.random() > 0.4 ? colorCyan : (Math.random() > 0.5 ? colorAmber : colorEmerald)
      });
    }

    const pulseGeometry = new THREE.BufferGeometry();
    pulseGeometry.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));
    pulseGeometry.setAttribute("color", new THREE.BufferAttribute(pulseColors, 3));

    const pulseMaterial = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const pulsePoints = new THREE.Points(pulseGeometry, pulseMaterial);
    brainGroup.add(pulsePoints);

    // 8. Core Inner Glowing Limbic Aura
    const coreSphereGeo = new THREE.SphereGeometry(7, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      wireframe: true
    });
    const coreMesh = new THREE.Mesh(coreSphereGeo, coreMat);
    coreMesh.position.set(0, -1, 0);
    brainGroup.add(coreMesh);

    // 9. Floating Ambient Space Particles
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount * 3; s += 3) {
      starPositions[s] = (Math.random() - 0.5) * 140;
      starPositions[s + 1] = (Math.random() - 0.5) * 140;
      starPositions[s + 2] = (Math.random() - 0.5) * 140;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.0,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 10. Scroll & Mouse Tracking State
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0.0;
    let targetRotationZ = 0.0;
    let targetPositionY = 0;
    let targetScale = 1.0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseX = ((clientX / width) - 0.5) * 0.8;
      mouseY = ((clientY / height) - 0.5) * 0.8;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1000);
      const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      // Interpolate angles across landing sections
      // 0.0 (Hero) -> 0.25 (AI Diagnostic) -> 0.50 (Features/Modalities) -> 0.75 (How it Works) -> 1.0 (CTA)
      if (scrollProgress < 0.2) {
        // Hero: Slightly tilted forward, frontal prefrontal focus
        const p = scrollProgress / 0.2;
        targetRotationX = 0.25 + p * 0.3;
        targetRotationY = p * 1.2;
        targetRotationZ = p * 0.15;
        targetPositionY = p * 2.0;
        targetScale = 1.05;
      } else if (scrollProgress < 0.5) {
        // AI Diagnostic: Side angled view, deep limbic examination
        const p = (scrollProgress - 0.2) / 0.3;
        targetRotationX = 0.55 - p * 0.2;
        targetRotationY = 1.2 + p * 1.8;
        targetRotationZ = 0.15 - p * 0.2;
        targetPositionY = 2.0 - p * 1.5;
        targetScale = 1.1;
      } else if (scrollProgress < 0.8) {
        // Features: Top-down neuroplasticity view
        const p = (scrollProgress - 0.5) / 0.3;
        targetRotationX = 0.35 + p * 0.6;
        targetRotationY = 3.0 + p * 1.5;
        targetRotationZ = -0.05 + p * 0.3;
        targetPositionY = 0.5 - p * 2.0;
        targetScale = 1.0;
      } else {
        // Final CTA: Direct centered frontal serene view
        const p = (scrollProgress - 0.8) / 0.2;
        targetRotationX = 0.95 - p * 0.75;
        targetRotationY = 4.5 + p * 1.78; // full 360 loop
        targetRotationZ = 0.25 - p * 0.25;
        targetPositionY = -1.5 + p * 1.5;
        targetScale = 1.15;
      }
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);

    // Initial trigger
    handleScroll();

    // 11. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Continuous subtle ambient breathing rotation
      const idleFloatY = Math.sin(time * 1.2) * 0.8;
      const idleFloatRot = Math.sin(time * 0.8) * 0.05;

      // Smooth damping (lerp) toward scroll & mouse targets
      brainGroup.rotation.x += (targetRotationX + mouseY + idleFloatRot - brainGroup.rotation.x) * 0.06;
      brainGroup.rotation.y += (targetRotationY + mouseX + (time * 0.04) - brainGroup.rotation.y) * 0.06;
      brainGroup.rotation.z += (targetRotationZ - brainGroup.rotation.z) * 0.06;
      brainGroup.position.y += (targetPositionY + idleFloatY - brainGroup.position.y) * 0.06;

      const currentScale = brainGroup.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.05;
      brainGroup.scale.set(newScale, newScale, newScale);

      // Rotate background stars slowly
      starMesh.rotation.y = time * 0.02;
      starMesh.rotation.x = time * 0.01;

      // Pulse core limbic sphere breathing
      coreMesh.scale.setScalar(1 + Math.sin(time * 2.5) * 0.12);

      // Update Action Potential Pulses
      const pulsePosAttr = pulseGeometry.attributes.position;
      const pulseColAttr = pulseGeometry.attributes.color;

      for (let i = 0; i < pulseData.length; i++) {
        const p = pulseData[i];
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          p.progress = 0.0;
          p.conn = connections[Math.floor(Math.random() * connections.length)];
        }

        if (p.conn) {
          const px = p.conn.from.x + (p.conn.to.x - p.conn.from.x) * p.progress;
          const py = p.conn.from.y + (p.conn.to.y - p.conn.from.y) * p.progress;
          const pz = p.conn.from.z + (p.conn.to.z - p.conn.from.z) * p.progress;

          pulsePosAttr.setXYZ(i, px, py, pz);
          pulseColAttr.setXYZ(i, p.color.r, p.color.g, p.color.b);
        }
      }

      pulsePosAttr.needsUpdate = true;
      pulseColAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Three.js objects to prevent GPU memory leaks
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      pulseGeometry.dispose();
      pulseMaterial.dispose();
      coreSphereGeo.dispose();
      coreMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`mc-3d-brain-canvas-wrap ${className}`}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "420px",
        position: "relative",
        overflow: "hidden",
        pointerEvents: "auto",
        ...style
      }}
    />
  );
}
