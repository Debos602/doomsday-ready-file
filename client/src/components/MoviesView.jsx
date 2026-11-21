import { useState } from 'react';
import { api } from '../api.js';
import { Button, Card, PrereqPicker, Punch, inputCls } from './ui.jsx';
import { useToast } from './Toast.jsx';

const emptyForm = { title: '', releaseYear: '', runtime: '', prerequisites: [] };

export default function MoviesView({ movies, reload }) {
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPrereqs, setEditPrereqs] = useState([]);

  const titleOf = (id) => movies.find((m) => m.id === id)?.title ?? `#${id}`;

  // Runs an API call, refreshes the list, and shows a success or error toast.
  async function run(action, successMessage) {
    try {
      await action();
      await reload();
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    }
  }

  async function addMovie(e) {
    e.preventDefault();
    setSaving(true);
    const ok = await run(
      () =>
        api.createMovie({
          title: form.title,
          releaseYear: Number(form.releaseYear),
          runtime: Number(form.runtime),
          prerequisites: form.prerequisites,
        }),
      `Added “${form.title.trim()}”`
    );
    setSaving(false);
    if (ok) setForm(emptyForm);
  }

  const toggleWatched = (m) =>
    run(
      () => api.updateMovie(m.id, { watched: !m.watched }),
      m.watched ? `Marked “${m.title}” as not watched` : `Marked “${m.title}” as watched`
    );

  function startEdit(m) {
    setEditingId(m.id);
    setEditPrereqs(m.prerequisites);
  }

  async function savePrereqs(m) {
    const ok = await run(
      () => api.updateMovie(m.id, { prerequisites: editPrereqs }),
      `Prerequisites saved for “${m.title}”`
    );
    if (ok) setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <Card title="Add a movie">
        <form onSubmit={addMovie} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <input
              className={inputCls}
              placeholder="Title"
              aria-label="Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className={inputCls}
              type="number"
              placeholder="Release year"
              aria-label="Release year"
              min={1888}
              max={2100}
              required
              value={form.releaseYear}
              onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
            />
            <input
              className={inputCls}
              type="number"
              placeholder="Runtime (min)"
              aria-label="Runtime in minutes"
              min={1}
              max={300}
              required
              value={form.runtime}
              onChange={(e) => setForm({ ...form, runtime: e.target.value })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-mute">Watch these first (optional)</p>
            <PrereqPicker
              movies={movies}
              selected={form.prerequisites}
              onChange={(prerequisites) => setForm({ ...form, prerequisites })}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add movie'}
          </Button>
        </form>
      </Card>

      <Card title={`Movies (${movies.length})`}>
        {movies.length === 0 ? (
          <p className="text-sm text-mute">No movies yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-aisle-hi">
            {movies.map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Punch checked={m.watched} onChange={() => toggleWatched(m)} label={`Mark ${m.title} as watched`} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${m.watched ? 'text-mute line-through' : ''}`}>{m.title}</p>
                    <p className="text-xs text-mute">
                      {m.releaseYear} · {m.runtime} min
                    </p>
                    {m.prerequisites.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.prerequisites.map((id) => (
                          <span key={id} className="rounded-full bg-plum px-2 py-0.5 text-xs text-stock/80">
                            {titleOf(id)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" onClick={() => (editingId === m.id ? setEditingId(null) : startEdit(m))}>
                    {editingId === m.id ? 'Cancel' : 'Edit prerequisites'}
                  </Button>
                </div>

                {editingId === m.id && (
                  <div className="mt-3 space-y-3 rounded-md bg-plum/60 p-3">
                    <PrereqPicker movies={movies} excludeId={m.id} selected={editPrereqs} onChange={setEditPrereqs} />
                    <Button onClick={() => savePrereqs(m)}>Save prerequisites</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
