import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicPlantPage from '../pages/PublicPlantPage.jsx';
import { ApiError } from '../utils/api.js';

// ── Route param mock ──────────────────────────────────────────────

let mockShareToken = 'valid-token';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ shareToken: mockShareToken }),
  };
});

// ── Icon mocks (Phosphor modules pull in SVG chunks that jsdom chokes on) ──

vi.mock('@phosphor-icons/react', () => ({
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Flask: (props) => <span data-testid="icon-flask" {...props} />,
  Flower: (props) => <span data-testid="icon-flower" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
  WifiSlash: (props) => <span data-testid="icon-wifislash" {...props} />,
  Sparkle: (props) => <span data-testid="icon-sparkle" {...props} />,
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
}));

// ── API mock ──────────────────────────────────────────────────────

const mockGetPublic = vi.fn();

vi.mock('../utils/api.js', async () => {
  const actual = await vi.importActual('../utils/api.js');
  return {
    ...actual,
    plantShares: {
      getPublic: (...args) => mockGetPublic(...args),
    },
  };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/plants/share/${mockShareToken}`]}>
      <PublicPlantPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockGetPublic.mockReset();
  mockShareToken = 'valid-token';
});

// ── Tests ─────────────────────────────────────────────────────────

describe('PublicPlantPage (SPEC-022)', () => {
  it('shows the loading skeleton while the public fetch is in flight', async () => {
    let resolveFetch;
    mockGetPublic.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderPage();

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-busy', 'true');
    expect(main).toHaveAttribute('aria-label', 'Loading plant profile');

    await act(async () => {
      resolveFetch({
        name: 'Monstie',
        species: null,
        photo_url: null,
        watering_frequency_days: null,
        fertilizing_frequency_days: null,
        repotting_frequency_days: null,
        ai_care_notes: null,
      });
    });
  });

  it('renders the populated success state with name, species, care chips, and CTA', async () => {
    mockGetPublic.mockResolvedValueOnce({
      name: 'Monstie',
      species: 'Monstera Deliciosa',
      photo_url: 'https://cdn.example.com/photo.jpg',
      watering_frequency_days: 7,
      fertilizing_frequency_days: 30,
      repotting_frequency_days: null,
      ai_care_notes: 'Bright indirect light preferred.',
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Monstie' }),
      ).toBeInTheDocument();
    });

    // Species chip present
    expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
    // Watering chip rendered (fertilizing too)
    expect(screen.getByText(/Water every 7 days/)).toBeInTheDocument();
    expect(screen.getByText(/Fertilize every 30 days/)).toBeInTheDocument();
    // Repotting chip NOT rendered (null frequency)
    expect(screen.queryByText(/Repot every/)).not.toBeInTheDocument();
    // AI care notes present
    expect(
      screen.getByText('Bright indirect light preferred.'),
    ).toBeInTheDocument();
    // Photo present with accessible alt text
    const photo = screen.getByAltText('Photo of Monstie');
    expect(photo).toBeInTheDocument();
    expect(photo).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
    // Discover CTA present linking to /
    const cta = screen.getByRole('link', { name: /get started for free/i });
    expect(cta).toHaveAttribute('href', '/');
  });

  it('omits the <img> element when photo_url is null', async () => {
    mockGetPublic.mockResolvedValueOnce({
      name: 'Fernie',
      species: 'Boston Fern',
      photo_url: null,
      watering_frequency_days: 3,
      fertilizing_frequency_days: null,
      repotting_frequency_days: null,
      ai_care_notes: null,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Fernie' })).toBeInTheDocument();
    });

    expect(screen.queryByAltText(/Photo of/)).not.toBeInTheDocument();
  });

  it('renders the 404 "no longer active" state when the API returns 404', async () => {
    mockShareToken = 'unknown';
    mockGetPublic.mockRejectedValueOnce(
      new ApiError('This plant profile is no longer available.', 'NOT_FOUND', 404),
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/This plant link is no longer active/i),
      ).toBeInTheDocument();
    });

    // CTA still present, but no retry button on 404.
    expect(screen.getByRole('link', { name: /get started for free/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders the generic error state with a retry button on 500 / network error', async () => {
    mockGetPublic.mockRejectedValueOnce(
      new ApiError('Server error', 'INTERNAL_ERROR', 500),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    // On retry, the API is called again.
    mockGetPublic.mockResolvedValueOnce({
      name: 'Recovered',
      species: null,
      photo_url: null,
      watering_frequency_days: 5,
      fertilizing_frequency_days: null,
      repotting_frequency_days: null,
      ai_care_notes: null,
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Recovered' }),
      ).toBeInTheDocument();
    });

    // getPublic was called twice now — once on mount, once on retry.
    expect(mockGetPublic).toHaveBeenCalledTimes(2);
  });

  it('shows "No schedule set" chip when all frequencies are null', async () => {
    mockGetPublic.mockResolvedValueOnce({
      name: 'Sprout',
      species: null,
      photo_url: null,
      watering_frequency_days: null,
      fertilizing_frequency_days: null,
      repotting_frequency_days: null,
      ai_care_notes: null,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No schedule set')).toBeInTheDocument();
    });
  });
});
