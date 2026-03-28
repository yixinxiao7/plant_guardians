import { render, screen, fireEvent } from '@testing-library/react';
import CareScheduleForm from '../components/CareScheduleForm.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Plus: (props) => <span data-testid="icon-plus" {...props} />,
  CaretDown: (props) => <span data-testid="icon-caret-down" {...props} />,
  CaretUp: (props) => <span data-testid="icon-caret-up" {...props} />,
}));

describe('CareScheduleForm', () => {
  it('renders without crashing', () => {
    render(
      <CareScheduleForm
        careType="watering"
        label="Watering"
        onFrequencyChange={() => {}}
        onLastDoneChange={() => {}}
      />
    );
    expect(screen.getByText('Add watering schedule')).toBeInTheDocument();
  });

  it('renders collapsed toggle when not required', () => {
    render(
      <CareScheduleForm
        careType="fertilizing"
        label="Fertilizing"
        required={false}
        onFrequencyChange={() => {}}
        onLastDoneChange={() => {}}
      />
    );
    expect(screen.getByText('Add fertilizing schedule')).toBeInTheDocument();
  });

  it('renders expanded fields when required', () => {
    render(
      <CareScheduleForm
        careType="watering"
        label="Watering"
        required
        frequency={{ value: '7', unit: 'days' }}
        onFrequencyChange={() => {}}
        onLastDoneChange={() => {}}
      />
    );
    expect(screen.getByText('Watering')).toBeInTheDocument();
    expect(screen.getByLabelText('Watering frequency number')).toBeInTheDocument();
    expect(screen.getByLabelText('Watering frequency unit')).toBeInTheDocument();
  });

  // T-046: onExpand callback tests
  it('calls onExpand when clicking the expand toggle in controlled mode', () => {
    const onExpand = vi.fn();
    render(
      <CareScheduleForm
        careType="fertilizing"
        label="Fertilizing"
        expanded={false}
        onExpand={onExpand}
        frequency={{ value: '', unit: 'months' }}
        onFrequencyChange={() => {}}
        onLastDoneChange={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Add fertilizing schedule'));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('calls onExpand for repotting toggle in controlled mode', () => {
    const onExpand = vi.fn();
    render(
      <CareScheduleForm
        careType="repotting"
        label="Repotting"
        expanded={false}
        onExpand={onExpand}
        frequency={{ value: '', unit: 'months' }}
        onFrequencyChange={() => {}}
        onLastDoneChange={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Add repotting schedule'));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('expands via local state when no onExpand is provided (uncontrolled)', () => {
    render(
      <CareScheduleForm
        careType="fertilizing"
        label="Fertilizing"
        frequency={{ value: '', unit: 'months' }}
        onFrequencyChange={() => {}}
        onLastDoneChange={() => {}}
      />
    );
    // Starts collapsed
    expect(screen.getByText('Add fertilizing schedule')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add fertilizing schedule'));
    // Now expanded — should show the label header and fields
    expect(screen.getByText('Fertilizing')).toBeInTheDocument();
    expect(screen.getByLabelText('Fertilizing frequency number')).toBeInTheDocument();
  });
});
