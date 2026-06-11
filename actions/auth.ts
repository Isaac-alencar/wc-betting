"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-mail e senha são obrigatórios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  // Ensure profile exists with email prefix as default display name
  const displayName = email.split("@")[0];
  await supabase.from("user_profiles").upsert(
    { id: data.user.id, display_name: displayName },
    { onConflict: "id", ignoreDuplicates: true }
  );

  redirect("/");
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-mail e senha são obrigatórios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.user && data.session) {
    const displayName = email.split("@")[0];
    await supabase.from("user_profiles").upsert(
      { id: data.user.id, display_name: displayName },
      { onConflict: "id", ignoreDuplicates: true }
    );
    redirect("/");
  }

  // Email confirmation required — don't redirect yet
  return { emailSent: true };
}

export async function signInAnonymously() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    return { error: "Não foi possível entrar. Tente novamente." };
  }

  // Don't create profile yet — display name is captured before first bet
  return { userId: data.user.id };
}

export async function saveDisplayName(name: string) {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { error: "O nome deve ter pelo menos 2 caracteres." };
  }
  if (trimmed.length > 40) {
    return { error: "O nome deve ter no máximo 40 caracteres." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase.from("user_profiles").upsert(
    { id: user.id, display_name: trimmed },
    { onConflict: "id" }
  );

  if (error) {
    return { error: "Não foi possível salvar o nome." };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
