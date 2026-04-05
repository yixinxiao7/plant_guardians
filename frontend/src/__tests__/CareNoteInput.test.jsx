import { render, screen, fireEvent } from '@testing-library/react';
import CareNoteInput from '../components/CareNoteInput.jsx';

vi.mock('@phosphor-icons/react', () => ({
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
}));

describe('CareNoteInput', () => {
  const defaultProps = {
    noteValue: '',
    onNoteChange: vi.fn(),
    plantId: 'p1',
    careType: 'watering',
    plantName: 'Monstera',
    disabled: false,
    idPrefix: 'note-input',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "+ Add note" toggle button in collapsed state', () => {
    render(<CareNoteInput {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /add note/i });
    expect(toggle).toBeTruthy();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not render textarea when collapsed', () => {
    render(<CareNoteInput {...defaultProps} />);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('expands textarea when "+ Add note" is clicked', () => {
    render(<CareNoteInput {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeTruthy();
    expect(textarea).toHaveAttribute('aria-label', 'Care note for Monstera watering');
    expect(textarea).toHaveAttribute('maxLength', '280');
  });

  it('collapses and clears note when "Remove note" is clicked', () => {
    const onNoteChange = vi.fn();
    render(<CareNoteInput {...defaultProps} noteValue="Some text" onNoteChange={onNoteChange} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    expect(screen.getByRole('textbox')).toBeTruthy();

    // Collapse
    fireEvent.click(screen.getByRole('button', { name: /remove note/i }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(onNoteChange).toHaveBeenCalledWith('');
  });

  it('shows character counter at 200+ characters', () => {
    const longText = 'a'.repeat(205);
    render(<CareNoteInput {...defaultProps} noteValue={longText} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    const counter = screen.getByText('205 / 280');
    expect(counter).toBeTruthy();
    expect(counter.classList.contains('care-note-counter--visible')).toBe(true);
  });

  it('hides character counter below 200 characters', () => {
    render(<CareNoteInput {...defaultProps} noteValue="Short text" />);
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    // Counter should exist but not be visible (empty text)
    const counterId = `note-counter-p1-watering`;
    const counter = document.getElementById(counterId);
    expect(counter).toBeTruthy();
    expect(counter.classList.contains('care-note-counter--visible')).toBe(false);
  });

  it('applies yellow class at 240+ characters', () => {
    const text = 'a'.repeat(245);
    render(<CareNoteInput {...defaultProps} noteValue={text} />);
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    const counter = screen.getByText('245 / 280');
    expect(counter.classList.contains('care-note-counter--yellow')).toBe(true);
  });

  it('applies red class at 270+ characters', () => {
    const text = 'a'.repeat(275);
    render(<CareNoteInput {...defaultProps} noteValue={text} />);
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    const counter = screen.getByText('275 / 280');
    expect(counter.classList.contains('care-note-counter--red')).toBe(true);
  });

  it('disables toggle and textarea when disabled prop is true', () => {
    render(<CareNoteInput {...defaultProps} disabled={true} />);
    const toggle = screen.getByRole('button', { name: /add note/i });
    expect(toggle).toBeDisabled();
  });

  it('calls onNoteChange when typing in textarea', () => {
    const onNoteChange = vi.fn();
    render(<CareNoteInput {...defaultProps} onNoteChange={onNoteChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    expect(onNoteChange).toHaveBeenCalledWith('Hello world');
  });

  it('has correct aria-describedby linking textarea to counter', () => {
    render(<CareNoteInput {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'note-counter-p1-watering');
  });
});
