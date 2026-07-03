export function JsonPreview({
  title = "Response JSON",
  value,
}: {
  title?: string;
  value: unknown;
}) {
  const output =
    value === null || value === undefined
      ? "No response captured yet."
      : JSON.stringify(value, null, 2);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/35">
      <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs leading-5 text-cyan-100">
        {output}
      </pre>
    </div>
  );
}
