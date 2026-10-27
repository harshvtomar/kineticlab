/** Stage 11 — isolated rigid-body domino experiment. Units: metres, seconds, kilograms.
 * The authored v1 scene registry is intentionally not modified.
 */
export interface DominoParameters {
  readonly count: number;
  readonly spacingM: number; // centre-to-centre distance in the X direction
  readonly friction: number;
  readonly kickImpulseNs: number;
}
export const DOMINO = Object.freeze({
  thicknessM: 0.16,
  heightM: 1.05,
  depthM: 0.64,
  massKg: 0.32,
  groundWidthM: 15,
  groundDepthM: 4.5,
  tiltThresholdDegrees: 50,
  maxSamples: 100,
  sampleIntervalS: 0.08,
  sampleDeltaMaxS: 0.1,
  maxEvents: 48,
  timestepS: 1 / 60,
});
export const DEFAULT_DOMINO_PARAMETERS: Readonly<DominoParameters> = Object.freeze({count: 9, spacingM: 0.40, friction: 0.8, kickImpulseNs: 0.65});
export const DOMINO_PRESETS: Readonly<Record<'standard' | 'tight' | 'wide', DominoParameters>> = Object.freeze({
  standard: DEFAULT_DOMINO_PARAMETERS,
  tight: Object.freeze({count: 11, spacingM: 0.30, friction: 0.8, kickImpulseNs: 0.65}),
  wide: Object.freeze({count: 8, spacingM: 0.57, friction: 0.8, kickImpulseNs: 0.65}),
});
export function validateDominoParameters(value: DominoParameters): void {
  if (!value || !Number.isInteger(value.count) || value.count < 3 || value.count > 14) throw new RangeError('Domino count must be an integer from 3 to 14');
  if (!Number.isFinite(value.spacingM) || value.spacingM < 0.22 || value.spacingM > 0.75) throw new RangeError('Domino centre spacing must be between 0.22 and 0.75 metres');
  if (!Number.isFinite(value.friction) || value.friction < 0.2 || value.friction > 1.2) throw new RangeError('Domino friction must be between 0.2 and 1.2');
  if (!Number.isFinite(value.kickImpulseNs) || value.kickImpulseNs < 0.15 || value.kickImpulseNs > 1.5) throw new RangeError('Kick impulse must be between 0.15 and 1.5 newton-seconds');
  if ((value.count-1)*value.spacingM > DOMINO.groundWidthM-2) throw new RangeError('Domino row exceeds the bench');
}
export function dominoPositions(params: DominoParameters): ReadonlyArray<readonly [number,number,number]> {
  validateDominoParameters(params);
  const start=-((params.count-1)*params.spacingM)/2;
  return Object.freeze(Array.from({length:params.count},(_,i)=>Object.freeze([start+i*params.spacingM,DOMINO.heightM/2,0] as const)));
}
export function dominoId(index: number): string {
  if (!Number.isInteger(index)||index<0||index>13) throw new RangeError('Invalid domino index');
  return `domino-${String(index+1).padStart(2,'0')}`;
}
export function dominoIndex(id: string): number | null {
  const match=/^domino-(0[1-9]|1[0-4])$/.exec(id);
  return match ? Number(match[1])-1 : null;
}
export type Orientation = Readonly<{x:number;y:number;z:number;w:number}>;
/** Angle of the local Y axis against world vertical; yaw alone does not count as tipping. */
export function tiltDegrees(q: Orientation): number {
  if(!Object.values(q).every(Number.isFinite)) throw new RangeError('Non-finite orientation');
  const norm=Math.hypot(q.x,q.y,q.z,q.w);
  if(norm<1e-8) throw new RangeError('Zero quaternion');
  const upY=1-2*((q.x/norm)**2+(q.z/norm)**2);
  return Math.acos(Math.max(-1,Math.min(1,upY)))*180/Math.PI;
}
export function toppedCount(angles: readonly number[]): number {
  if(!angles.every(Number.isFinite)) throw new RangeError('Invalid angle sample');
  return angles.filter(angle=>angle>=DOMINO.tiltThresholdDegrees).length;
}
/** Success requires the LAST domino to pass threshold, not merely that many arbitrary dominos fell. */
export function chainSucceeded(angles: readonly number[], expectedCount: number): boolean {
  return angles.length===expectedCount && expectedCount>=3 && angles[expectedCount-1]>=DOMINO.tiltThresholdDegrees;
}
/** A gap longer than domino height cannot transmit a collision through a falling domino. */
export function geometricReachable(params: DominoParameters): boolean {
  validateDominoParameters(params);
  return params.spacingM-DOMINO.thicknessM < DOMINO.heightM;
}
