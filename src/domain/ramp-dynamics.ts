/** Stage 10 isolated ramp experiment policy (metres, seconds, kilograms).
 * This is runtime-only: it neither edits nor migrates scene schema v1.
 * The theoretical acceleration is a reference, not a substitute for Rapier.
 */
export type RampMotion = 'roll' | 'slide';
export interface RampParameters {
  readonly angleDegrees: number;
  readonly friction: number;
  readonly restitution: number;
  readonly motion: RampMotion;
}
export type RampVector = readonly [number, number, number];

export const RAMP_BENCH = Object.freeze({
  rampLength: 4.8,
  rampWidth: 2,
  rampThickness: 0.24,
  rampCentreY: 1.8,
  ballRadius: 0.34,
  ballStartInset: 0.65,
  ballClearance: 0.025,
  groundTop: 0,
  gravity: 9.81,
  sampleLimit: 100,
  samplePeriod: 0.12,
});

export const DEFAULT_RAMP_PARAMETERS: RampParameters = Object.freeze({ angleDegrees: 18, friction: 0.55, restitution: 0.16, motion: 'roll' });
export const RAMP_PRESETS: Readonly<Record<'rolling'|'sliding'|'bouncy', RampParameters>> = Object.freeze({
  rolling: Object.freeze({ angleDegrees: 18, friction: 0.85, restitution: 0.05, motion: 'roll' }),
  sliding: Object.freeze({ angleDegrees: 22, friction: 0.08, restitution: 0.05, motion: 'slide' }),
  bouncy: Object.freeze({ angleDegrees: 28, friction: 0.35, restitution: 0.75, motion: 'roll' }),
});

export function validateRampParameters(value: RampParameters): void {
  if (!value || !Number.isFinite(value.angleDegrees) || value.angleDegrees < 5 || value.angleDegrees > 30) throw new RangeError('Slope must be between 5° and 30°');
  if (!Number.isFinite(value.friction) || value.friction < 0 || value.friction > 1.2) throw new RangeError('Friction must be between 0 and 1.2');
  if (!Number.isFinite(value.restitution) || value.restitution < 0 || value.restitution > 0.8) throw new RangeError('Restitution must be between 0 and 0.8');
  if (value.motion !== 'roll' && value.motion !== 'slide') throw new RangeError('Unknown ramp motion type');
}
export function slopeRadians(angleDegrees: number): number { return angleDegrees * Math.PI / 180; }
/** The downhill unit tangent for a ramp descending towards +X. */
export function downhillVector(angleDegrees: number): RampVector {
  if (!Number.isFinite(angleDegrees)) throw new RangeError('Angle must be finite');
  const a = slopeRadians(angleDegrees);
  return [Math.cos(a), -Math.sin(a), 0];
}
/** Starting point at the high end, clear of the ramp's top surface. */
export function initialRampBallPosition(parameters: RampParameters): RampVector {
  validateRampParameters(parameters);
  const a = slopeRadians(parameters.angleDegrees);
  const distance = -RAMP_BENCH.rampLength / 2 + RAMP_BENCH.ballStartInset;
  const normalOffset = RAMP_BENCH.rampThickness / 2 + RAMP_BENCH.ballRadius + RAMP_BENCH.ballClearance;
  return [distance * Math.cos(a) + normalOffset * Math.sin(a),
    RAMP_BENCH.rampCentreY - distance * Math.sin(a) + normalOffset * Math.cos(a), 0];
}
export function rampSurfacePoint(angleDegrees: number, xLocal: number): RampVector {
  const a = slopeRadians(angleDegrees);
  return [xLocal * Math.cos(a) + RAMP_BENCH.rampThickness/2 * Math.sin(a),
    RAMP_BENCH.rampCentreY - xLocal * Math.sin(a) + RAMP_BENCH.rampThickness/2 * Math.cos(a), 0];
}
/** g sin(theta) for sliding without friction; 5/7 g sin(theta) for a homogeneous rolling solid sphere. */
export function idealDownhillAcceleration(parameters: RampParameters): number {
  validateRampParameters(parameters);
  return RAMP_BENCH.gravity * Math.sin(slopeRadians(parameters.angleDegrees)) * (parameters.motion === 'roll' ? 5/7 : 1);
}
export function alongRampTravel(position: RampVector, start: RampVector, angleDegrees: number): number {
  const downhill = downhillVector(angleDegrees);
  return (position[0] - start[0])*downhill[0] + (position[1] - start[1])*downhill[1];
}
export function speedMagnitude(velocity: RampVector): number {
  return Math.hypot(...velocity);
}
export function rampDiagnostics(position: RampVector, start: RampVector, velocity: RampVector, parameters: RampParameters) {
  if (![...position, ...start, ...velocity].every(Number.isFinite)) throw new RangeError('Motion sample contains a non-finite component');
  return Object.freeze({ distanceM: alongRampTravel(position, start, parameters.angleDegrees), speedMps: speedMagnitude(velocity), elevationM: position[1], idealAccelerationMps2: idealDownhillAcceleration(parameters) });
}
