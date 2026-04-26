import { render, screen, fireEvent } from '@testing-library/react';
import PlantSortDropdown, { SORT_OPTIONS } from '../components/PlantSortDropdown.jsx';

vi.mock('@phosphor-icons/react', () => ({
  CaretDown: (props) => <span data-testid="icon-caret" {...props} />,
  Check: (props) => <span data-testid="icon-check" {...props} />,
}));

describe('PlantSortDropdown', () => {
  it('renders the trigger button labelled "Sort plants" with the current option text', () => {
    render(<PlantSortDropdown value="name_asc" onChange={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Sort plants' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Name A–Z');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the listbox when the trigger is clicked', () => {
    render(<PlantSortDropdown value="name_asc" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(SORT_OPTIONS.length);
  });

  it('calls onChange and closes the listbox when an option is selected', () => {
    const onChange = vi.fn();
    render(<PlantSortDropdown value="name_asc" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));

    fireEvent.click(screen.getByRole('option', { name: 'Most overdue first' }));

    expect(onChange).toHaveBeenCalledWith('most_overdue');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not call onChange when the already-selected option is clicked', () => {
    const onChange = vi.fn();
    render(<PlantSortDropdown value="name_asc" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));
    fireEvent.click(screen.getByRole('option', { name: 'Name A–Z' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the selected option with aria-selected=true', () => {
    render(<PlantSortDropdown value="next_due_soonest" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));
    const opt = screen.getByRole('option', { name: /Next due soonest/ });
    expect(opt).toHaveAttribute('aria-selected', 'true');
  });

  it('Escape closes the listbox without changing selection', () => {
    const onChange = vi.fn();
    render(<PlantSortDropdown value="name_asc" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));
    const list = screen.getByRole('listbox');
    fireEvent.keyDown(list, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables the trigger and ignores clicks when `disabled` prop is true', () => {
    const onChange = vi.fn();
    render(<PlantSortDropdown value="name_asc" onChange={onChange} disabled />);
    const trigger = screen.getByRole('button', { name: 'Sort plants' });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows non-default visual treatment when sort value is not name_asc', () => {
    render(<PlantSortDropdown value="most_overdue" onChange={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Sort plants' });
    expect(trigger.className).toMatch(/non-default/);
  });
});
