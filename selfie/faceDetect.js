// Face detection adapter.
//
// WHY THIS EXISTS: Expo removed `expo-face-detector` in SDK 52. Rather than
// pin you to one library, everything funnels through `detectFace()` which
// returns a normalized shape. Wire in whichever detector your SDK has —
// and if you have none, colors still work (geometry is simply skipped).
//
// Normalized face:
//   { bounds:{x,y,width,height}, leftEye?, rightEye?, noseBase?, mouth?,
//     smilingProbability?, eyeOpenProbability? }
// All coordinates are in PIXELS of the image you pass to analyzeSelfie().

let impl = null;

/** Plug your detector in once at app start (see the three recipes below). */
export function setFaceDetector(fn) { impl = fn; }

export async function detectFace(uri, imageSize) {
  if (!impl) return null;
  try { return await impl(uri, imageSize); } catch { return null; }
}

/** Center-box fallback: assume a roughly centered head. Colors still work. */
export function centeredFallback({ width, height }) {
  const w = width * 0.62;
  const h = w / 0.82;
  return {
    bounds: { x: (width - w) / 2, y: Math.max(0, height * 0.5 - h / 2), width: w, height: h },
    approximate: true,
  };
}

// ---------------------------------------------------------------------------
// RECIPE A — expo-face-detector (Expo SDK <= 51)
//
//   import * as FaceDetector from 'expo-face-detector';
//   setFaceDetector(async (uri) => {
//     const { faces } = await FaceDetector.detectFacesAsync(uri, {
//       mode: FaceDetector.FaceDetectorMode.accurate,
//       detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
//       runClassifications: FaceDetector.FaceDetectorClassifications.all,
//     });
//     if (!faces.length) return null;
//     const f = faces.sort((a, b) => b.bounds.size.width - a.bounds.size.width)[0];
//     return {
//       bounds: { x: f.bounds.origin.x, y: f.bounds.origin.y,
//                 width: f.bounds.size.width, height: f.bounds.size.height },
//       leftEye: f.leftEyePosition, rightEye: f.rightEyePosition,
//       noseBase: f.noseBasePosition, mouth: f.bottomMouthPosition,
//       smilingProbability: f.smilingProbability,
//       eyeOpenProbability: Math.min(f.leftEyeOpenProbability ?? 1,
//                                    f.rightEyeOpenProbability ?? 1),
//     };
//   });
//
// RECIPE B — react-native-vision-camera + vision-camera-face-detector (SDK 52+)
//
//   import { detectFaces } from 'react-native-vision-camera-face-detector';
//   setFaceDetector(async (uri) => {
//     const faces = await detectFaces(uri, { landmarkMode: 'all', classificationMode: 'all' });
//     if (!faces.length) return null;
//     const f = faces[0];
//     return {
//       bounds: f.bounds,
//       leftEye: f.landmarks?.LEFT_EYE, rightEye: f.landmarks?.RIGHT_EYE,
//       noseBase: f.landmarks?.NOSE_BASE, mouth: f.landmarks?.MOUTH_BOTTOM,
//       smilingProbability: f.smilingProbability,
//     };
//   });
//
// RECIPE C — none installed
//   Do nothing. detectFace() returns null, the screen uses centeredFallback(),
//   and the user gets colors + a manual face-shape step. Still useful.
// ---------------------------------------------------------------------------
