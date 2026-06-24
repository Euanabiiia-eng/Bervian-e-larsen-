export const colors = {
  gold: '#8B6914',
  goldLight: '#B8965A',
  goldPale: '#D4B87A',
  ink: '#0E0D0C',
  inkDim: '#2A2820',
  inkPale: '#6A6458',
  white: '#F7F2EA',
  card: '#EDE5D8',
  card2: '#E4DAC8',
  ok: '#3D6B4F',
  danger: '#8B2020',
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof Colors;

export default colors;
