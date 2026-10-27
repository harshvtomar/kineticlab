/** Stage 4: immutable, JSON-compatible mechanical scene description.
 * Units are metres and radians. No React/Rapier dependencies are allowed here.
 */
export type Vec3 = readonly [number, number, number];
export type ObjectKind = 'ground' | 'ramp' | 'ball' | 'stopper';
export interface Transform {
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
}
export interface BoxGeometry { readonly shape: 'box'; readonly dimensions: Vec3; }
export interface SphereGeometry {
  readonly shape: 'sphere'; readonly radius: number;
  readonly widthSegments: number; readonly heightSegments: number;
}
export interface VisualMaterial {
  readonly color: string; readonly roughness: number; readonly metalness: number;
  readonly castShadow: boolean; readonly receiveShadow: boolean;
}
export interface FixedPhysics { readonly bodyType: 'fixed'; readonly collider: 'cuboid'; }
export interface DynamicBallPhysics {
  readonly bodyType: 'dynamic'; readonly collider: 'ball';
  readonly friction: number; readonly restitution: number;
  readonly linearDamping: number; readonly angularDamping: number;
  readonly canSleep: boolean; readonly ccd: boolean;
}
interface BaseObject {
  readonly id: string; readonly label: string; readonly transform: Transform;
  readonly visual: VisualMaterial;
}
export type MechanicalObject =
  | (BaseObject & { readonly kind: 'ground'; readonly geometry: BoxGeometry; readonly physics: FixedPhysics })
  | (BaseObject & { readonly kind: 'ramp'; readonly geometry: BoxGeometry; readonly physics: FixedPhysics })
  | (BaseObject & { readonly kind: 'stopper'; readonly geometry: BoxGeometry; readonly physics: FixedPhysics })
  | (BaseObject & { readonly kind: 'ball'; readonly geometry: SphereGeometry; readonly physics: DynamicBallPhysics });
export interface MechanicalScene {
  readonly schemaVersion: 1;
  readonly objects: readonly MechanicalObject[];
}
export interface ValidationIssue { readonly path: string; readonly message: string; }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const vec3 = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every(finite);
const positiveVec3 = (v: unknown): v is Vec3 => vec3(v) && v.every(n => n > 0);
const unit = (v: unknown): v is number => finite(v) && v >= 0 && v <= 1;
const nonnegative = (v: unknown): v is number => finite(v) && v >= 0;
const idValid = (v: unknown): v is string => typeof v === 'string' && v.length <= 100 && /^[A-Za-z][A-Za-z0-9_-]*$/.test(v);

/** No silently accepted unknown fields: accidental schema changes must be migrated. */
function fields(value: Record<string, unknown>, keys: readonly string[], path: string, issues: ValidationIssue[]) {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) issues.push({ path: `${path}.${key}`, message: 'Unknown field' });
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) issues.push({ path: `${path}.${key}`, message: 'Required field missing' });
  }
}
function check(condition: boolean, path: string, message: string, issues: ValidationIssue[]) {
  if (!condition) issues.push({ path, message });
}
const KINDS: readonly ObjectKind[] = ['ground','ramp','ball','stopper'];

