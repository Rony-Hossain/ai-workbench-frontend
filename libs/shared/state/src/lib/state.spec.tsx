import { render } from '@testing-library/react';

import AiWorkbenchFrontendState from './state';

describe('AiWorkbenchFrontendState', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AiWorkbenchFrontendState />);
    expect(baseElement).toBeTruthy();
  });
});
