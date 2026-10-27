import { CircleDot, Cpu, MousePointer2 } from 'lucide-react';
import { useSimulationStore } from '../../features/simulation/store';

export function StatusBar() {
  const paused = useSimulationStore((state) => state.paused);
  return (
    <footer className="statusbar">
      <span className="footer-live"><CircleDot size={13}/>{paused ? 'WORLD PAUSED' : 'WORLD ACTIVE'}</span>
      <span className="footer-separator"/>
      <span><Cpu size={13}/> RAPIER PHYSICS</span>
      <span className="footer-separator"/>
      <span className="hide-mobile"><MousePointer2 size={13}/> ORBIT: DRAG · PAN: RIGHT-DRAG · ZOOM: WHEEL · RESET: C</span>
      <span className="footer-spacer"/>
      <span className="footer-version">WORKSPACE BUILD <b>0.11.0</b></span>
    </footer>
  );
}
