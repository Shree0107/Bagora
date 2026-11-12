/** Small success / error message shown under forms. */
export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
        {success}
      </p>
    );
  }
  return null;
}
