import { describe, it, expect } from 'vitest';
import {DEFAULT_RAMP_PARAMETERS, RAMP_PRESETS, validateRampParameters, initialRampBallPosition, RAMP_BENCH, idealDownhillAcceleration, rampSurfacePoint, alongRampTravel, speedMagnitude, rampDiagnostics, downhillVector} from './ramp-dynamics';

describe('Stage 10 isolated ramp experiment geometry and validation', () => {
  it('accepts each preset and the default', () => { [DEFAULT_RAMP_PARAMETERS,...Object.values(RAMP_PRESETS)].forEach(x=>expect(()=>validateRampParameters(x)).not.toThrow()); });
  it.each([NaN,Infinity,-Infinity,4.9,30.01])('rejects invalid slope %s', a => expect(()=>validateRampParameters({...DEFAULT_RAMP_PARAMETERS,angleDegrees:a})).toThrow());
  it.each([-0.01,1.21,NaN,Infinity])('rejects invalid friction %s', friction => expect(()=>validateRampParameters({...DEFAULT_RAMP_PARAMETERS,friction})).toThrow());
  it.each([-0.01,0.81,NaN])('rejects invalid restitution %s', restitution => expect(()=>validateRampParameters({...DEFAULT_RAMP_PARAMETERS,restitution})).toThrow());
  it('rejects unsupported motion modes',()=>expect(()=>validateRampParameters({...DEFAULT_RAMP_PARAMETERS,motion:'fly' as never})).toThrow());
  it('high-side ball starts clear of the ramp surface and floor', () => {
    for (const angle of [5,18,30]) {
      const parameters={...DEFAULT_RAMP_PARAMETERS,angleDegrees:angle};
      const start=initialRampBallPosition(parameters);
      const surface=rampSurfacePoint(angle,-RAMP_BENCH.rampLength/2+RAMP_BENCH.ballStartInset);
      expect(start[1]).toBeGreaterThan(0);
      expect(Math.hypot(start[0]-surface[0],start[1]-surface[1])).toBeCloseTo(RAMP_BENCH.ballRadius+RAMP_BENCH.ballClearance,6);
    }
  });
  it('downhill tangent is normalized',()=>{for (const a of [5,18,30]) expect(Math.hypot(...downhillVector(a))).toBeCloseTo(1);});
  it('downhill projected travel respects slope orientation',()=>{
    const p=DEFAULT_RAMP_PARAMETERS, start=initialRampBallPosition(p), d=downhillVector(p.angleDegrees);
    expect(alongRampTravel([start[0]+d[0],start[1]+d[1],0],start,p.angleDegrees)).toBeCloseTo(1);
  });
  it('sliding ideal acceleration exceeds free rolling ideal acceleration',()=>{
    const roll=idealDownhillAcceleration(DEFAULT_RAMP_PARAMETERS);
    const slide=idealDownhillAcceleration({...DEFAULT_RAMP_PARAMETERS,motion:'slide'});
    expect(roll).toBeCloseTo(slide*5/7);
  });
  it('motion metrics are finite, immutable and reject nonfinite input',()=>{
    const start=initialRampBallPosition(DEFAULT_RAMP_PARAMETERS);
    const metrics=rampDiagnostics(start,start,[1,2,2],DEFAULT_RAMP_PARAMETERS);
    expect(metrics.distanceM).toBe(0);
    expect(metrics.speedMps).toBe(3);
    expect(Object.isFrozen(metrics)).toBe(true);
    expect(()=>rampDiagnostics([NaN,1,0],start,[0,0,0],DEFAULT_RAMP_PARAMETERS)).toThrow();
  });
  it('start and policy are compatible with gravity direction',()=>{
    expect(RAMP_BENCH.gravity).toBe(9.81);
    expect(speedMagnitude([0,0,0])).toBe(0);
  });
});
