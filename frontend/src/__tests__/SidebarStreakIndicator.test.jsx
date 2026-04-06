import { render, screen, fireEvent } from '@testing-library/react';
import SidebarStreakIndicator from '../components/SidebarStreakIndicator.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Fire: (props) => <span data-testid="icon-fire" {...props} />,
}));

describe('SidebarStreakIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when currentStreak is 0', () => {
    const { container } = render(<SidebarStreakIndicator currentStreak={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when currentStreak is null', () => {
    const { container } = render(<SidebarStreakIndicator currentStreak={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders streak count when currentStreak >= 1', () => {
    render(<SidebarStreakIndicator currentStreak={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('day streak')).toBeInTheDocument();
    expect(screen.getByLabelText('Care streak: 5 days. Go to your profile.')).toBeInTheDocument();
  });

  it('uses Plant icon for streaks 1-6', () => {
    render(<SidebarStreakIndicator currentStreak={3} />);
    expect(screen.getByTestId('icon-plant')).toBeInTheDocument();
  });

  it('uses Fire icon for streaks 7+', () => {
    render(<SidebarStreakIndicator currentStreak={10} />);
    expect(screen.getByTestId('icon-fire')).toBeInTheDocument();
  });

  it('navigates to /profile on click', () => {
    render(<SidebarStreakIndicator currentStreak={5} />);
    fireEvent.click(screen.getByRole('link'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to /profile on Enter key', () => {
    render(<SidebarStreakIndicator currentStreak={5} />);
    fireEvent.keyDown(screen.getByRole('link'), { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('calls onClick prop when clicked (used to close sidebar)', () => {
    const onClick = vi.fn();
    render(<SidebarStreakIndicator currentStreak={5} onClick={onClick} />);
    fireEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalled();
  });
});
