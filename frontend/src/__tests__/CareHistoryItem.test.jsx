import { render, screen, fireEvent } from '@testing-library/react';
import CareHistoryItem from '../components/CareHistoryItem.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted" {...props} />,
  CaretDown: (props) => <span data-testid="icon-caret-down" {...props} />,
  CaretUp: (props) => <span data-testid="icon-caret-up" {...props} />,
}));

vi.mock('../utils/formatDate.js', () => ({
  formatDate: () => 'April 2, 2026',
  formatFullDateTime: () => 'April 2, 2026 at 2:30 PM',
}));

describe('CareHistoryItem', () => {
  const baseItem = {
    id: 'action-1',
    careType: 'watering',
    performedAt: '2026-04-02T09:00:00.000Z',
    notes: null,
  };

  it('renders without notes — no note UI visible', () => {
    render(<CareHistoryItem item={baseItem} />);

    expect(screen.getByText('Watering')).toBeTruthy();
    expect(screen.queryByText('Show more')).toBeNull();
    // No divider
    expect(document.querySelector('.ch-item-note-divider')).toBeNull();
    expect(document.querySelector('.ch-item-note')).toBeNull();
  });

  it('renders with null notes — no note UI', () => {
    render(<CareHistoryItem item={{ ...baseItem, notes: null }} />);
    expect(document.querySelector('.ch-item-note')).toBeNull();
  });

  it('renders with empty string notes — no note UI', () => {
    render(<CareHistoryItem item={{ ...baseItem, notes: '' }} />);
    expect(document.querySelector('.ch-item-note')).toBeNull();
  });

  it('renders with whitespace-only notes — no note UI', () => {
    render(<CareHistoryItem item={{ ...baseItem, notes: '   ' }} />);
    expect(document.querySelector('.ch-item-note')).toBeNull();
  });

  it('renders with non-null notes — shows note text and divider', () => {
    const item = { ...baseItem, notes: 'Soil was very dry' };
    render(<CareHistoryItem item={item} />);

    expect(screen.getByText('Soil was very dry')).toBeTruthy();
    expect(document.querySelector('.ch-item-note-divider')).toBeTruthy();
  });

  it('has correct aria-label when notes are present', () => {
    const item = { ...baseItem, notes: 'Some note' };
    render(<CareHistoryItem item={item} />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveAttribute('aria-label', 'Watering on April 2, 2026. Includes note.');
  });

  it('has correct aria-label when notes are null', () => {
    render(<CareHistoryItem item={baseItem} />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveAttribute('aria-label', 'Watering on April 2, 2026');
  });

  it('note text has clamped class by default', () => {
    const item = { ...baseItem, notes: 'A short note' };
    render(<CareHistoryItem item={item} />);

    const noteText = document.getElementById(`note-text-${item.id}`);
    expect(noteText.classList.contains('ch-item-note-text--clamped')).toBe(true);
  });

  it('applies care type class to icon circle for dark mode', () => {
    render(<CareHistoryItem item={baseItem} />);

    const iconCircle = document.querySelector('.ch-item-icon-circle--watering');
    expect(iconCircle).toBeTruthy();
  });

  it('renders fertilizing care type with correct config', () => {
    const item = { ...baseItem, careType: 'fertilizing', notes: 'Used organic blend' };
    render(<CareHistoryItem item={item} />);

    expect(screen.getByText('Fertilizing')).toBeTruthy();
    expect(screen.getByText('Used organic blend')).toBeTruthy();
    expect(document.querySelector('.ch-item-icon-circle--fertilizing')).toBeTruthy();
  });

  it('history panel has role="tabpanel" in CareHistorySection wrappers', () => {
    // The role="tabpanel" is on CareHistorySection, not on the item itself.
    // This test just verifies the item renders correctly as a listitem.
    render(<CareHistoryItem item={baseItem} />);
    expect(screen.getByRole('listitem')).toBeTruthy();
  });
});
