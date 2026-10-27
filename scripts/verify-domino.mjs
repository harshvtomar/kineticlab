/** Offline strict TS and stage 11 physics-domain checks; not a substitute for real Rapier. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
const cwd=resolve(import.meta.dirname,'..'),temp=mkdtempSync(join(tmpdir(),'kineticlab-domino-'));
let n=0;const pass=(name,fn)=>{fn();n++;console.log('PASS',name)};
try{
  execFileSync('tsc',['--strict','--skipLibCheck','--target','ES2022','--module','commonjs','--moduleResolution','node','--outDir',temp,'src/domain/domino-dynamics.ts'],{cwd,stdio:'pipe'});
  const m=createRequire(join(temp,'test.cjs'))(join(temp,'domino-dynamics.js'));
  const p=m.DEFAULT_DOMINO_PARAMETERS;
  for(const [name,params] of Object.entries(m.DOMINO_PRESETS))pass(`preset ${name}`,()=>assert.doesNotThrow(()=>m.validateDominoParameters(params)));
  for(const count of [2,15,4.5,NaN,Infinity])pass(`invalid count ${count}`,()=>assert.throws(()=>m.validateDominoParameters({...p,count})));
  for(const spacingM of [.1,.76,NaN,Infinity])pass(`invalid spacing ${spacingM}`,()=>assert.throws(()=>m.validateDominoParameters({...p,spacingM})));
  for(const friction of [.1,1.3,NaN])pass(`invalid friction ${friction}`,()=>assert.throws(()=>m.validateDominoParameters({...p,friction})));
  for(const kickImpulseNs of [.1,1.6,NaN])pass(`invalid impulse ${kickImpulseNs}`,()=>assert.throws(()=>m.validateDominoParameters({...p,kickImpulseNs})));
  pass('symmetric row and spacing',()=>{const x=m.dominoPositions(p);assert.equal(x.length,p.count);assert.ok(Math.abs(x[0][0]+x.at(-1)[0])<1e-10);for(let i=1;i<x.length;i++)assert.ok(Math.abs((x[i][0]-x[i-1][0])-p.spacingM)<1e-10)});
  pass('row is immutable',()=>assert.ok(Object.isFrozen(m.dominoPositions(p))));
  pass('IDs stable',()=>{for(let i=0;i<14;i++)assert.equal(m.dominoIndex(m.dominoId(i)),i)});
  pass('yaw is not a topple',()=>assert.ok(m.tiltDegrees({x:0,y:Math.sin(.5),z:0,w:Math.cos(.5)})<.01));
  pass('quarter turn is topple',()=>assert.ok(Math.abs(m.tiltDegrees({x:0,y:0,z:Math.SQRT1_2,w:Math.SQRT1_2})-90)<.001));
  pass('final domino determines success',()=>{assert.equal(m.chainSucceeded([70,70,0],3),false);assert.equal(m.chainSucceeded([70,0,70],3),true)});
  pass('tipped threshold',()=>assert.equal(m.toppedCount([0,50,75]),2));
  pass('physical spacing reachable',()=>assert.ok(m.geometricReachable(p)));
  console.log(`PASS ${n} Stage 11 isolated assertions and strict domain TS compilation`);
}finally{rmSync(temp,{force:true,recursive:true})}
