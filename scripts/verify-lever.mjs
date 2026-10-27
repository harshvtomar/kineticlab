/** Strict isolated TypeScript + formula and geometry contract checks; no WASM or browser implied. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
const cwd=resolve(import.meta.dirname,'..'),temp=mkdtempSync(join(tmpdir(),'kl-lever-'));
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS',name)};
try{
  execFileSync('tsc',['--strict','--skipLibCheck','--target','ES2022','--module','commonjs','--moduleResolution','node','--outDir',temp,'src/domain/lever-dynamics.ts'],{cwd,stdio:'pipe'});
  const m=createRequire(join(temp,'verify.cjs'))(join(temp,'lever-dynamics.js'));
  const p=m.DEFAULT_LEVER_PARAMETERS;
  for(const [name,preset] of Object.entries(m.LEVER_PRESETS))check(`valid preset ${name}`,()=>assert.doesNotThrow(()=>m.validateLeverParameters(preset)));
  for(const mass of [0,.24,5.01,NaN,Infinity])check(`mass reject ${mass}`,()=>assert.throws(()=>m.validateLeverParameters({...p,leftMassKg:mass})));
  for(const fulcrumOffsetM of [-.51,.51,NaN,Infinity])check(`pivot reject ${fulcrumOffsetM}`,()=>assert.throws(()=>m.validateLeverParameters({...p,fulcrumOffsetM})));
  for(const leftArmM of [.4,2.36,NaN,Infinity])check(`arm reject ${leftArmM}`,()=>assert.throws(()=>m.validateLeverParameters({...p,leftArmM})));
  for(const offset of [-.5,0,.5])check(`pivot anchor alignment ${offset}`,()=>{const g=m.leverGeometry({...p,fulcrumOffsetM:offset});assert.ok(Math.abs(g.beamPosition[0]+g.jointBeamAnchor[0])<1e-10)});
  check('balanced equal-weight torque',()=>assert.ok(Math.abs(m.idealGravityTorques(p).netNm)<1e-9));
  check('positive left-heavy torque',()=>assert.ok(m.idealGravityTorques(m.LEVER_PRESETS.leftHeavy).netNm>0));
  check('negative right-heavy torque',()=>assert.ok(m.idealGravityTorques(m.LEVER_PRESETS.rightHeavy).netNm<0));
  check('offset pivot and beam moment',()=>assert.ok(m.idealGravityTorques(m.LEVER_PRESETS.offsetPivot).beamNm>0));
  check('zero torque at vertical',()=>assert.ok(Math.abs(m.idealGravityTorques(m.LEVER_PRESETS.leftHeavy,Math.PI/2).netNm)<1e-10));
  check('signed +90 angle',()=>assert.ok(Math.abs(m.leverAngleDegrees({x:0,y:0,z:Math.SQRT1_2,w:Math.SQRT1_2})-90)<1e-8));
  check('signed -90 angle',()=>assert.ok(Math.abs(m.leverAngleDegrees({x:0,y:0,z:-Math.SQRT1_2,w:Math.SQRT1_2})+90)<1e-8));
  check('invalid quaternion rejection',()=>assert.throws(()=>m.leverAngleDegrees({x:NaN,y:0,z:0,w:1})));
  check('stale invalid measurements rejected',()=>assert.equal(m.validLeverSample(1,2,NaN),false));
  console.log(`PASS ${count} Stage 12 isolated checks; strict domain TypeScript compile`);
}finally{rmSync(temp,{recursive:true,force:true})}