/** Returns all actionable errors rather than silently repairing invalid inputs. */
export function validateMechanicalScene(value: unknown): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) return [{ path: '$', message: 'Scene must be an object' }];
  fields(value, ['schemaVersion','objects'], '$', issues);
  check(value.schemaVersion === 1, '$.schemaVersion', 'Unsupported schema version (expected 1)', issues);
  if (!Array.isArray(value.objects)) {
    issues.push({ path: '$.objects', message: 'Objects must be an array' });
    return issues;
  }
  check(value.objects.length <= 10000, '$.objects', 'Scene exceeds the 10000-object limit', issues);
  const ids = new Set<string>();
  for (const [index, entry] of value.objects.entries()) {
    const p = `$.objects[${index}]`;
    if (!isRecord(entry)) { issues.push({ path: p, message: 'Object descriptor required' }); continue; }
    fields(entry, ['id','label','kind','transform','geometry','visual','physics'], p, issues);
    check(idValid(entry.id), `${p}.id`, 'ID must be nonblank, unique, ASCII alphanumeric/underscore/hyphen, <=100 chars', issues);
    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) issues.push({ path: `${p}.id`, message: `Duplicate object ID: ${entry.id}` });
      ids.add(entry.id);
    }
    check(typeof entry.label === 'string' && entry.label.trim().length > 0 && entry.label.length <= 160, `${p}.label`, 'Label must be nonempty and <=160 chars', issues);
    const validKind = KINDS.includes(entry.kind as ObjectKind);
    check(validKind, `${p}.kind`, 'Unknown component kind', issues);

    const transform = entry.transform;
    if (!isRecord(transform)) issues.push({ path: `${p}.transform`, message: 'Transform object required' });
    else {
      fields(transform, ['position','rotation','scale'], `${p}.transform`, issues);
      check(vec3(transform.position), `${p}.transform.position`, 'Position must contain three finite numbers', issues);
      check(vec3(transform.rotation), `${p}.transform.rotation`, 'Rotation must contain three finite radians', issues);
      check(positiveVec3(transform.scale), `${p}.transform.scale`, 'Scale must contain three positive finite numbers', issues);
    }

    const geometry = entry.geometry;
    if (!isRecord(geometry)) issues.push({ path: `${p}.geometry`, message: 'Geometry object required' });
    else if (entry.kind === 'ball') {
      fields(geometry, ['shape','radius','widthSegments','heightSegments'], `${p}.geometry`, issues);
      check(geometry.shape === 'sphere', `${p}.geometry.shape`, 'Ball requires sphere geometry', issues);
      check(finite(geometry.radius) && geometry.radius > 0, `${p}.geometry.radius`, 'Radius must be positive and finite', issues);
      check(Number.isInteger(geometry.widthSegments) && finite(geometry.widthSegments) && geometry.widthSegments >= 8 && geometry.widthSegments <= 256, `${p}.geometry.widthSegments`, 'Segments must be an integer from 8 to 256', issues);
      check(Number.isInteger(geometry.heightSegments) && finite(geometry.heightSegments) && geometry.heightSegments >= 6 && geometry.heightSegments <= 256, `${p}.geometry.heightSegments`, 'Segments must be an integer from 6 to 256', issues);
    } else {
      fields(geometry, ['shape','dimensions'], `${p}.geometry`, issues);
      check(geometry.shape === 'box', `${p}.geometry.shape`, 'This kind requires box geometry', issues);
      check(positiveVec3(geometry.dimensions), `${p}.geometry.dimensions`, 'Box dimensions must be positive finite numbers', issues);
    }

    const visual = entry.visual;
    if (!isRecord(visual)) issues.push({ path: `${p}.visual`, message: 'Visual material required' });
    else {
      fields(visual, ['color','roughness','metalness','castShadow','receiveShadow'], `${p}.visual`, issues);
      check(typeof visual.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(visual.color), `${p}.visual.color`, 'Use a six-digit hex color', issues);
      check(unit(visual.roughness), `${p}.visual.roughness`, 'Roughness must be between 0 and 1', issues);
      check(unit(visual.metalness), `${p}.visual.metalness`, 'Metalness must be between 0 and 1', issues);
      check(typeof visual.castShadow === 'boolean', `${p}.visual.castShadow`, 'Boolean required', issues);
      check(typeof visual.receiveShadow === 'boolean', `${p}.visual.receiveShadow`, 'Boolean required', issues);
    }

    const physics = entry.physics;
    if (!isRecord(physics)) issues.push({ path: `${p}.physics`, message: 'Physics settings required' });
    else if (entry.kind === 'ball') {
      fields(physics, ['bodyType','collider','friction','restitution','linearDamping','angularDamping','canSleep','ccd'], `${p}.physics`, issues);
      check(physics.bodyType === 'dynamic' && physics.collider === 'ball', `${p}.physics`, 'Ball requires dynamic ball collider', issues);
      check(nonnegative(physics.friction), `${p}.physics.friction`, 'Friction must be nonnegative and finite', issues);
      check(unit(physics.restitution), `${p}.physics.restitution`, 'Restitution must be between 0 and 1', issues);
      check(nonnegative(physics.linearDamping), `${p}.physics.linearDamping`, 'Linear damping must be nonnegative and finite', issues);
      check(nonnegative(physics.angularDamping), `${p}.physics.angularDamping`, 'Angular damping must be nonnegative and finite', issues);
      check(typeof physics.canSleep === 'boolean', `${p}.physics.canSleep`, 'Boolean required', issues);
      check(typeof physics.ccd === 'boolean', `${p}.physics.ccd`, 'Boolean required', issues);
    } else {
      fields(physics, ['bodyType','collider'], `${p}.physics`, issues);
      check(physics.bodyType === 'fixed' && physics.collider === 'cuboid', `${p}.physics`, 'Ground, ramp and stopper require fixed cuboid collider', issues);
    }
  }
  return issues;
}

function freezeDeep<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Validates and creates an immutable snapshot detached from caller-owned arrays. */
export function createMechanicalScene(input: unknown): MechanicalScene {
  const issues = validateMechanicalScene(input);
  if (issues.length) throw new Error(`Invalid mechanical scene:\n${issues.map(i => `${i.path}: ${i.message}`).join('\n')}`);
  // Clone via JSON only after finite-value validation; protects against shared mutable references.
  return freezeDeep(JSON.parse(JSON.stringify(input)) as MechanicalScene);
}

export function serializeMechanicalScene(scene: MechanicalScene): string {
  const valid = createMechanicalScene(scene);
  return JSON.stringify(valid, null, 2);
}

/** Safe JSON boundary; rejects malformed JSON, unsupported versions and invalid descriptors. */
export function deserializeMechanicalScene(json: string): MechanicalScene {
  if (typeof json !== 'string') throw new Error('Scene JSON must be a string');
  let decoded: unknown;
  try { decoded = JSON.parse(json) as unknown; }
  catch { throw new Error('Malformed scene JSON'); }
  return createMechanicalScene(decoded);
}

export function selectMechanicalObjects(scene: MechanicalScene): readonly MechanicalObject[] {
  return scene.objects;
}
export function selectMechanicalObject(scene: MechanicalScene, id: string | null): MechanicalObject | undefined {
  return id === null ? undefined : scene.objects.find(o => o.id === id);
}
export function selectByKind(scene: MechanicalScene, kind: ObjectKind): readonly MechanicalObject[] {
  return Object.freeze(scene.objects.filter(o => o.kind === kind));
}
