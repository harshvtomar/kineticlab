import { create } from 'zustand';
import {
  GRID_SPACINGS, type CameraCommand, type CameraView, type GridSpacing,
} from './views';

interface CameraState {
  requestedCommand: CameraCommand;
  requestId: number;
  activeView: CameraView | 'custom';
  gridSpacing: GridSpacing;
  axesVisible: boolean;
  requestCamera: (command: CameraCommand) => void;
  setGridSpacing: (spacing: number) => void;
  toggleAxes: () => void;
}

export const initialCameraView = {
  requestedCommand: 'home' as CameraCommand,
  requestId: 0,
  activeView: 'home' as CameraView | 'custom',
  gridSpacing: 1 as GridSpacing,
  axesVisible: true,
};

/** Separate view state: never resets or mutates the Rapier rigid-body simulation. */
export const useCameraStore = create<CameraState>((set) => ({
  ...initialCameraView,
  requestCamera: (requestedCommand) => set(state => ({
    requestedCommand,
    requestId: state.requestId + 1,
    activeView: requestedCommand === 'zoom-in' || requestedCommand === 'zoom-out' ? 'custom' : requestedCommand,
  })),
  setGridSpacing: (gridSpacing) => {
    if (GRID_SPACINGS.includes(gridSpacing as GridSpacing)) set({ gridSpacing: gridSpacing as GridSpacing });
  },
  toggleAxes: () => set(state => ({ axesVisible: !state.axesVisible })),
}));
