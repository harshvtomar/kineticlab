import {describe,it,expect} from 'vitest';
import {DEFAULT_LEVER_PARAMETERS,LEVER,LEVER_PRESETS,validateLeverParameters,leverGeometry,idealGravityTorques,leverAngleDegrees,leverDirection,predictedLeverOutcome,validLeverSample} from './lever-dynamics';

describe('Stage 12 validated physical lever geometry',()=>{
  it('accepts each preset',()=>Object.values(LEVER_PRESETS).forEach(p=>expect(()=>validateLeverParameters(p)).not.toThrow()));
  it.each([0,0.24,5.01,NaN,Infinity])('rejects invalid left mass %s',value=>expect(()=>validateLeverParameters({...DEFAULT_LEVER_PARAMETERS,leftMassKg:value})).toThrow());
  it.each([-0.51,0.51,NaN,Infinity])('rejects invalid fulcrum offset %s',value=>expect(()=>validateLeverParameters({...DEFAULT_LEVER_PARAMETERS,fulcrumOffsetM:value})).toThrow());
  it.each([0.3,2.36,NaN,Infinity])('rejects invalid arm position %s',value=>expect(()=>validateLeverParameters({...DEFAULT_LEVER_PARAMETERS,rightArmM:value})).toThrow());
  it.each([-0.1,1.51,NaN])('rejects invalid damping %s',value=>expect(()=>validateLeverParameters({...DEFAULT_LEVER_PARAMETERS,angularDamping:value})).toThrow());
  it('preserves pivot world position when fulcrum offset changes',()=>{
    for(const offset of [-.5,0,.5]) {
      const g=leverGeometry({...DEFAULT_LEVER_PARAMETERS,fulcrumOffsetM:offset});
      expect(g.beamPosition[0]+g.jointBeamAnchor[0]).toBeCloseTo(0);
      expect(g.beamPosition[1]).toBe(LEVER.fulcrumHeightM);
      expect(Object.isFrozen(g.leftWeightPosition)).toBe(true);
    }
  });
});
describe('Stage 12 ideal torque and physical measurement contracts',()=>{
  it('balanced preset has zero initial net torque',()=>expect(idealGravityTorques(DEFAULT_LEVER_PARAMETERS).netNm).toBeCloseTo(0));
  it('heavier left tends to lower left; heavier right tends to lower right',()=>{
    expect(predictedLeverOutcome(LEVER_PRESETS.leftHeavy)).toBe('left-down');
    expect(predictedLeverOutcome(LEVER_PRESETS.rightHeavy)).toBe('right-down');
  });
  it('offset pivot contributes the beam self weight and changes leverage',()=>{
    const a=idealGravityTorques(DEFAULT_LEVER_PARAMETERS),b=idealGravityTorques(LEVER_PRESETS.offsetPivot);
    expect(a.beamNm).toBeCloseTo(0);expect(b.beamNm).toBeGreaterThan(0);
    expect(b.netNm).toBeGreaterThan(a.netNm);
  });
  it('ideal torque scales with cosine of beam angle',()=>{
    expect(idealGravityTorques(LEVER_PRESETS.leftHeavy,Math.PI/2).netNm).toBeCloseTo(0,8);
    expect(()=>idealGravityTorques(LEVER_PRESETS.leftHeavy,NaN)).toThrow();
  });
  it('extracts signed hinge angles from normalized and nonunit quaternions',()=>{
    expect(leverAngleDegrees({x:0,y:0,z:Math.SQRT1_2,w:Math.SQRT1_2})).toBeCloseTo(90);
    expect(leverAngleDegrees({x:0,y:0,z:-Math.SQRT1_2,w:Math.SQRT1_2})).toBeCloseTo(-90);
    expect(leverAngleDegrees({x:0,y:0,z:0,w:3})).toBeCloseTo(0);
  });
  it('rejects invalid quaternion and telemetry',()=>{
    expect(()=>leverAngleDegrees({x:0,y:0,z:0,w:0})).toThrow();
    expect(()=>leverAngleDegrees({x:NaN,y:0,z:0,w:1})).toThrow();
    expect(validLeverSample(1,.2,2)).toBe(true);expect(validLeverSample(1,Infinity,2)).toBe(false);
    expect(validLeverSample(1,.2,-2)).toBe(false);
  });
  it('reports direction from actual angular orientation',()=>{
    expect(leverDirection(0)).toBe('balanced');expect(leverDirection(10)).toBe('left-down');expect(leverDirection(-3)).toBe('right-down');
  });
});
