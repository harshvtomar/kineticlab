/** Pure, searchable component catalog. These are previews, NOT draggable objects yet. */
export type CatalogCategory = 'all' | 'bodies' | 'mechanisms';
export interface CatalogItem {
  id: string;
  label: string;
  detail: string;
  category: Exclude<CatalogCategory, 'all'>;
  stage: string;
  description: string;
  tone: 'sky' | 'amber' | 'violet' | 'rose' | 'teal' | 'green';
}

export const COMPONENT_CATALOG: readonly CatalogItem[] = [
  { id: 'bodies', label: 'Spheres & Blocks', detail: 'Rigid bodies', category: 'bodies', stage: '8–10', tone: 'sky', description: 'Dynamic spheres and fixed blocks for the editable scene; open the Stage 10 ramp bench for friction and motion experiments.' },
  { id: 'ramps', label: 'Ramps & Planes', detail: 'Inclined surfaces', category: 'bodies', stage: '10', tone: 'amber', description: 'Experiment with adjustable slope, friction and restitution in the Stage 10 ramp laboratory.' },
  { id: 'dominoes', label: 'Dominoes', detail: 'Chain reactions', category: 'bodies', stage: '11', tone: 'violet', description: 'Repeatable domino sequences with spacing and collision response.' },
  { id: 'levers', label: 'Levers', detail: 'Pivot mechanics', category: 'mechanisms', stage: '12', tone: 'rose', description: 'Rigid arms with hinges, loads and torque constraints.' },
  { id: 'gears', label: 'Gears', detail: 'Rotational motion', category: 'mechanisms', stage: '13–14', tone: 'teal', description: 'Parametric gear models and controlled rotational coupling.' },
  { id: 'springs', label: 'Springs', detail: 'Elastic forces', category: 'mechanisms', stage: '18', tone: 'green', description: 'Elastic elements with stiffness and damping parameters.' },
];

export function filterCatalog(query: string, category: CatalogCategory): readonly CatalogItem[] {
  const needle = query.trim().toLocaleLowerCase();
  return COMPONENT_CATALOG.filter(item =>
    (category === 'all' || item.category === category) &&
    (!needle || `${item.label} ${item.detail} ${item.description}`.toLocaleLowerCase().includes(needle))
  );
}
