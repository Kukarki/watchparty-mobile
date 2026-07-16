// Photo -> RGBA pixels, on device. No upload, no network.
//
//   npx expo install expo-image-manipulator
//   npm i jpeg-js
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { decode as atob } from 'base-64';

const WORK_WIDTH = 320;   // plenty for color sampling; keeps decode ~instant

/**
 * Downscale the selfie and decode it to raw pixels.
 * @returns {{ pixels: Uint8Array, width: number, height: number, scale: number }}
 */
export async function loadPixels(uri, originalWidth) {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: WORK_WIDTH } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  const bin = atob(out.base64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

  const raw = jpeg.decode(buf, { useTArray: true });   // RGBA
  return {
    pixels: raw.data,
    width: raw.width,
    height: raw.height,
    scale: raw.width / (originalWidth || raw.width),   // map landmark coords
  };
}

/** Scale a detector's face (in original-image pixels) into working pixels. */
export function scaleFace(face, scale) {
  if (!face) return null;
  const s = (p) => (p ? { x: p.x * scale, y: p.y * scale } : undefined);
  return {
    ...face,
    bounds: {
      x: face.bounds.x * scale, y: face.bounds.y * scale,
      width: face.bounds.width * scale, height: face.bounds.height * scale,
    },
    leftEye: s(face.leftEye), rightEye: s(face.rightEye),
    noseBase: s(face.noseBase), mouth: s(face.mouth),
  };
}
