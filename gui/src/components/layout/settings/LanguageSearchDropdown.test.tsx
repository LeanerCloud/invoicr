import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSearchDropdown } from './LanguageSearchDropdown';

describe('LanguageSearchDropdown', () => {
  it('should render search input with placeholder', () => {
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    expect(screen.getByPlaceholderText('Search and add a language...')).toBeInTheDocument();
  });

  it('should show custom placeholder', () => {
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
        placeholder="Add language"
      />
    );

    expect(screen.getByPlaceholderText('Add language')).toBeInTheDocument();
  });

  it('should show dropdown when focused', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);

    // Should show available languages (excluding 'en' which is already active)
    expect(screen.getByText('German')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
  });

  it('should filter languages based on search', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);
    await user.type(input, 'ger');

    expect(screen.getByText('German')).toBeInTheDocument();
    expect(screen.queryByText('French')).not.toBeInTheDocument();
  });

  it('should call onAddLanguage when a language is selected', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);

    const germanOption = screen.getByText('German');
    await user.click(germanOption);

    expect(onAddLanguage).toHaveBeenCalledWith('de');
  });

  it('should not show already active languages', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en', 'de', 'fr']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);

    expect(screen.queryByText('English')).not.toBeInTheDocument();
    expect(screen.queryByText('German')).not.toBeInTheDocument();
    expect(screen.queryByText('French')).not.toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
  });

  it('should search by native name', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);
    await user.type(input, 'Deutsch');

    expect(screen.getByText('German')).toBeInTheDocument();
  });

  it('should search by language code', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);
    await user.type(input, 'de');

    expect(screen.getByText('German')).toBeInTheDocument();
  });

  it('should show "no languages found" when search has no results', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);
    await user.type(input, 'xyzabc');

    expect(screen.getByText(/No languages found matching/)).toBeInTheDocument();
  });

  it('should show tip for invalid language code format', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);
    await user.type(input, 'toolong');

    expect(screen.getByText(/Tip: Enter a 2-3 letter language code/)).toBeInTheDocument();
  });

  it('should offer to add custom language for valid codes', async () => {
    const user = userEvent.setup();
    const onAddLanguage = vi.fn();
    render(
      <LanguageSearchDropdown
        activeLanguages={['en']}
        onAddLanguage={onAddLanguage}
      />
    );

    const input = screen.getByPlaceholderText('Search and add a language...');
    await user.click(input);
    await user.type(input, 'xyz');

    expect(screen.getByText(/Add "xyz" as new language/)).toBeInTheDocument();
  });
});
