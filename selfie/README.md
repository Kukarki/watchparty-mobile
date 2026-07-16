# Selfie → Avatar

Take one selfie; the app reads **skin tone, hair color, eye color** and
**face shape, eye style, brows, nose, expression**, then pre-fills the avatar
recipe. Every guess lands on a review screen where the user can change it.

Everything runs **on device**. The photo is never uploaded and never stored —
only the picked values (`s06`, `c_ink`, `f2`…) are kept.

```
npx expo install expo-camera expo-image-manipulator
npm i jpeg-js base-64
```

## Wire it up

```jsx
import { SelfieAvatarScreen } from './selfie';
import { useAvatarStore, AvatarStage } from './avatar';

const { draft, catalogIndex, setPart } = useAvatarStore();

<SelfieAvatarScreen
  draft={draft}
  catalogIndex={catalogIndex}
  AvatarPreview={({ recipe }) => (
    <AvatarStage recipe={recipe} catalogIndex={catalogIndex} framing="face" autoRotate={false} />
  )}
  onApply={(patch) => Object.entries(patch).forEach(([k, v]) => setPart(k, v))}
  onClose={() => router.back()}
/>
```

`patch` is a flat map of recipe paths → values:
```js
{ 'body.skin': 's06', 'hair.color': 'c_ink', 'face.eyes.color': 'c_umber',
  'face.shape': 'f2', 'face.eyes.id': 'e1', 'face.brows': 'br2',
  'face.nose': 'n2', 'face.expression': 'grin' }
```
Add a "Use a selfie" button in QuickCreate and in the Studio's FACE tab.

## Face detection (read this)

Expo **removed `expo-face-detector` in SDK 52**, so this ships an adapter
instead of a hard dependency. Register whichever detector you have, once at
app start:

```js
import { setFaceDetector } from './selfie';
setFaceDetector(async (uri) => { /* return normalized face */ });
```

`faceDetect.js` contains copy-paste recipes for:
- **A** — `expo-face-detector` (SDK ≤ 51)
- **B** — `react-native-vision-camera-face-detector` (SDK 52+)
- **C** — none: colors still work, and the review screen asks the user to pick
  a face shape. This is a real fallback, not a failure state.

## How the analysis works

- **Color matching in CIELAB, not RGB.** Perceptual distance — RGB confuses
  "darker tone" with "same tone in shadow."
- **Median, not mean, per patch.** One specular highlight or stray hair can't
  drag the result.
- **Skin**: two cheeks + forehead; the best-lit patch wins (side lighting
  biases dark constantly).
- **Hair**: the crown strip above the face box. Temples are fallback only —
  they straddle the background.
- **Eyes**: a small patch at each eye landmark; the more saturated one wins.
- **Geometry**: box ratio → face shape; eye spacing → eye style; eye height →
  brows; nose-base position → nose; detector smile probability → expression.

## Tested

`node test-analysis.mjs` — 52 cases: every skin tone (14), hair color (16),
eye color (12) recovered from synthetic faces, face-shape ratios, a
half-shadowed face, and the no-landmarks fallback.

Two bugs this caught, both worth knowing about:
1. A "skip dark pixels as shadow" filter **discarded the darkest skin tones
   entirely** (s13/s14 read as shadow). Absolute darkness thresholds on skin
   are a bug, not an optimization.
2. "Darkest patch = hair" read **blonde and white hair as black**, because the
   temple patches include the dark background.

If you change the sampling, re-run the tests.
