import { trpcServer } from './trpc-server.js';

describe('trpcServer', () => {
  it('should work', () => {
    expect(trpcServer()).toEqual('trpc-server');
  });
});
