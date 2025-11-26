import { render } from '@testing-library/react';

import AiWorkbenchFrontendUi from './ui';

describe('AiWorkbenchFrontendUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AiWorkbenchFrontendUi />);
    expect(baseElement).toBeTruthy();
  });
});
