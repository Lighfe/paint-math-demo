export type DotOffset = {
  dx: number;
  dy: number;
};

/** Returns one standard normal sample using the Box–Muller transform. */
export function sampleStandardNormal(): number {
  let u = 0;
  let v = 0;

  // Math.random can return zero; exclude it before taking the logarithm.
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Returns independent x/y normal offsets with mean zero. */
export function sampleDotOffset(spread: number): DotOffset {
  if (spread === 0) return { dx: 0, dy: 0 };

  return {
    dx: sampleStandardNormal() * spread,
    dy: sampleStandardNormal() * spread,
  };
}