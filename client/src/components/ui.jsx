export const inputCls =
  'w-full rounded-md border border-aisle-hi bg-plum px-3 py-2 text-sm text-stock placeholder-mute/60 focus:border-beam focus:outline-none';

export function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-aisle-hi bg-aisle p-5 ${className}`}>
      {title && <h2 className="mb-4 font-display text-3xl font-extrabold leading-none tracking-wide">{title}</h2>}
      {children}
    </section>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-beam text-plum hover:bg-stock',
    ghost: 'border border-aisle-hi text-stock hover:border-beam hover:text-beam',
  };
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Hole-punched checkbox: dashed ring when unwatched, filled teal with a tick when watched. */
export function Punch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${
        checked
          ? 'bg-punch text-plum'
          : 'border-2 border-dashed border-mute/70 text-transparent hover:border-beam'
      }`}
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10.5l4 4 8-9" />
      </svg>
    </button>
  );
}

/** Checkbox list used to pick prerequisites. */
export function PrereqPicker({ movies, selected, onChange, excludeId }) {
  const options = movies.filter((m) => m.id !== excludeId);
  if (options.length === 0) return <p className="text-sm text-mute">No other movies yet.</p>;

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-aisle-hi bg-plum p-2 sm:grid-cols-2">
      {options.map((m) => (
        <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-aisle">
          <input type="checkbox" className="accent-beam" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
          <span className="truncate">{m.title}</span>
        </label>
      ))}
    </div>
  );
}
