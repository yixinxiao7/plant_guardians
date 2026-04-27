import { render, screen, fireEvent, act } from '@testing-library/react';
import PlantSearchBar from '../components/PlantSearchBar.jsx';

vi.mock('@phosphor-icons/react', () => ({
  MagnifyingGlass: (props) => <span data-testid="icon-search" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

describe('PlantSearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input with aria-label "Search plants" and proper placeholder', () => {
    render(<PlantSearchBar value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Search plants');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', 'Search plants…');
  });

  it('debounces input changes and fires onChange with trimmed value after 300ms', () => {
    const onChange = vi.fn();
    render(<PlantSearchBar value="" onChange={onChange} />);

    const input = screen.getByLabelText('Search plants');
    fireEvent.change(input, { target: { value: 'fern' } });

    // Should not fire immediately.
    expect(onChange).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(299); });
    expect(onChange).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1); });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('fern');
  });

  it('debounce timer resets on each keystroke', () => {
    const onChange = vi.fn();
    render(<PlantSearchBar value="" onChange={onChange} />);
    const input = screen.getByLabelText('Search plants');

    fireEvent.change(input, { target: { value: 'p' } });
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.change(input, { target: { value: 'po' } });
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.change(input, { target: { value: 'pothos' } });
    act(() => { vi.advanceTimersByTime(299); });
    expect(onChange).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('pothos');
  });

  it('renders ✕ clear button only when input has a value', () => {
    const { rerender } = render(<PlantSearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    rerender(<PlantSearchBar value="rose" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clearing via ✕ fires onChange("") immediately and refocuses the input', () => {
    const onChange = vi.fn();
    render(<PlantSearchBar value="rose" onChange={onChange} />);

    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);

    // Cleared synchronously — no debounce delay.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('');
    expect(document.activeElement).toBe(screen.getByLabelText('Search plants'));
  });

  it('Escape key clears non-empty input synchronously', () => {
    const onChange = vi.fn();
    render(<PlantSearchBar value="" onChange={onChange} />);
    const input = screen.getByLabelText('Search plants');

    fireEvent.change(input, { target: { value: 'orchid' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input.value).toBe('');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('disables the input when `disabled` prop is true', () => {
    render(<PlantSearchBar value="" onChange={vi.fn()} disabled />);
    const input = screen.getByLabelText('Search plants');
    expect(input).toBeDisabled();
  });

  it('hides the clear button when disabled even with a value', () => {
    render(<PlantSearchBar value="rose" onChange={vi.fn()} disabled />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('syncs local input when external `value` prop changes (e.g. Clear filters)', () => {
    const { rerender } = render(<PlantSearchBar value="cactus" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Search plants');
    expect(input.value).toBe('cactus');

    rerender(<PlantSearchBar value="" onChange={vi.fn()} />);
    expect(input.value).toBe('');
  });

  it('caps input length to the 200-character backend limit', () => {
    const onChange = vi.fn();
    render(<PlantSearchBar value="" onChange={onChange} />);
    const input = screen.getByLabelText('Search plants');
    const longString = 'a'.repeat(250);
    fireEvent.change(input, { target: { value: longString } });

    expect(input.value.length).toBeLessThanOrEqual(200);
  });
});
