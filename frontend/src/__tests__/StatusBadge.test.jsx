import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge.jsx';

describe('StatusBadge', () => {
  it('renders without crashing', () => {
    render(<StatusBadge status="on_track" />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders on_track status', () => {
    render(<StatusBadge status="on_track" />);
    expect(screen.getByText('On Track')).toHaveClass('status-badge-on-track');
  });

  it('renders due_today status', () => {
    render(<StatusBadge status="due_today" />);
    expect(screen.getByText('Due Today')).toHaveClass('status-badge-due-today');
  });

  it('renders overdue status with days', () => {
    render(<StatusBadge status="overdue" daysOverdue={3} />);
    expect(screen.getByText('3 days overdue')).toHaveClass('status-badge-overdue');
  });

  it('renders overdue status with 1 day (singular)', () => {
    render(<StatusBadge status="overdue" daysOverdue={1} />);
    expect(screen.getByText('1 day overdue')).toBeInTheDocument();
  });

  it('renders not_set status', () => {
    render(<StatusBadge status="not_set" />);
    expect(screen.getByText('Not set')).toHaveClass('status-badge-not-set');
  });
});
