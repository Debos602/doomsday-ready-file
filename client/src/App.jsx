import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import MoviesView from './components/MoviesView.jsx';
import RewatchView from './components/RewatchView.jsx';
import BookingView from './components/BookingView.jsx';
import { useToast } from './components/Toast.jsx';

const TABS = [
  { id: 'movies', label: 'Movies' },
  { id: 'rewatch', label: 'Rewatch Plan' },
  { id: 'booking', label: 'Booking' },
];

export default function App() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const toast = useToast();

  const reloadMovies = useCallback(async () => setMovies(await api.listMovies()), []);
  const reloadCinemas = useCallback(async () => setCinemas(await api.listCinemas()), []);

  useEffect(() => {
    Promise.all([reloadMovies(), reloadCinemas()]).catch((e) => toast.error(e.message));
  }, [reloadMovies, reloadCinemas, toast]);

  return (
    <div className="min-h-screen">
      <header className="beam border-b border-aisle-hi">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-5xl font-black leading-none tracking-wide text-stock">Doomsday Ready</h1>
            <p className="mt-1 text-sm text-mute">Plan your MCU rewatch and book the opening-night watch party.</p>
          </div>
          <nav className="flex gap-1 rounded-lg bg-aisle p-1" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-beam text-plum' : 'text-mute hover:bg-aisle-hi hover:text-stock'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'movies' && <MoviesView movies={movies} reload={reloadMovies} />}
        {tab === 'rewatch' && <RewatchView movies={movies} reload={reloadMovies} />}
        {tab === 'booking' && <BookingView cinemas={cinemas} reload={reloadCinemas} />}
      </main>
    </div>
  );
}
