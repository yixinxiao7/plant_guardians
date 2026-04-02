import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
}));

describe('StatusBadge', () => {
  it('renders without crashing', () => {
    render(<StatusBadge status="on_track" />);
    expect(screen.getByText('On track')).toBeInTheDocument();
  });

  it('renders on_track status', () => {
    render(<StatusBadge status="on_track" />);
    expect(screen.getByText('On track').closest('.status-badge')).toHaveClass('status-badge-on-track');
  });

  it('renders due_today status', () => {
    render(<StatusBadge status="due_today" />);
    expect(screen.getByText('Due today').closest('.status-badge')).toHaveClass('status-badge-due-today');
  });

  it('renders overdue status with days', () => {
    render(<StatusBadge status="overdue" daysOverdue={3} />);
    expect(screen.getByText('3 days overdue').closest('.status-badge')).toHaveClass('status-badge-overdue');
  });

  it('renders overdue status with 1 day (singular)', () => {
    render(<StatusBadge status="overdue" daysOverdue={1} />);
    expect(screen.getByText('1 day overdue')).toBeInTheDocument();
  });

  it('renders not_set status', () => {
    render(<StatusBadge status="not_set" />);
    expect(screen.getByText('Not set').closest('.status-badge')).toHaveClass('status-badge-not-set');
  });

  // T-052: Care-type prefixed badges
  it('renders watering badge with Drop icon and overdue text', () => {
    render(<StatusBadge status="overdue" daysOverdue={2} careType="watering" />);
    expect(screen.getByTestId('icon-drop')).toBeInTheDocument();
    expect(screen.getByText('Watering: 2 days overdue')).toBeInTheDocument();
    expect(screen.getByText('Watering: 2 days overdue').closest('.status-badge')).toHaveClass('status-badge-overdue');
  });

  it('renders fertilizing badge with Leaf icon and on track text', () => {
    render(<StatusBadge status="on_track" careType="fertilizing" />);
    expect(screen.getByTestId('icon-leaf')).toBeInTheDocument();
    expect(screen.getByText('Fertilizing: On track')).toBeInTheDocument();
    expect(screen.getByText('Fertilizing: On track').closest('.status-badge')).toHaveClass('status-badge-on-track');
  });

  it('renders repotting badge with PottedPlant icon and due today text', () => {
    render(<StatusBadge status="due_today" careType="repotting" />);
    expect(screen.getByTestId('icon-potted-plant')).toBeInTheDocument();
    expect(screen.getByText('Repotting: Due today')).toBeInTheDocument();
    expect(screen.getByText('Repotting: Due today').closest('.status-badge')).toHaveClass('status-badge-due-today');
  });

  it('renders watering overdue 1 day with singular text', () => {
    render(<StatusBadge status="overdue" daysOverdue={1} careType="watering" />);
    expect(screen.getByText('Watering: 1 day overdue')).toBeInTheDocument();
  });

  it('does not render icon when no careType provided', () => {
    render(<StatusBadge status="not_set" />);
    expect(screen.queryByTestId('icon-drop')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-leaf')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-potted-plant')).not.toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('applies status-badge-with-icon class when careType provided', () => {
    render(<StatusBadge status="on_track" careType="watering" />);
    expect(screen.getByText('Watering: On track').closest('.status-badge')).toHaveClass('status-badge-with-icon');
  });
});
