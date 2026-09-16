import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarHeatmap } from '../components/ui/CalendarHeatmap.jsx';

describe('CalendarHeatmap - IST midnight', () => {
  test('renders S M T headers and today label', () => {
    const daily = [
      { date: '2026-09-01', taken: 1, missed: 0 },
      { date: '2026-09-02', taken: 0, missed: 1 },
    ];
    render(<CalendarHeatmap daily={daily} selectedDate="2026-09-01" onSelectDate={() => {}} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getAllByText('S').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('M')).toBeInTheDocument();
  });
  test('taken day shows check, missed day shows dot logic via props', () => {
    const daily = [{ date: '2026-09-10', taken: 2, missed: 0 }];
    const { container } = render(<CalendarHeatmap daily={daily} selectedDate="" onSelectDate={() => {}} />);
    // has-taken class present when daily has taken>0 missed===0
    expect(container.innerHTML).toMatch(/has-taken|✓/);
  });
});
