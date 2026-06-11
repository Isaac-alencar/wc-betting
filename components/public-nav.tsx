import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";

export default async function PublicNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? "Anônimo";
    isAdmin =
      process.env.ADMIN_EMAIL != null &&
      user.email === process.env.ADMIN_EMAIL;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-sm font-black tracking-widest text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          BOLÃO DOS ALENCAR
        </Link>

        <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link
            href="/ranking"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Ranking
          </Link>

          {user ? (
            <>
              <Link
                href="/apostas"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Palpites
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hover:text-[var(--foreground)] transition-colors"
                >
                  Admin
                </Link>
              )}
              <span className="max-w-[120px] truncate text-[var(--foreground)] font-semibold">
                {displayName}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="hover:text-[var(--foreground)] transition-colors"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
