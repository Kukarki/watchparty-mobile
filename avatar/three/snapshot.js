// Captures the three profile snapshots (head / bust / full) from a mounted
// AvatarStage after a save, as base64 PNGs ready for POST /avatar/me/snapshots.
import * as FileSystem from 'expo-file-system';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function captureSnapshots(stageRef, { settleMs = 220 } = {}) {
  const stage = stageRef && stageRef.current;
  if (!stage) return {};
  const out = {};
  const startFraming = 'full';

  for (const kind of ['head', 'bust', 'full']) {
    stage.setFraming(kind === 'head' ? 'head' : kind);
    stage.setYaw(0); // face the camera for the identity shots
    await sleep(settleMs); // let the camera spring settle + render
    try {
      const snap = await stage.snapshot();
      if (snap && snap.uri) {
        out[kind] = await FileSystem.readAsStringAsync(snap.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch (err) {
      console.warn(`[avatar] snapshot '${kind}' failed:`, err.message);
    }
  }

  stage.setFraming(startFraming);
  return out; // { head?, bust?, full? } base64 strings
}
