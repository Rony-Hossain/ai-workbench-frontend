import { render } from '@testing-library/react';

import AiWorkbenchFrontendLayout from './layout';

describe('AiWorkbenchFrontendLayout', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AiWorkbenchFrontendLayout />);
    expect(baseElement).toBeTruthy();
  });
});
