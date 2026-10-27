import { Compass, Focus, Home, Minus, Plus, Scan, Rotate3D, PanelTop, PanelBottom, PanelRight as SideIcon } from 'lucide-react';
import { useCameraStore } from '../../features/camera/store';
import { GRID_SPACINGS, type CameraCommand } from '../../features/camera/views';
import { useSimulationStore } from '../../features/simulation/store';

const views: readonly { command: CameraCommand; label: string; shortcut: string; Icon: typeof Home }[] = [
  { command: 'home', label: 'Home', shortcut: 'C', Icon: Home },
  { command: 'frame', label: 'Frame', shortcut: 'F', Icon: Focus },
  { command: 'top', label: 'Top', shortcut: '1', Icon: PanelTop },
  { command: 'front', label: 'Front', shortcut: '2', Icon: PanelBottom },
  { command: 'side', label: 'Side', shortcut: '3', Icon: SideIcon },
];

/** Stage 3 buttons are ordinary HTML elements, accessible without WebGL pointer gestures. */
export function CameraToolbar() {
  const activeView = useCameraStore(s => s.activeView);
  const requestCamera = useCameraStore(s => s.requestCamera);
  const spacing = useCameraStore(s => s.gridSpacing);
  const setGridSpacing = useCameraStore(s => s.setGridSpacing);
  const axesVisible = useCameraStore(s => s.axesVisible);
  const toggleAxes = useCameraStore(s => s.toggleAxes);
  const showGrid = useSimulationStore(s => s.showGrid);
  return (
    <div className="camera-toolbar" role="group" aria-label="3D workspace camera and grid settings">
      <div className="camera-toolbar-label"><Rotate3D size={14} aria-hidden="true"/> CAMERA</div>
      <div className="camera-toolbar-views" role="group" aria-label="Camera views">
        {views.map(({ command, label, shortcut, Icon }) => (
          <button key={command} type="button" className={`camera-button ${activeView === command ? 'camera-button--active' : ''}`}
            onClick={() => requestCamera(command)} title={`${label} view (${shortcut})`}
            aria-label={`${label} camera view`} aria-keyshortcuts={shortcut} aria-pressed={activeView === command}>
            <Icon size={14} aria-hidden="true"/> <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="camera-zoom" role="group" aria-label="Camera zoom">
        <button type="button" className="camera-button" onClick={() => requestCamera('zoom-out')} title="Zoom out (-)" aria-label="Zoom out" aria-keyshortcuts="-"><Minus size={15}/></button>
        <button type="button" className="camera-button" onClick={() => requestCamera('zoom-in')} title="Zoom in (+)" aria-label="Zoom in" aria-keyshortcuts="+"><Plus size={15}/></button>
      </div>
      <div className="camera-toolbar-spacer"/>
      <label className="grid-select-label" htmlFor="grid-spacing"><Scan size={14} aria-hidden="true"/> Grid</label>
      <select id="grid-spacing" className="grid-select" value={spacing} disabled={!showGrid}
        onChange={event => setGridSpacing(Number(event.currentTarget.value))} aria-label="Grid spacing in meters">
        {GRID_SPACINGS.map(item => <option key={item} value={item}>{item} m</option>)}
      </select>
      <button type="button" className={`camera-button ${axesVisible ? 'camera-button--active' : ''}`}
        aria-label="Toggle 3D axis helpers" aria-keyshortcuts="A" aria-pressed={axesVisible}
        onClick={toggleAxes} title="Toggle axes (A)"><Compass size={15} aria-hidden="true"/> Axes</button>
    </div>
  );
}
