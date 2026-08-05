'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Alert, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import {
  RotateRight as ResetIcon,
  AspectRatio as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface GlbViewerProps {
  src: string;
  autoRotate?: boolean;
  height?: string | number;
}

interface ViewerState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  animationId: number | null;
  autoRotate: boolean;
  model: THREE.Object3D | null;
  grid: THREE.GridHelper;
}

export default function GlbViewer({
  src,
  autoRotate: initialAutoRotate = true,
  height,
}: GlbViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stateRef = useRef<ViewerState | null>(null);

  const resetCamera = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const target = s.model ?? s.scene;
    const bounds = new THREE.Box3().setFromObject(target);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());

    const radius = Math.max(sphere.radius, 0.001);
    const fov = s.camera.fov * (Math.PI / 180);
    const distance = (radius / Math.sin(fov / 2)) * 1.15;

    s.camera.position.set(
      sphere.center.x + distance * 0.7,
      sphere.center.y + distance * 0.45,
      sphere.center.z + distance
    );
    s.camera.near = Math.max(radius / 100, 0.001);
    s.camera.far = Math.max(radius * 100, 100);
    s.camera.updateProjectionMatrix();
    s.controls.target.copy(sphere.center);
    s.controls.update();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    // Three does NOT attach the canvas automatically — without this nothing renders.
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.001, 100);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8899bb, 0.7);
    fillLight.position.set(-3, 1, -3);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.autoRotate = initialAutoRotate;
    controls.autoRotateSpeed = 2.0;

    const grid = new THREE.GridHelper(2, 20, 0x8c8c8c, 0x4a4a4a);
    scene.add(grid);

    const state: ViewerState = {
      renderer,
      scene,
      camera,
      controls,
      animationId: null,
      autoRotate: initialAutoRotate,
      model: null,
      grid,
    };
    stateRef.current = state;

    const setSize = () => {
      const w = container.clientWidth || 100;
      const h = container.clientHeight || 100;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();

    const loader = new GLTFLoader();
    let disposed = false;
    let resourcesDisposed = false;

    loader.load(
      src,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;

        // Center the model over the grid and rest its base on y=0
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -center.y + size.y / 2, -center.z);

        scene.add(model);
        state.model = model;

        // Size the grid to the model and place it as a floor
        const radius = Math.max(size.length() / 2, 0.5);
        state.grid.scale.set(radius, radius, radius);
        state.grid.position.y = 0;

        resetCamera();
        setLoading(false);
      },
      undefined,
      (err) => {
        if (disposed) return;
        console.error('GLB load error', err);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    );

    const animate = () => {
      const s = stateRef.current;
      if (!s) return;
      s.controls.autoRotate = s.autoRotate;
      s.controls.update();
      s.renderer.render(s.scene, s.camera);
      s.animationId = requestAnimationFrame(animate);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => setSize());
    resizeObserver.observe(container);

    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      disposed = true;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      resizeObserver.disconnect();
      if (state.animationId) cancelAnimationFrame(state.animationId);
      renderer.setAnimationLoop(null);
      stateRef.current = null;
      controls.dispose();
      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if ((mesh as THREE.Mesh).isMesh) {
          mesh.geometry?.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      if (!resourcesDisposed) {
        envTexture.dispose();
        pmrem.dispose();
        resourcesDisposed = true;
      }
      renderer.dispose();
      // Detach only the canvas we own. Never clear container.innerHTML — React
      // manages the overlay children and will error if we remove them first.
      renderer.domElement.remove();
    };
    // autoRotate toggles mutate stateRef directly, so it's intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, resetCamera]);

  useEffect(() => {
    if (stateRef.current) stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: height ?? '100%',
        minHeight: 300,
        bgcolor: 'background.default',
        borderRadius: 1,
        overflow: 'hidden',
        ...(isFullscreen && { height: '100dvh' }),
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: 'background.default',
            zIndex: 1,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="caption" color="text.secondary">
            Loading 3D model...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ position: 'absolute', inset: 0, alignItems: 'center', zIndex: 1 }}>
          {error}
        </Alert>
      )}

      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 2,
          display: { xs: 'none', md: 'flex' },
        }}
      >
        <Tooltip title={autoRotate ? 'Stop rotating' : 'Auto-rotate'}>
          <IconButton
            size="small"
            onClick={() => setAutoRotate((v) => !v)}
            sx={{
              bgcolor: 'background.paper',
              color: autoRotate ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <span role="img" aria-label="rotate" style={{ fontSize: 18 }}>⟳</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset view">
          <IconButton
            size="small"
            onClick={resetCamera}
            sx={{ bgcolor: 'background.paper', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <ResetIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          <IconButton
            size="small"
            onClick={toggleFullscreen}
            sx={{ bgcolor: 'background.paper', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}