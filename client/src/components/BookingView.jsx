import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, inputCls } from './ui.jsx';
import { useToast } from './Toast.jsx';

export default function BookingView({ cinemas, reload }) {
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [quote, setQuote] = useState(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [sizesText, setSizesText] = useState('');

  useEffect(() => {
    if (!cinemaId && cinemas.length > 0) setCinemaId(String(cinemas[0].id));
  }, [cinemas, cinemaId]);

  async function getQuote(e) {
    e.preventDefault();
    setQuote(null);
    setLoading(true);
    try {
      setQuote(await api.booking(cinemaId, groupSize));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addCinema(e) {
    e.preventDefault();
    try {
      const sizes = sizesText.split(/[,\s]+/).filter(Boolean).map(Number);
      const created = await api.createCinema({ name, bundleSizes: sizes });
      await reload();
      setCinemaId(String(created.id));
      setName('');
      setSizesText('');
      toast.success(`Added “${created.name}”`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const selected = cinemas.find((c) => String(c.id) === cinemaId);

  return (
    <div className="space-y-6">
      <Card title="Book a watch party">
        {cinemas.length === 0 ? (
          <p className="text-sm text-mute">No cinemas yet. Add one below.</p>
        ) : (
          <form onSubmit={getQuote} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
              <select
                className={inputCls}
                aria-label="Cinema"
                value={cinemaId}
                onChange={(e) => {
                  setCinemaId(e.target.value);
                  setQuote(null);
                }}
              >
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                type="number"
                min={1}
                max={10000}
                required
                placeholder="Group size"
                aria-label="Group size"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Checking…' : 'Get quote'}
              </Button>
            </div>
            {selected && <p className="text-sm text-mute">Bundle sizes sold: {selected.bundleSizes.join(', ')}</p>}
          </form>
        )}

        {quote && (
          <div aria-live="polite" className="mt-5 rounded-lg border border-aisle-hi bg-plum/50 p-4">
            {quote.possible ? (
              <>
                <p className="mb-3 font-display text-3xl font-extrabold leading-none text-punch">
                  {quote.totalBundles} bundle{quote.totalBundles === 1 ? '' : 's'} for {quote.groupSize} seats at{' '}
                  {quote.cinema.name}
                </p>
                <ul className="space-y-2">
                  {quote.bundles.map((b) => (
                    <li key={b.size} className="ticket flex max-w-xs items-center justify-between px-5 py-2.5">
                      <span className="font-semibold">{b.size}-seat bundle</span>
                      <span className="font-display text-3xl font-black leading-none">×{b.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-semibold text-[#ff7a93]">
                Not possible: no exact combination of bundles makes {quote.groupSize} seats.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card title="Add a cinema">
        <form onSubmit={addCinema} className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
          <input
            className={inputCls}
            placeholder="Cinema name"
            aria-label="Cinema name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Bundle sizes, e.g. 2, 5"
            aria-label="Bundle sizes"
            required
            value={sizesText}
            onChange={(e) => setSizesText(e.target.value)}
          />
          <Button type="submit">Add cinema</Button>
        </form>
      </Card>
    </div>
  );
}
