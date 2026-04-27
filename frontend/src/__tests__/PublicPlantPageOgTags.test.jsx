import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PublicPlantPage, { buildOgDescription } from '../pages/PublicPlantPage.jsx';

// ── Route param mock ──────────────────────────────────────────────

let mockShareToken = 'valid-token';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ shareToken: mockShareToken }),
  };
});

// ── Icon mocks ────────────────────────────────────────────────────

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
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/plants/share/${mockShareToken}`]}>
        <PublicPlantPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function getMeta(selector) {
  return document.head.querySelector(selector);
}

beforeEach(() => {
  mockGetPublic.mockReset();
  mockShareToken = 'valid-token';

  // Clear any meta tags left behind from previous tests in this file.
  document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(
    (el) => el.parentNode.removeChild(el),
  );
});

// ── Tests ─────────────────────────────────────────────────────────

describe('buildOgDescription (SPEC-023 helper)', () => {
  it('returns the full sentence when both frequencies are present', () => {
    expect(
      buildOgDescription({
        name: 'Monstie',
        watering_frequency_days: 7,
        fertilizing_frequency_days: 30,
      }),
    ).toBe(
      'Learn how to care for Monstie: watering every 7 days, fertilizing every 30 days.',
    );
  });

  it('returns the fallback sentence when both frequencies are null', () => {
    expect(
      buildOgDescription({
        name: 'Sprout',
        watering_frequency_days: null,
        fertilizing_frequency_days: null,
      }),
    ).toBe('Learn how to care for Sprout on Plant Guardians.');
  });

  it('omits fertilizing when only watering is present', () => {
    expect(
      buildOgDescription({
        name: 'Fernie',
        watering_frequency_days: 3,
        fertilizing_frequency_days: null,
      }),
    ).toBe('Learn how to care for Fernie: watering every 3 days.');
  });

  it('omits watering when only fertilizing is present', () => {
    expect(
      buildOgDescription({
        name: 'Cactie',
        watering_frequency_days: null,
        fertilizing_frequency_days: 60,
      }),
    ).toBe('Learn how to care for Cactie: fertilizing every 60 days.');
  });

  it('never includes repotting_frequency_days', () => {
    expect(
      buildOgDescription({
        name: 'Fiddle',
        watering_frequency_days: 5,
        fertilizing_frequency_days: null,
        repotting_frequency_days: 365,
      }),
    ).toBe('Learn how to care for Fiddle: watering every 5 days.');
  });
});

describe('PublicPlantPage OG meta tags (SPEC-023 Surface 3)', () => {
  it('renders og:* and twitter:* tags with the full metadata set when plant loads with a photo', async () => {
    mockGetPublic.mockResolvedValueOnce({
      name: 'Monstie',
      species: 'Monstera Deliciosa',
      photo_url: 'https://cdn.example.com/monstie.jpg',
      watering_frequency_days: 7,
      fertilizing_frequency_days: 30,
      repotting_frequency_days: null,
      ai_care_notes: null,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Monstie' }),
      ).toBeInTheDocument();
    });

    // react-helmet-async writes to document.head asynchronously.
    await waitFor(() => {
      expect(getMeta('meta[property="og:title"]')).not.toBeNull();
    });

    expect(getMeta('meta[property="og:title"]').getAttribute('content')).toBe(
      'Monstie on Plant Guardians',
    );
    expect(
      getMeta('meta[property="og:description"]').getAttribute('content'),
    ).toBe(
      'Learn how to care for Monstie: watering every 7 days, fertilizing every 30 days.',
    );
    expect(getMeta('meta[property="og:image"]').getAttribute('content')).toBe(
      'https://cdn.example.com/monstie.jpg',
    );
    expect(getMeta('meta[property="og:type"]').getAttribute('content')).toBe(
      'article',
    );
    expect(
      getMeta('meta[property="og:site_name"]').getAttribute('content'),
    ).toBe('Plant Guardians');

    // twitter:card = summary_large_image because photo_url is present
    expect(getMeta('meta[name="twitter:card"]').getAttribute('content')).toBe(
      'summary_large_image',
    );
    expect(getMeta('meta[name="twitter:title"]').getAttribute('content')).toBe(
      'Monstie on Plant Guardians',
    );
    expect(getMeta('meta[name="twitter:image"]').getAttribute('content')).toBe(
      'https://cdn.example.com/monstie.jpg',
    );
  });

  it('falls back to /og-default.png and twitter:card=summary when photo_url is null', async () => {
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
      expect(
        screen.getByRole('heading', { level: 1, name: 'Fernie' }),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getMeta('meta[property="og:image"]')).not.toBeNull();
    });

    expect(getMeta('meta[property="og:image"]').getAttribute('content')).toBe(
      '/og-default.png',
    );
    expect(getMeta('meta[name="twitter:card"]').getAttribute('content')).toBe(
      'summary',
    );
    expect(getMeta('meta[name="twitter:image"]').getAttribute('content')).toBe(
      '/og-default.png',
    );
  });

  it('renders the fallback og:description when both frequencies are null', async () => {
    mockGetPublic.mockResolvedValueOnce({
      name: 'Sprout',
      species: null,
      photo_url: 'https://cdn.example.com/sprout.jpg',
      watering_frequency_days: null,
      fertilizing_frequency_days: null,
      repotting_frequency_days: null,
      ai_care_notes: null,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Sprout' }),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getMeta('meta[property="og:description"]')).not.toBeNull();
    });

    expect(
      getMeta('meta[property="og:description"]').getAttribute('content'),
    ).toBe('Learn how to care for Sprout on Plant Guardians.');
  });

  it('does not render og:* meta tags during the loading state', async () => {
    let resolveFetch;
    mockGetPublic.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderPage();

    // Loading — assert og:title is absent.
    // (Helmet may still render a <title>, but preview meta tags must not.)
    // A small delay ensures Helmet has flushed any pending writes.
    await act(async () => {
      await Promise.resolve();
    });

    expect(getMeta('meta[property="og:title"]')).toBeNull();
    expect(getMeta('meta[property="og:image"]')).toBeNull();

    // Clean up: resolve the promise so the component unmounts cleanly.
    await act(async () => {
      resolveFetch({
        name: 'Any',
        species: null,
        photo_url: null,
        watering_frequency_days: null,
        fertilizing_frequency_days: null,
        repotting_frequency_days: null,
        ai_care_notes: null,
      });
    });
  });

  it('does not render og:* meta tags when the API returns 404', async () => {
    const { ApiError } = await import('../utils/api.js');
    mockGetPublic.mockRejectedValueOnce(
      new ApiError('Not found', 'NOT_FOUND', 404),
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/This plant link is no longer active/i),
      ).toBeInTheDocument();
    });

    // Allow Helmet any extra async ticks to flush.
    await act(async () => {
      await Promise.resolve();
    });

    expect(getMeta('meta[property="og:title"]')).toBeNull();
    expect(getMeta('meta[property="og:image"]')).toBeNull();
    expect(getMeta('meta[name="twitter:card"]')).toBeNull();
  });
});
