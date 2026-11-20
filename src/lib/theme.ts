export const C = {
  blue: '#1554D1',
  blueDark: '#0D3D9E',
  sky: '#EAF1FF',
  bg: '#F4F6FA',
  card: '#FFFFFF',
  line: '#E3E8F0',
  navy: '#0B1F44',
  muted: '#5D6B85',
  up: '#0F9D58',
  down: '#D93025',
  warnBg: '#FFF7E6',
  warnText: '#7A4B00',
};

export const fmt = (n: number, d = 2) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
export const upDown = (n: number) => (n >= 0 ? C.up : C.down);
