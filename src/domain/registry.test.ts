import { describe, expect, it } from 'vitest';
import { STARTER_SCENE } from './starter-scene';
import {
  createMechanicalScene, deserializeMechanicalScene, selectByKind,
  selectMechanicalObject, selectMechanicalObjects, serializeMechanicalScene,
  validateMechanicalScene,
} from './registry';

const fresh = (): Record<string, any> => JSON.parse(JSON.stringify(STARTER_SCENE));
const problems = (value: unknown) => validateMechanicalScene(value).map(issue => `${issue.path}: ${issue.message}`);

describe('mechanical registry schema and safe serialization', () => {
  it('validates the migrated starter schema', () => expect(problems(STARTER_SCENE)).toEqual([]));
  it('is version 1 with four ordered stable object IDs', () => {
    expect(STARTER_SCENE.schemaVersion).toBe(1);
    expect(STARTER_SCENE.objects.map(o => o.id)).toEqual(['ground-01','ramp-01','ball-01','stopper-01']);
  });
  it('round-trips unchanged across JSON boundaries', () => {
    const encoded = serializeMechanicalScene(STARTER_SCENE);
    expect(deserializeMechanicalScene(encoded)).toEqual(STARTER_SCENE);
    expect(serializeMechanicalScene(deserializeMechanicalScene(encoded))).toBe(encoded);
  });
  it('copies caller-provided input and recursively freezes the snapshot', () => {
    const input = fresh();
    const scene = createMechanicalScene(input);
    input.objects[0].transform.position[0] = 100;
    expect(scene.objects[0].transform.position[0]).toBe(0);
    expect(Object.isFrozen(scene)).toBe(true);
    expect(Object.isFrozen(scene.objects)).toBe(true);
    expect(Object.isFrozen(scene.objects[0].transform.position)).toBe(true);
    expect(Object.isFrozen(scene.objects[0].physics)).toBe(true);
  });
  it('selects objects and returns immutable filtered arrays', () => {
    expect(selectMechanicalObjects(STARTER_SCENE)).toBe(STARTER_SCENE.objects);
    expect(selectMechanicalObject(STARTER_SCENE, 'ball-01')?.kind).toBe('ball');
    expect(selectMechanicalObject(STARTER_SCENE, 'missing')).toBeUndefined();
    expect(selectMechanicalObject(STARTER_SCENE, null)).toBeUndefined();
    expect(selectByKind(STARTER_SCENE, 'ramp').map(o => o.id)).toEqual(['ramp-01']);
    expect(Object.isFrozen(selectByKind(STARTER_SCENE, 'ramp'))).toBe(true);
  });
  it('supports empty scenes but rejects nonarrays', () => {
    expect(createMechanicalScene({ schemaVersion:1, objects:[] }).objects).toEqual([]);
    expect(problems({ schemaVersion:1, objects:{} })).toEqual(['$.objects: Objects must be an array']);
  });
  it('rejects nonobjects and null root', () => {
    expect(problems(null)[0]).toMatch(/Scene must be an object/);
    expect(problems([])[0]).toMatch(/Scene must be an object/);
  });
  it.each([0,2,-1,'1',null,undefined])('rejects schema version %s', version => {
    const bad = fresh(); bad.schemaVersion=version;
    expect(problems(bad).join()).toMatch(/Unsupported schema version/);
    expect(() => createMechanicalScene(bad)).toThrow(/schemaVersion/);
  });
  it('rejects unknown root fields', () => {
    const bad = fresh(); bad.mystery=true;
    expect(problems(bad).join()).toMatch(/mystery: Unknown field/);
  });
  it('rejects absent required root fields', () => {
    const bad = fresh(); delete bad.objects;
    expect(problems(bad).join()).toMatch(/objects/);
  });
  it('rejects duplicate IDs and does not reorder objects', () => {
    const bad = fresh(); bad.objects[1].id='ground-01';
    expect(problems(bad).join()).toMatch(/Duplicate object ID/);
    expect(() => serializeMechanicalScene(bad as any)).toThrow(/Duplicate object ID/);
  });
  it.each(['','  ','9-start','has space','x'.repeat(101)])('rejects invalid ID %s', id => {
    const bad = fresh(); bad.objects[0].id=id;
    expect(problems(bad).join()).toMatch(/ID must be nonblank/);
  });
  it.each(['', ' ', 'x'.repeat(161), 7])('rejects invalid object label %s', label => {
    const bad = fresh(); bad.objects[0].label=label;
    expect(problems(bad).join()).toMatch(/Label must be nonempty/);
  });
  it('rejects invalid object entries and extra fields', () => {
    const bad = fresh(); bad.objects[0]=null; bad.objects[1].other='oops';
    expect(problems(bad).join()).toMatch(/Object descriptor required/);
    expect(problems(bad).join()).toMatch(/other: Unknown field/);
  });
  it.each(['motor','pulley','unknown',null])('rejects unsupported kind %s', kind => {
    const bad=fresh(); bad.objects[0].kind=kind;
    expect(problems(bad).join()).toMatch(/Unknown component kind/);
  });
  it.each([NaN,Infinity,-Infinity,'0',null])('rejects non-finite/non-numeric position %s', coordinate => {
    const bad=fresh(); bad.objects[0].transform.position[1]=coordinate;
    expect(problems(bad).join()).toMatch(/Position must contain three finite numbers/);
  });
  it.each([NaN,Infinity,'0',null])('rejects invalid rotation entry %s', radians => {
    const bad=fresh(); bad.objects[0].transform.rotation[2]=radians;
    expect(problems(bad).join()).toMatch(/Rotation must contain three finite radians/);
  });
  it.each([0,-1,NaN,Infinity])('rejects scale entry %s', scale => {
    const bad=fresh(); bad.objects[0].transform.scale[0]=scale;
    expect(problems(bad).join()).toMatch(/Scale must contain three positive finite numbers/);
  });
  it('rejects short vectors, missing transforms and extra transform fields', () => {
    const bad=fresh(); bad.objects[0].transform.scale=[1,1];
    bad.objects[1].transform.foo=1;
    bad.objects[2].transform=null;
    expect(problems(bad).join()).toMatch(/Scale must contain three positive finite numbers/);
    expect(problems(bad).join()).toMatch(/Unknown field/);
    expect(problems(bad).join()).toMatch(/Transform object required/);
  });
  it.each([0,-1,NaN,Infinity,null])('rejects invalid box dimension %s', dimension => {
    const bad=fresh(); bad.objects[0].geometry.dimensions[1]=dimension;
    expect(problems(bad).join()).toMatch(/Box dimensions must be positive finite numbers/);
  });
  it('rejects sphere geometry used on ground and box geometry used on ball', () => {
    const bad=fresh(); [bad.objects[0].geometry,bad.objects[2].geometry]=[bad.objects[2].geometry,bad.objects[0].geometry];
    expect(problems(bad).join()).toMatch(/requires box geometry/);
    expect(problems(bad).join()).toMatch(/requires sphere geometry/);
  });
  it.each([0,-0.1,NaN,Infinity])('rejects sphere radius %s', radius => {
    const bad=fresh(); bad.objects[2].geometry.radius=radius;
    expect(problems(bad).join()).toMatch(/Radius must be positive and finite/);
  });
  it.each([3,9.5,300,NaN])('rejects invalid sphere segments %s', segments => {
    const bad=fresh(); bad.objects[2].geometry.widthSegments=segments;
    expect(problems(bad).join()).toMatch(/Segments must be an integer/);
  });
  it.each([-0.1,1.1,NaN,'0.5'])('rejects invalid material roughness %s', roughness => {
    const bad=fresh(); bad.objects[0].visual.roughness=roughness;
    expect(problems(bad).join()).toMatch(/Roughness must be between 0 and 1/);
  });
  it.each([-1,1.1,NaN])('rejects invalid material metalness %s', metalness => {
    const bad=fresh(); bad.objects[0].visual.metalness=metalness;
    expect(problems(bad).join()).toMatch(/Metalness must be between 0 and 1/);
  });
  it('rejects invalid material color/shadow flags', () => {
    const bad=fresh(); bad.objects[0].visual.color='red'; bad.objects[0].visual.castShadow='true';
    expect(problems(bad).join()).toMatch(/six-digit hex color/);
    expect(problems(bad).join()).toMatch(/Boolean required/);
  });
  it('rejects fixed ball or dynamic ground', () => {
    const bad=fresh(); bad.objects[2].physics.bodyType='fixed'; bad.objects[0].physics.bodyType='dynamic';
    expect(problems(bad).join()).toMatch(/Ball requires dynamic ball collider/);
    expect(problems(bad).join()).toMatch(/require fixed cuboid collider/);
  });
  it.each([-1, NaN, Infinity])('rejects invalid dynamic friction %s', value => {
    const bad=fresh(); bad.objects[2].physics.friction=value;
    expect(problems(bad).join()).toMatch(/Friction must be nonnegative and finite/);
  });
  it.each([-1, 1.01, NaN])('rejects invalid restitution %s', value => {
    const bad=fresh(); bad.objects[2].physics.restitution=value;
    expect(problems(bad).join()).toMatch(/Restitution must be between 0 and 1/);
  });
  it.each(['linearDamping','angularDamping'])('rejects negative %s', prop => {
    const bad=fresh(); bad.objects[2].physics[prop]=-0.001;
    expect(problems(bad).join()).toMatch(/damping must be nonnegative/);
  });
  it.each(['canSleep','ccd'])('requires boolean for %s', prop => {
    const bad=fresh(); bad.objects[2].physics[prop]='false';
    expect(problems(bad).join()).toMatch(/Boolean required/);
  });
  it('rejects unsupported physics props on fixed bodies', () => {
    const bad=fresh(); bad.objects[0].physics.restitution=0.3;
    expect(problems(bad).join()).toMatch(/Unknown field/);
  });
  it('rejects malformed JSON at the parser boundary', () => {
    expect(() => deserializeMechanicalScene('{broken')).toThrow('Malformed scene JSON');
    expect(() => deserializeMechanicalScene(JSON.stringify({ schemaVersion:99, objects:[] }))).toThrow(/Unsupported/);
  });
  it('rejects object count above the hard limit', () => {
    const bad={schemaVersion:1, objects:Array.from({length:10001},()=>null)};
    expect(problems(bad)[0]).toMatch(/10000-object limit/);
  });
});
