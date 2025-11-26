import { render } from '@testing-library/react';

import AiWorkbenchFrontendIcons from './icons';

describe('AiWorkbenchFrontendIcons', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AiWorkbenchFrontendIcons />);
    expect(baseElement).toBeTruthy();
  });
});
