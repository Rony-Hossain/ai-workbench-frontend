import { electronBridge } from './electron-bridge.js';

describe('electronBridge', () => {
  it('should work', () => {
    expect(electronBridge()).toEqual('electron-bridge');
  });
});
