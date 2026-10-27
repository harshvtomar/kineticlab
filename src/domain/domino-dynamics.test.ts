import {describe,it,expect} from 'vitest';
import {DOMINO,DEFAULT_DOMINO_PARAMETERS,DOMINO_PRESETS,validateDominoParameters,dominoPositions,dominoId,dominoIndex,tiltDegrees,toppedCount,chainSucceeded,geometricReachable} from './domino-dynamics';

describe('Stage 11 domino row contracts and geometry',()=>{
  it('validates presets',()=>Object.values(DOMINO_PRESETS).forEach(p=>expect(()=>validateDominoParameters(p)).not.toThrow()));
  it.each([2,15,3.5,NaN,Infinity])('rejects count %s',count=>expect(()=>validateDominoParameters({...DEFAULT_DOMINO_PARAMETERS,count})).toThrow());
  it.each([0.01,.21,.76,NaN,Infinity])('rejects spacing %s',spacingM=>expect(()=>validateDominoParameters({...DEFAULT_DOMINO_PARAMETERS,spacingM})).toThrow());
  it.each([0.19,1.21,NaN])('rejects friction %s',friction=>expect(()=>validateDominoParameters({...DEFAULT_DOMINO_PARAMETERS,friction})).toThrow());
  it.each([0.14,1.51,Infinity])('rejects impulse %s',kickImpulseNs=>expect(()=>validateDominoParameters({...DEFAULT_DOMINO_PARAMETERS,kickImpulseNs})).toThrow());
  it('positions row symmetrically, spaced exactly, over ground',()=>{
    const p=DEFAULT_DOMINO_PARAMETERS,positions=dominoPositions(p);
    expect(positions).toHaveLength(p.count);
    expect(positions[0][0]).toBeCloseTo(-positions[p.count-1][0]);
    for(let i=0;i<p.count;i++){
      expect(positions[i][1]).toBeCloseTo(DOMINO.heightM/2);
      if(i)expect(positions[i][0]-positions[i-1][0]).toBeCloseTo(p.spacingM);
    }
    expect(Object.isFrozen(positions)).toBe(true);
  });
  it('has reversible, zero-padded stable IDs',()=>{for(let i=0;i<14;i++)expect(dominoIndex(dominoId(i))).toBe(i);});
  it.each(['domino-00','domino-15','domino-1','ground','domino-01x'])('rejects non-domino ID %s',id=>expect(dominoIndex(id)).toBeNull());
  it('detects tilt without misclassifying yaw',()=>{
    expect(tiltDegrees({x:0,y:0,z:0,w:1})).toBeCloseTo(0);
    expect(tiltDegrees({x:0,y:Math.sin(.8),z:0,w:Math.cos(.8)})).toBeCloseTo(0);
    expect(tiltDegrees({x:0,y:0,z:Math.sin(Math.PI/4),w:Math.cos(Math.PI/4)})).toBeCloseTo(90);
  });
  it('uses final domino tilt to determine successful propagation',()=>{
    expect(toppedCount([55,20,70])).toBe(2);
    expect(chainSucceeded([80,0,55],3)).toBe(true);
    expect(chainSucceeded([80,80,0],3)).toBe(false);
    expect(chainSucceeded([80,80],3)).toBe(false);
  });
  it('rejects nonfinite quaternions and zero quaternion',()=>{
    expect(()=>tiltDegrees({x:NaN,y:0,z:0,w:1})).toThrow();
    expect(()=>tiltDegrees({x:0,y:0,z:0,w:0})).toThrow();
  });
  it('valid spacing geometry lets falling domino reach neighbor',()=>expect(geometricReachable(DEFAULT_DOMINO_PARAMETERS)).toBe(true));
});
