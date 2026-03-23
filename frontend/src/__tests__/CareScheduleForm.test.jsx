import { render, screen } from '@testing-library/react';
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
});
