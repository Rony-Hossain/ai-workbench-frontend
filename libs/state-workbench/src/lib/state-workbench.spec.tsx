import { render } from '@testing-library/react';

import AiWorkbenchFrontendStateWorkbench from './state-workbench';

describe('AiWorkbenchFrontendStateWorkbench', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AiWorkbenchFrontendStateWorkbench />);
    expect(baseElement).toBeTruthy();
  });
});
