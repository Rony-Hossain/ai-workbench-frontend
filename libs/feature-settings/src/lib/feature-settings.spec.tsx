import { render } from '@testing-library/react';

import AiWorkbenchFrontendFeatureSettings from './feature-settings';

describe('AiWorkbenchFrontendFeatureSettings', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AiWorkbenchFrontendFeatureSettings />);
    expect(baseElement).toBeTruthy();
  });
});
