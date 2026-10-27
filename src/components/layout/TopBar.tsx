import { Box, CircleHelp, GitBranch, Hexagon, Layers3 } from 'lucide-react';
import { useWorkspaceStore } from '../../features/workspace/store';

export function TopBar() {
  const showHelp = useWorkspaceStore(s => s.setHelpOpen);
  return (
    <header className="topbar">
      <div className="brand" aria-label="KineticLab home">
        <div className="brand-icon"><Hexagon size={24} strokeWidth={2.1}/><span className="brand-core" /></div>
        <div className="brand-name">KINETIC<span>LAB</span><small>MECHANICAL PLAYGROUND</small></div>
      </div>
      <div className="top-divider" />
      <div className="project-crumb"><span className="muted">Workspace</span><span className="slash">/</span><b>Starter Laboratory</b></div>
      <div className="top-actions">
        <span className="top-version"><GitBranch size={14}/> v0.12.1</span>
        <span className="stage-pill"><span className="stage-dot"/> LEVERS · 12</span>
        <button type="button" className="top-icon" onClick={() => showHelp(true)} aria-label="Open keyboard shortcuts and help" title="Help & shortcuts"><CircleHelp size={19}/></button>
        <div className="top-avatar" aria-hidden="true"><Layers3 size={17}/></div>
      </div>
    </header>
  );
}
export function MobileTopBar() {
  return <div className="mobile-title"><Box size={16}/> KineticLab · Interactive workspace</div>;
}
