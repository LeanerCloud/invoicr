import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContributeSection } from './ContributeSection';

describe('ContributeSection', () => {
  it('should render contribution instructions', () => {
    const onSubmit = vi.fn();
    render(<ContributeSection onSubmitTranslation={onSubmit} />);

    expect(screen.getByText('How to contribute translations:')).toBeInTheDocument();
    expect(screen.getByText(/Edit the translations above/)).toBeInTheDocument();
    expect(screen.getByText(/copy button to copy the JSON/)).toBeInTheDocument();
    expect(screen.getByText(/Click the button below to open a GitHub issue/)).toBeInTheDocument();
    expect(screen.getByText(/Paste your translations/)).toBeInTheDocument();
  });

  it('should render the Open GitHub Issue button', () => {
    const onSubmit = vi.fn();
    render(<ContributeSection onSubmitTranslation={onSubmit} />);

    expect(screen.getByRole('button', { name: 'Open GitHub Issue' })).toBeInTheDocument();
  });

  it('should call onSubmitTranslation when button is clicked', () => {
    const onSubmit = vi.fn();
    render(<ContributeSection onSubmitTranslation={onSubmit} />);

    const button = screen.getByRole('button', { name: 'Open GitHub Issue' });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
