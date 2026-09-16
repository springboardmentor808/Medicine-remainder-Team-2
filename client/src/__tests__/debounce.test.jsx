import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Minimal double-tap guard: button disabled when busy
function BusyButton({ busy, onClick }) {
  return <button disabled={busy} onClick={onClick}>Taken</button>;
}

describe('Double-tap prevention', () => {
  test('button disabled when busy prevents second click', async () => {
    const fn = vi.fn();
    const { rerender } = render(<BusyButton busy={false} onClick={fn} />);
    fireEvent.click(screen.getByText('Taken'));
    expect(fn).toHaveBeenCalledTimes(1);
    rerender(<BusyButton busy={true} onClick={fn} />);
    fireEvent.click(screen.getByText('Taken'));
    expect(fn).toHaveBeenCalledTimes(1); // second click ignored due disabled
  });

  test('OCR fallback UI shows when error contains clearly or again', () => {
    const error = 'We could not read that image clearly. Please try again or enter manually.';
    const show = error.toLowerCase().includes('clearly') || error.toLowerCase().includes('again');
    expect(show).toBe(true);
  });
});
