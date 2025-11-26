import { boundedContexts } from './bounded-contexts.js';

describe('boundedContexts', () => {
  it('should work', () => {
    expect(boundedContexts()).toEqual('bounded-contexts');
  });
});
