export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{message}</div>
    </div>
  );
}
