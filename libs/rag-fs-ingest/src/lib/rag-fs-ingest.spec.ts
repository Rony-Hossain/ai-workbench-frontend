import { ragFsIngest } from './rag-fs-ingest.js';

describe('ragFsIngest', () => {
  it('should work', () => {
    expect(ragFsIngest()).toEqual('rag-fs-ingest');
  });
});
