import React from 'react';
import { router } from 'expo-router';
// @ts-ignore — JSX module, types resolved at build time
import LudoBoardPro from '../../games/ludo/LudoBoardPro';

export default function LudoSoloRoute() {
  return <LudoBoardPro onExit={() => router.back()} />;
}
