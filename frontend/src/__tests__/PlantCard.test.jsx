import { render, screen } from '@testing-library/react';
import PlantCard from '../components/PlantCard.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  TrashSimple: (props) => <span data-testid="icon-trash" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
}));

describe('PlantCard', () => {
  const basePlant = {
    id: '1',
    name: 'Monstera',
    type: 'Tropical',
    photo_url: null,
    care_schedules: [],
  };

  it('renders without crashing', () => {
    render(<PlantCard plant={basePlant} onDelete={() => {}} />);
    expect(screen.getByText('Monstera')).toBeInTheDocument();
  });

  it('renders plant name and type', () => {
    render(<PlantCard plant={basePlant} onDelete={() => {}} />);
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Tropical')).toBeInTheDocument();
  });

  it('shows status badges with care type prefix', () => {
    const plant = {
      ...basePlant,
      care_schedules: [
        { care_type: 'watering', status: 'on_track', days_overdue: 0 },
      ],
    };
    render(<PlantCard plant={plant} onDelete={() => {}} />);
    expect(screen.getByText('Watering: On track')).toBeInTheDocument();
    expect(screen.getByTestId('icon-drop')).toBeInTheDocument();
  });

  it('shows placeholder when no photo', () => {
    render(<PlantCard plant={basePlant} onDelete={() => {}} />);
    expect(screen.getByTestId('icon-leaf')).toBeInTheDocument();
  });

  // T-052: Multiple badges on one card
  it('renders all three care type badges in correct order', () => {
    const plant = {
      ...basePlant,
      care_schedules: [
        { care_type: 'watering', status: 'overdue', days_overdue: 2 },
        { care_type: 'fertilizing', status: 'on_track', days_overdue: 0 },
        { care_type: 'repotting', status: 'due_today', days_overdue: 0 },
      ],
    };
    render(<PlantCard plant={plant} onDelete={() => {}} />);
    expect(screen.getByText('Watering: 2 days overdue')).toBeInTheDocument();
    expect(screen.getByText('Fertilizing: On track')).toBeInTheDocument();
    expect(screen.getByText('Repotting: Due today')).toBeInTheDocument();
  });

  // T-052: No care schedules = "Not set" badge without icon prefix
  it('shows Not set badge without icon when no care schedules', () => {
    render(<PlantCard plant={basePlant} onDelete={() => {}} />);
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  // T-052: Singular day handling
  it('shows singular day for 1 day overdue', () => {
    const plant = {
      ...basePlant,
      care_schedules: [
        { care_type: 'watering', status: 'overdue', days_overdue: 1 },
      ],
    };
    render(<PlantCard plant={plant} onDelete={() => {}} />);
    expect(screen.getByText('Watering: 1 day overdue')).toBeInTheDocument();
  });
});
