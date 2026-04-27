import { render, screen, fireEvent } from '@testing-library/react';
import PlantStatusFilter from '../components/PlantStatusFilter.jsx';

const COUNTS = { all: 12, overdue: 3, due_today: 2, on_track: 7 };

describe('PlantStatusFilter', () => {
  it('renders four tabs in a radiogroup labelled "Filter by status"', () => {
    render(<PlantStatusFilter value="all" onChange={vi.fn()} counts={COUNTS} />);
    const group = screen.getByRole('radiogroup', { name: 'Filter by status' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('renders the count badges from the `counts` prop', () => {
    render(<PlantStatusFilter value="all" onChange={vi.fn()} counts={COUNTS} />);
    expect(screen.getByLabelText('All plants, 12 results')).toBeInTheDocument();
    expect(screen.getByLabelText('Overdue plants, 3 results')).toBeInTheDocument();
    expect(screen.getByLabelText('Due today plants, 2 results')).toBeInTheDocument();
    expect(screen.getByLabelText('On track plants, 7 results')).toBeInTheDocument();
  });

  it('marks the currently-selected tab with aria-checked=true', () => {
    render(<PlantStatusFilter value="overdue" onChange={vi.fn()} counts={COUNTS} />);
    const overdue = screen.getByLabelText('Overdue plants, 3 results');
    expect(overdue).toHaveAttribute('aria-checked', 'true');

    const all = screen.getByLabelText('All plants, 12 results');
    expect(all).toHaveAttribute('aria-checked', 'false');
  });

  it('fires onChange with the new key when a different tab is clicked', () => {
    const onChange = vi.fn();
    render(<PlantStatusFilter value="all" onChange={onChange} counts={COUNTS} />);
    fireEvent.click(screen.getByLabelText('Overdue plants, 3 results'));
    expect(onChange).toHaveBeenCalledWith('overdue');
  });

  it('does not fire onChange when the already-active tab is clicked (idempotent)', () => {
    const onChange = vi.fn();
    render(<PlantStatusFilter value="all" onChange={onChange} counts={COUNTS} />);
    fireEvent.click(screen.getByLabelText('All plants, 12 results'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('arrow keys cycle focus + selection across tabs', () => {
    const onChange = vi.fn();
    render(<PlantStatusFilter value="all" onChange={onChange} counts={COUNTS} />);
    const allTab = screen.getByLabelText('All plants, 12 results');
    allTab.focus();
    fireEvent.keyDown(allTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('overdue');
  });

  it('renders count placeholders ("—") when counts are not yet available', () => {
    render(<PlantStatusFilter value="all" onChange={vi.fn()} counts={null} />);
    // Each tab should contain the placeholder dash
    const tabs = screen.getAllByRole('radio');
    tabs.forEach(t => {
      expect(t.textContent).toMatch(/—/);
    });
  });

  it('disables all tabs when `disabled` prop is true', () => {
    render(<PlantStatusFilter value="all" onChange={vi.fn()} counts={COUNTS} disabled />);
    const tabs = screen.getAllByRole('radio');
    tabs.forEach(t => {
      expect(t).toBeDisabled();
    });
  });

  it('does not call onChange when disabled, even on click', () => {
    const onChange = vi.fn();
    render(<PlantStatusFilter value="all" onChange={onChange} counts={COUNTS} disabled />);
    fireEvent.click(screen.getByLabelText('Overdue plants, 3 results'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
