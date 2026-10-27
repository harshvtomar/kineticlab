import { describe, expect, it } from 'vitest';
import { interpretEditorKey } from './shortcuts';

describe('editor shortcuts', () => {
  it.each([
    ['Space',' ','pause'],['KeyR','r','restart'],['KeyG','g','grid'],
    ['KeyL','l','library'],['KeyI','i','inspector'],['Slash','?','help'],
    ['Escape','Escape','escape'],['Delete','Delete','delete-selection'],['Backspace','Backspace','delete-selection'],
    ['KeyC','c','camera-home'],['KeyF','f','camera-frame'],
    ['Digit1','1','camera-top'],['Digit2','2','camera-front'],['Digit3','3','camera-side'],
    ['Equal','+','zoom-in'],['Minus','-','zoom-out'],['KeyA','a','axes'],
  ] as const)('maps %s correctly', (code, key, command) => {
    expect(interpretEditorKey({ code, key })).toBe(command);
  });
  it('ignores keys reserved by other applications', () => {
    expect(interpretEditorKey({ code: 'KeyR', key: 'r', metaKey: true })).toBeNull();
    expect(interpretEditorKey({ code: 'KeyR', key: 'r', ctrlKey: true })).toBeNull();
    expect(interpretEditorKey({ code: 'KeyR', key: 'r', repeat: true })).toBeNull();
    expect(interpretEditorKey({ code: 'KeyZ', key: 'z' })).toBeNull();
    expect(interpretEditorKey({ code: 'KeyF', key: 'f', metaKey: true })).toBeNull();
    expect(interpretEditorKey({ code: 'Digit1', key: '1', repeat: true })).toBeNull();
  });
});
