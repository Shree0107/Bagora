import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setMessageHandledAction } from "@/lib/admin-actions";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Messages & newsletter" };

export default async function AdminMessagesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: messages }, { data: subscribers, count }] = await Promise.all([
    supabase.from("contact_messages").select("*").order("handled").order("created_at", { ascending: false }).limit(200),
    supabase.from("newsletter_subscribers").select("email, source, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1000),
  ]);

  return (
    <div className="space-y-16">
      <section>
        <h1 className="font-display text-4xl text-espresso">Messages</h1>
        {!messages?.length ? (
          <p className="mt-8 text-muted">No messages yet.</p>
        ) : (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {messages.map((m) => (
              <li key={m.id} className={`grid gap-4 py-6 sm:grid-cols-[1fr_auto] ${m.handled ? "opacity-60" : ""}`}>
                <div>
                  <p className="text-sm text-muted">
                    {formatDateTime(m.created_at)} · {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} className="text-forest underline">{m.email}</a>
                    {m.phone && <> · {m.phone}</>}
                    {m.order_ref && <> · Order {m.order_ref}</>}
                  </p>
                  <p className="mt-2 max-w-[70ch] whitespace-pre-line text-[15px] text-espresso">{m.message}</p>
                </div>
                <form action={setMessageHandledAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="handled" value={String(!m.handled)} />
                  <button type="submit" className="text-sm text-forest underline decoration-gilt underline-offset-4">
                    {m.handled ? "Mark as open" : "Mark handled"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-3xl text-espresso">Newsletter</h2>
        <p className="mt-2 text-sm text-muted">{count ?? 0} subscribers. Copy the list into your email tool.</p>
        {subscribers && subscribers.length > 0 && (
          <textarea
            readOnly
            aria-label="Subscriber emails"
            rows={8}
            className="mt-4 w-full border border-line bg-white/60 p-3 font-mono text-xs"
            value={subscribers.map((s) => s.email).join("\n")}
          />
        )}
      </section>
    </div>
  );
}
