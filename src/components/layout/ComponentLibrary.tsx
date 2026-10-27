import type { DragEvent } from 'react';
import { Box, CircleDot, Cog, Layers, MoveUpRight, Package, Route, Search, Waves, X } from 'lucide-react';
import { COMPONENT_CATALOG, filterCatalog, type CatalogCategory } from '../../features/workspace/catalog';
import { useWorkspaceStore } from '../../features/workspace/store';
import { PLACEABLE_KINDS, type PlaceableKind } from '../../domain/placement';
import { quickPlaceAtFreePosition } from '../../features/scene/actions';

const iconMap = { bodies: CircleDot, ramps: MoveUpRight, dominoes: Layers, levers: Route, gears: Cog, springs: Waves };
const categories: readonly { value: CatalogCategory; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'bodies', label: 'Bodies' }, { value: 'mechanisms', label: 'Mechanisms' },
];

export function ComponentLibrary() {
  const query = useWorkspaceStore(s => s.libraryQuery);
  const category = useWorkspaceStore(s => s.category);
  const activeId = useWorkspaceStore(s => s.activeCatalogId);
  const setQuery = useWorkspaceStore(s => s.setLibraryQuery);
  const setCategory = useWorkspaceStore(s => s.setCategory);
  const setActiveId = useWorkspaceStore(s => s.setActiveCatalogId);
  const setLibraryOpen = useWorkspaceStore(s => s.setLibraryOpen);
  const startPlacement = useWorkspaceStore(s => s.startPlacement);
  const startDrag = useWorkspaceStore(s => s.startDrag);
  const endDrag = useWorkspaceStore(s => s.endDrag);
  const armed = useWorkspaceStore(s => s.placementKind);
  const editing = useWorkspaceStore(s => !!s.editSession);
  const items = filterCatalog(query, category);
  const beginDrag = (event: DragEvent<HTMLElement>, kind: PlaceableKind) => {
    if(editing){event.preventDefault();return;}
    startDrag(kind);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', `kineticlab:${kind}`);
  };
  const placeableTitle: Record<PlaceableKind, string> = { ball: 'Sphere', stopper: 'Block', ramp: 'Ramp' };
  const active = COMPONENT_CATALOG.find(item => item.id === activeId);

  return (
    <aside className="left-panel" id="library-panel" aria-label="Mechanical component library">
      <div className="panel-topline"><div className="panel-eyebrow">YOUR WORKSPACE</div><button className="panel-close" type="button" aria-label="Close component library" onClick={() => setLibraryOpen(false)}><X size={16}/></button></div>
      <div className="panel-heading"><div><Package size={17}/> Component Library</div><span className="muted-badge">PLACE</span></div>
      <p className="panel-intro">Drag a supported primitive into the 3D workbench, or choose Place for keyboard and touch use.</p>
      <div className="placement-library" role="group" aria-label="Placeable primitive components">
        <div className="detail-kicker">PLACE NOW · DRAG OR CLICK</div>
        {PLACEABLE_KINDS.map(kind => (
          <button type="button" key={kind} draggable={!editing} disabled={editing} className={`placement-source ${armed === kind ? 'placement-source--active' : ''}`}
            onDragStart={event => beginDrag(event, kind)} onDragEnd={() => { if (useWorkspaceStore.getState().dragKind) { endDrag(); useWorkspaceStore.getState().setPlacementFeedback('Drag cancelled. No object added.'); } }}
            onClick={() => startPlacement(kind)} aria-pressed={armed === kind}
            aria-label={`Place ${placeableTitle[kind]} — click then click ground, or drag into workspace`}>
            <Box size={14}/><span>{placeableTitle[kind]}</span><span className="placement-source-hint">DRAG / PLACE</span>
          </button>
        ))}
        {armed && <button type="button" className="placement-quick-add" onClick={() => quickPlaceAtFreePosition(armed)}>
          <Box size={14}/> Add {placeableTitle[armed]} at next free spot
        </button>}
      </div>
      <label className="library-search"><Search size={15}/><span className="sr-only">Search components</span><input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Search components" aria-label="Search components" /></label>
      <div className="library-filters" role="group" aria-label="Filter component types">
        {categories.map(item => <button key={item.value} type="button" className={`filter-chip ${category === item.value ? 'filter-chip--active' : ''}`} onClick={() => setCategory(item.value)} aria-pressed={category === item.value}>{item.label}</button>)}
      </div>
      <div className="library-heading"><span>MECHANICAL OBJECTS</span><span>{String(items.length).padStart(2, '0')}</span></div>
      <div className="library-list">
        {items.map(item => {
          const Icon = iconMap[item.id as keyof typeof iconMap];
          return (
            <button type="button" className={`library-item ${activeId === item.id ? 'library-item--selected' : ''}`} aria-pressed={activeId === item.id} aria-label={`Preview ${item.label}, available for placement in Stage ${item.stage}`} key={item.id} onClick={() => setActiveId(activeId === item.id ? null : item.id)}>
              <span className={`library-icon library-icon--${item.tone}`}><Icon size={19} strokeWidth={1.7}/></span>
              <span className="library-copy"><strong>{item.label}</strong><span>{item.detail}</span></span>
              <span className="library-lock">S{item.stage}</span>
            </button>
          );
        })}
        {items.length === 0 ? <div className="library-empty" role="status">No component previews match your search. <button type="button" onClick={() => { setQuery(''); setCategory('all'); }}>Clear filters</button></div> : null}
      </div>
      {active ? (
        <section className="library-detail" aria-live="polite" aria-label="Component preview details">
          <div className="detail-kicker">COMPONENT PREVIEW · STAGE {active.stage}</div>
          <strong>{active.label}</strong><p>{active.description}</p>
          <span className="read-only-pill">{active.id === 'bodies' || active.id === 'ramps' ? 'Place supported primitives above' : 'Advanced mechanism arrives in a later stage'}</span>
        </section>
      ) : (
        <div className="library-tip"><Box size={19}/><div><strong>How to explore</strong><p>Use the Sphere, Block or Ramp buttons above to place primitives. Gears, levers and springs are preview-only.</p></div></div>
      )}
    </aside>
  );
}
