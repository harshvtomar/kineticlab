/** Stage 12 isolated lever physics model. Torque calculations are gravity-only idealized references,
 * not a replacement for the revolute-joint rigid-body simulation. */
export const LEVER = Object.freeze({
  gravity: 9.81, beamLengthM: 5.6, beamDepthM: 0.44, beamThicknessM: 0.18,
  fulcrumHeightM: 1.75, weightWidthM: 0.48, weightHeightM: 0.38,
  maxEvents: 48, samplePeriodS: 0.12, maxFrameDeltaS: 0.1,
  minimumArmM: 0.65, maximumArmM: 2.35,
  balanceToleranceNm: 0.12,
});

export type LeverParameters = Readonly<{
  leftMassKg: number; rightMassKg: number; beamMassKg:number;
  leftArmM: number; rightArmM: number; fulcrumOffsetM:number;
  angularDamping:number;
}>;

export const DEFAULT_LEVER_PARAMETERS: LeverParameters = Object.freeze({
  leftMassKg:2, rightMassKg:2, beamMassKg:1.2,
  leftArmM:1.65, rightArmM:1.65, fulcrumOffsetM:0, angularDamping:0.15,
});
export const LEVER_PRESETS: Readonly<Record<'balanced'|'leftHeavy'|'rightHeavy'|'offsetPivot',LeverParameters>>=Object.freeze({
  balanced:DEFAULT_LEVER_PARAMETERS,
  leftHeavy:Object.freeze({...DEFAULT_LEVER_PARAMETERS,leftMassKg:3.4,rightMassKg:1.5}),
  rightHeavy:Object.freeze({...DEFAULT_LEVER_PARAMETERS,leftMassKg:1.2,rightMassKg:3.2}),
  offsetPivot:Object.freeze({...DEFAULT_LEVER_PARAMETERS,fulcrumOffsetM:0.4}),
});

function inRange(value:number,lo:number,hi:number,name:string){
  if(!Number.isFinite(value)||value<lo-1e-9||value>hi+1e-9)throw new RangeError(`Invalid ${name}`);
}
export function validateLeverParameters(p:LeverParameters):LeverParameters {
  if(!p||typeof p!=='object')throw new RangeError('Parameters required');
  inRange(p.leftMassKg,0.25,5,'left mass'); inRange(p.rightMassKg,0.25,5,'right mass');
  inRange(p.beamMassKg,0.5,3,'beam mass');
  inRange(p.leftArmM,LEVER.minimumArmM,LEVER.maximumArmM,'left arm');
  inRange(p.rightArmM,LEVER.minimumArmM,LEVER.maximumArmM,'right arm');
  inRange(p.fulcrumOffsetM,-0.5,0.5,'pivot offset');
  inRange(p.angularDamping,0,1.5,'angular damping');
  // Keep both weight colliders inside the beam and away from the pivot.
  if(p.leftArmM+p.fulcrumOffsetM<0.4 || p.rightArmM-p.fulcrumOffsetM<0.4)throw new RangeError('Weights must be outside fulcrum');
  return p;
}

/** Local attached collider positions and the local joint anchor. Positive offset moves the pivot toward the right end. */
export function leverGeometry(p:LeverParameters){
  validateLeverParameters(p);
  return Object.freeze({
    beamPosition: Object.freeze([-p.fulcrumOffsetM,LEVER.fulcrumHeightM,0] as const),
    jointBeamAnchor: Object.freeze([p.fulcrumOffsetM,0,0] as const),
    leftWeightPosition: Object.freeze([-p.leftArmM,LEVER.beamThicknessM/2+LEVER.weightHeightM/2,0] as const),
    rightWeightPosition: Object.freeze([p.rightArmM,LEVER.beamThicknessM/2+LEVER.weightHeightM/2,0] as const),
  });
}

/** Positive net torque means the left side initially falls. Beam's own mass contributes for an offset pivot. */
export function idealGravityTorques(p:LeverParameters, angleRadians=0){
  validateLeverParameters(p);
  if(!Number.isFinite(angleRadians))throw new RangeError('Invalid beam angle');
  const factor=LEVER.gravity*Math.cos(angleRadians);
  const leftNm=p.leftMassKg*(p.leftArmM+p.fulcrumOffsetM)*factor;
  const rightNm=p.rightMassKg*(p.rightArmM-p.fulcrumOffsetM)*factor;
  const beamNm=p.beamMassKg*p.fulcrumOffsetM*factor;
  return Object.freeze({leftNm,rightNm,beamNm,netNm:leftNm-rightNm+beamNm});
}
export type LeverOutcome='balanced'|'left-down'|'right-down';
export function predictedLeverOutcome(p:LeverParameters):LeverOutcome {
  const {netNm}=idealGravityTorques(p);
  return Math.abs(netNm)<LEVER.balanceToleranceNm?'balanced':netNm>0?'left-down':'right-down';
}
export type Orientation = Readonly<{x:number;y:number;z:number;w:number}>;
/** Signed Z angle, appropriate to the constrained z-axis hinge. */
export function leverAngleDegrees(q:Orientation):number {
  if(!Object.values(q).every(Number.isFinite))throw new RangeError('Invalid orientation');
  const length=Math.hypot(q.x,q.y,q.z,q.w);
  if(length<1e-8)throw new RangeError('Zero orientation');
  const x=q.x/length,y=q.y/length,z=q.z/length,w=q.w/length;
  return Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z))*180/Math.PI;
}
export function leverDirection(angleDeg:number):LeverOutcome {
  if(!Number.isFinite(angleDeg))throw new RangeError('Invalid angle');
  return Math.abs(angleDeg)<1?'balanced':angleDeg>0?'left-down':'right-down';
}
export function validLeverSample(angleDeg:number, angularSpeedRadS:number, elapsedS:number):boolean {
  return [angleDeg,angularSpeedRadS,elapsedS].every(Number.isFinite) && elapsedS>=0;
}
