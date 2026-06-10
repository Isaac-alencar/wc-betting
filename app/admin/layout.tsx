import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/fases", label: "Fases" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/pontuacao", label: "Pontuação" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin =
    user?.email != null &&
    process.env.ADMIN_EMAIL != null &&
    user.email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--danger)] mb-2">
            Acesso negado
          </p>
          <p className="text-[var(--muted)]">
            Esta área é restrita ao administrador.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col">
        <div className="p-5 border-b border-[var(--border)]">
          <span className="text-lg font-black text-[var(--accent)]">ADMIN</span>
          <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--border)]">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Site público
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
