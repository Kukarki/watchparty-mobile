// "Projector Noir" design tokens — see the design doc §1.
import { RARITY_COLORS } from '../avatar-core';

export const colors = {
  ink: '#0B0D14',
  inkRaised: '#141826',
  inkSoft: '#1B2133',
  border: '#232A3F',
  beam: '#8B7CFF',
  beamHot: '#B7A8FF',
  text: '#DDE6FF',
  dim: '#7A8199',
  cyan: '#35E0D0',
  amber: '#FFB454',
  danger: '#FF4D6D',
};

export const rarity = RARITY_COLORS;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const type = {
  display: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  h1: { fontSize: 20, fontWeight: '700', color: colors.text },
  h2: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text },
  dim: { fontSize: 13, color: colors.dim },
  mono: { fontSize: 12, color: colors.dim, fontVariant: ['tabular-nums'] },
};
