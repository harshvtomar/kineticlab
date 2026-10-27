/** Offline Stage 10 geometry and model verification; does not claim to run Rapier. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
const cwd=resolve(import.meta.dirname,'..');
const tmp=mkdtempSync(join(tmpdir(),'kl-ramp-'));
let n=0;
const pass=(message,run)=>{run();n++;console.log('PASS',message)};
try {
  execFileSync('tsc',['--strict','--skipLibCheck','--target','ES2022','--module','commonjs','--moduleResolution','node','--outDir',tmp,'src/domain/ramp-dynamics.ts'],{cwd,stdio:'pipe'});
  const req=createRequire(join(tmp,'runner.cjs'));
  const mod=req(join(tmp,'ramp-dynamics.js'));
  const {DEFAULT_RAMP_PARAMETERS:p,RAMP_PRESETS, RAMP_BENCH,validateRampParameters,initialRampBallPosition,downhillVector,rampSurfacePoint,idealDownhillAcceleration,alongRampTravel,rampDiagnostics}=mod;
  for(const [name,config] of Object.entries({default:p,...RAMP_PRESETS}))pass(`${name} validated`,()=>assert.doesNotThrow(()=>validateRampParameters(config)));
  for(const angle of [NaN,-Infinity,-1,0,4.99,30.01,99])pass(`reject slope ${angle}`,()=>assert.throws(()=>validateRampParameters({...p,angleDegrees:angle})));
  for(const friction of [-1,1.21,NaN,Infinity])pass(`reject friction ${friction}`,()=>assert.throws(()=>validateRampParameters({...p,friction})));
  for(const restitution of [-.1,.81,Infinity])pass(`reject restitution ${restitution}`,()=>assert.throws(()=>validateRampParameters({...p,restitution})));
  pass('reject invalid motion',()=>assert.throws(()=>validateRampParameters({...p,motion:'invalid'})));
  for(const angle of [5,15,18,25,30])pass(`valid starting clearance at ${angle}`,()=>{
    const start=initialRampBallPosition({...p,angleDegrees:angle});
    const surface=rampSurfacePoint(angle,-RAMP_BENCH.rampLength/2+RAMP_BENCH.ballStartInset);
    assert.ok(start[1]>RAMP_BENCH.ballRadius);
    assert.ok(Math.abs(Math.hypot(start[0]-surface[0],start[1]-surface[1])-RAMP_BENCH.ballRadius-RAMP_BENCH.ballClearance)<1e-8);
  });
  pass('normalized downhill direction',()=>assert.ok(Math.abs(Math.hypot(...downhillVector(18))-1)<1e-12));
  pass('ideal sliding versus rolling solid-sphere ratio 7:5',()=>assert.ok(Math.abs(idealDownhillAcceleration({...p,motion:'slide'})/idealDownhillAcceleration(p)-7/5)<1e-10));
  pass('slope-aligned motion reading',()=>{const start=initialRampBallPosition(p);const d=downhillVector(p.angleDegrees);assert.ok(Math.abs(alongRampTravel([start[0]+d[0],start[1]+d[1],0],start,p.angleDegrees)-1)<1e-10)});
  pass('non-finite telemetry rejected',()=>assert.throws(()=>rampDiagnostics([NaN,0,0],[0,0,0],[0,0,0],p)));
  pass('sample return frozen',()=>assert.equal(Object.isFrozen(rampDiagnostics([0,0,0],[0,0,0],[0,0,0],p)),true));
  console.log(`PASS ${n} Stage 10 offline assertions and strict TypeScript domain compilation`);
} finally {rmSync(tmp,{recursive:true,force:true})}
