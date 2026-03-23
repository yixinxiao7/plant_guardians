import { render, screen } from '@testing-library/react';
import PlantCard from '../components/PlantCard.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  TrashSimple: (props) => <span data-testid="icon-trash" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
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

  it('shows status badges', () => {
    const plant = {
      ...basePlant,
      care_schedules: [
        { care_type: 'watering', status: 'on_track', days_overdue: 0 },
      ],
    };
    render(<PlantCard plant={plant} onDelete={() => {}} />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('shows placeholder when no photo', () => {
    render(<PlantCard plant={basePlant} onDelete={() => {}} />);
    expect(screen.getByTestId('icon-leaf')).toBeInTheDocument();
  });
});
