/** Pure interpreter; DOM focus checks and side effects live in App. */
export type EditorCommand = 'pause' | 'restart' | 'grid' | 'library' | 'inspector' | 'help' | 'escape' | 'camera-home' | 'camera-frame' | 'camera-top' | 'camera-front' | 'camera-side' | 'zoom-in' | 'zoom-out' | 'axes' | 'delete-selection' | 'edit-selection' | 'duplicate-selection';
export interface EditorKey {
  code: string;
  key: string;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
}
export function interpretEditorKey(event: EditorKey): EditorCommand | null {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return null;
  if (event.key === 'Escape') return 'escape';
  if (event.code === 'Delete' || event.code === 'Backspace') return 'delete-selection';
  if (event.key === '?' || (event.code === 'Slash' && event.shiftKey)) return 'help';
  switch (event.code) {
    case 'Space': return 'pause';
    case 'KeyR': return 'restart';
    case 'KeyG': return 'grid';
    case 'KeyL': return 'library';
    case 'KeyI': return 'inspector';
    case 'KeyC': return 'camera-home';
    case 'KeyF': return 'camera-frame';
    case 'Digit1': return 'camera-top';
    case 'Digit2': return 'camera-front';
    case 'Digit3': return 'camera-side';
    case 'Equal': return 'zoom-in';
    case 'NumpadAdd': return 'zoom-in';
    case 'Minus': return 'zoom-out';
    case 'NumpadSubtract': return 'zoom-out';
    case 'KeyA': return 'axes';
    case 'KeyE': return 'edit-selection';
    case 'KeyD': return 'duplicate-selection';
    default: return null;
  }
}
