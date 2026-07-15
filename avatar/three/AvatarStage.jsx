// The single GL surface for the avatar. Orbit with one finger, pinch to
// zoom, named camera framings (full / bust / head / face) with spring
// transitions, "Beam" key light, gradient backdrop from the recipe's
// background item. Exposes an imperative api via ref:
//   ref.current.setFraming('face')
//   ref.current.playEmote('wave')
//   ref.current.setExpression('grin')
//   await ref.current.snapshot() -> { uri, width, height }
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef,
} from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { buildAvatar } from './buildAvatar';

const FRAMINGS = {
  full: { target: [0, 0.92, 0], dist: 3.3, fov: 32 },
  bust: { target: [0, 1.45, 0], dist: 1.9, fov: 30 },
  head: { target: [0, 1.72, 0], dist: 1.05, fov: 28 },
  face: { target: [0, 1.7, 0], dist: 0.9, fov: 26 },
};

function bgColors(recipe, catalogIndex) {
  const item = recipe && recipe.background ? catalogIndex.get(recipe.background) : null;
  const c = item && Array.isArray(item.colorways) && item.colorways[0];
  return {
    top: (c && c.primary) || '#141826',
    bottom: (c && c.secondary) || '#0B0D14',
  };
}

const AvatarStage = forwardRef(function AvatarStage(
  { recipe, catalogIndex = new Map(), framing = 'full', autoRotate = true, style },
  ref,
) {
  const state = useRef({
    gl: null, renderer: null, scene: null, camera: null,
    avatar: null, backdrop: null, floor: null,
    yaw: 0, yawVel: 0, dist: FRAMINGS[framing].dist, distTarget: FRAMINGS[framing].dist,
    framing: FRAMINGS[framing], lastTouch: 0, raf: 0, running: false,
    glViewRef: null, clock: new THREE.Clock(),
  }).current;

  const recipeRef = useRef(recipe);
  recipeRef.current = recipe;
  const indexRef = useRef(catalogIndex);
  indexRef.current = catalogIndex;

  // ---- rebuild the avatar whenever the recipe changes ----------------------
  const rebuild = useCallback(() => {
    const s = state;
    if (!s.scene || !recipeRef.current) return;
    if (s.avatar) {
      s.scene.remove(s.avatar.group);
      s.avatar.dispose();
      s.avatar = null;
    }
    s.avatar = buildAvatar(recipeRef.current, indexRef.current);
    s.scene.add(s.avatar.group);

    const { top, bottom } = bgColors(recipeRef.current, indexRef.current);
    if (s.scene.background) s.scene.background.set(bottom);
    if (s.backdrop) s.backdrop.material.color.set(top);
    if (s.floor) s.floor.material.color.set(top);
  }, [state]);

  useEffect(() => { rebuild(); }, [recipe, catalogIndex, rebuild]);

  useEffect(() => {
    state.framing = FRAMINGS[framing] || FRAMINGS.full;
    state.distTarget = state.framing.dist;
  }, [framing, state]);

  useEffect(() => () => { // unmount: stop loop + free GPU memory
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.avatar) state.avatar.dispose();
    if (state.renderer) state.renderer.dispose();
  }, [state]);

  // ---- gestures: 1-finger orbit, 2-finger pinch zoom ------------------------
  const pinchStart = useRef(0);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      state.lastTouch = Date.now();
      const t = evt.nativeEvent.touches;
      if (t.length === 2) pinchStart.current = Math.hypot(
        t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY,
      );
    },
    onPanResponderMove: (evt, g) => {
      state.lastTouch = Date.now();
      const t = evt.nativeEvent.touches;
      if (t.length === 2) {
        const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        if (pinchStart.current > 0) {
          state.distTarget = Math.min(4.4, Math.max(0.7,
            state.distTarget * (pinchStart.current / d)));
          pinchStart.current = d;
        }
      } else {
        state.yawVel = g.vx * 0.9;
        state.yaw += g.dx * 0.00045 * 16; // gentle direct drag
      }
    },
    onPanResponderRelease: () => { pinchStart.current = 0; },
  })).current;

  // ---- GL setup ---------------------------------------------------------------
  const onContextCreate = useCallback((gl) => {
    const s = state;
    s.gl = gl;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const renderer = new Renderer({ gl, antialias: true });
    renderer.setSize(width, height);
    s.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0B0D14');
    s.scene = scene;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 30);
    s.camera = camera;

    // Projector Noir lighting: the Beam (violet key), cyan rim, soft fill
    scene.add(new THREE.AmbientLight('#6E7699', 0.55));
    const beam = new THREE.SpotLight('#B7A8FF', 950, 14, Math.PI / 5, 0.5, 2);
    beam.position.set(-1.6, 3.4, 2.2);
    scene.add(beam);
    const rim = new THREE.DirectionalLight('#35E0D0', 0.7);
    rim.position.set(1.6, 2.0, -2.4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight('#DDE6FF', 0.5);
    fill.position.set(0.8, 1.2, 2.6);
    scene.add(fill);

    // backdrop plane + floor disc take the background item's colors
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshBasicMaterial({ color: '#141826' }),
    );
    backdrop.position.set(0, 2.4, -4.5);
    scene.add(backdrop);
    s.backdrop = backdrop;

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 48),
      new THREE.MeshStandardMaterial({ color: '#141826', roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    scene.add(floor);
    s.floor = floor;

    rebuild();
    s.clock.start();
    s.running = true;

    const loop = () => {
      if (!s.running) return;
      s.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, s.clock.getDelta());
      const t = s.clock.elapsedTime;

      // idle autorotate after 2.5 s of no touch
      if (autoRotate && Date.now() - s.lastTouch > 2500) s.yaw += dt * 0.25;
      s.yaw += s.yawVel; s.yawVel *= 0.9;

      if (s.avatar) {
        s.avatar.group.rotation.y = s.yaw;
        s.avatar.update(t, dt);
      }

      // spring the camera toward the current framing
      s.dist += (s.distTarget - s.dist) * Math.min(1, dt * 7);
      const f = s.framing;
      const ty = f.target[1];
      camera.position.set(0, ty + 0.12, s.dist);
      camera.lookAt(f.target[0], ty, f.target[2]);
      camera.fov += (f.fov - camera.fov) * Math.min(1, dt * 7);
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    loop();
  }, [state, autoRotate, rebuild]);

  // ---- imperative api ------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    setFraming(name) {
      state.framing = FRAMINGS[name] || FRAMINGS.full;
      state.distTarget = state.framing.dist;
    },
    setYaw(y) { state.yaw = y; state.yawVel = 0; },
    playEmote(name) { if (state.avatar) state.avatar.playEmote(name); },
    setExpression(id) { if (state.avatar) state.avatar.setExpression(id); },
    async snapshot() {
      if (!state.glViewRef) return null;
      return state.glViewRef.takeSnapshotAsync({ format: 'png', compress: 1 });
    },
  }), [state]);

  return (
    <View style={[styles.wrap, style]} {...pan.panHandlers}>
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
        ref={(r) => { state.glViewRef = r; }}
        msaaSamples={4}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#0B0D14' },
});

export default AvatarStage;
