import { useEffect, useState } from 'react';
import { api, formatMinutes } from '../api.js';
import { Card, Punch, inputCls } from './ui.jsx';
import { useToast } from './Toast.jsx';

export default function RewatchView({ movies, reload }) {
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);
  const toast = useToast();

  // Default to the last movie once the list loads.
  useEffect(() => {
    if (!targetId && movies.length > 0) setTargetId(String(movies[movies.length - 1].id));
  }, [movies, targetId]);

  // Refetch whenever the target or the movies (e.g. watched ticks) change.
  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    api
      .rewatchOrder(targetId)
      .then((data) => !cancelled && setPlan(data))
      .catch((e) => !cancelled && toast.error(e.message));
    return () => {
      cancelled = true;
    };
  }, [targetId, movies, toast]);

  async function toggleWatched(item) {
    try {
      await api.updateMovie(item.id, { watched: !item.watched });
      await reload();
      toast.success(item.watched ? `Marked “${item.title}” as not watched` : `Marked “${item.title}” as watched`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  const pct = plan && plan.totalCount > 0 ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      <Card title="Pick your target movie">
        {movies.length === 0 ? (
          <p className="text-sm text-mute">Add some movies first.</p>
        ) : (
          <select className={inputCls} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.releaseYear})
              </option>
            ))}
          </select>
        )}
      </Card>

      {plan && (
        <Card title={`Before you watch “${plan.movie.title}”`}>
          {plan.totalCount === 0 ? (
            <p className="text-sm text-punch">Nothing to rewatch first. You’re ready to go!</p>
          ) : (
            <>
              <div className="mb-5">
                <div className="mb-2 flex flex-wrap justify-between gap-x-4 text-sm">
                  <span className="font-semibold">
                    {plan.watchedCount} of {plan.totalCount} watched
                  </span>
                  <span className="text-mute">
                    {plan.unwatchedRuntime === 0
                      ? 'All caught up'
                      : `${formatMinutes(plan.unwatchedRuntime)} left to watch (${plan.unwatchedRuntime} min)`}
                  </span>
                </div>
                <div
                  className="strip h-5 overflow-hidden rounded-sm py-[6px]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={plan.totalCount}
                  aria-valuenow={plan.watchedCount}
                  aria-label="Movies watched"
                >
                  <div className="h-full bg-punch transition-all motion-reduce:transition-none" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <ol className="space-y-2">
                {plan.order.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-md border border-aisle-hi bg-plum/50 px-3 py-2">
                    <span className="w-7 text-right font-display text-2xl font-extrabold leading-none text-beam">{i + 1}</span>
                    <Punch checked={m.watched} onChange={() => toggleWatched(m)} label={`Mark ${m.title} as watched`} />
                    <span className={`flex-1 ${m.watched ? 'text-mute line-through' : ''}`}>{m.title}</span>
                    <span className="text-xs text-mute">{m.runtime} min</span>
                    <span className={m.watched ? 'text-punch' : 'text-aisle-hi'}>✓</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
